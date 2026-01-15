import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productImageUrl, backgroundImageBase64 } = await req.json();

    if (!productImageUrl || !backgroundImageBase64) {
      return new Response(
        JSON.stringify({ error: "Product image URL and background image are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting photo composition...");
    console.log("Product image URL:", productImageUrl.substring(0, 100));

    // First, remove background from product image using Fotor
    const FOTOR_API_KEY = Deno.env.get("FOTOR_API_KEY");
    if (!FOTOR_API_KEY) {
      return new Response(
        JSON.stringify({ error: "FOTOR_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Removing background from product image...");

    // Create Fotor background removal task
    const fotorCreateResponse = await fetch("https://api-b.fotor.com/v1/aiart/backgroundremover", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FOTOR_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl: productImageUrl }),
    });

    if (!fotorCreateResponse.ok) {
      console.error("Fotor create task error:", fotorCreateResponse.status);
      throw new Error("Failed to create background removal task");
    }

    const fotorCreateData = await fotorCreateResponse.json();
    const taskId = fotorCreateData.data?.taskId;
    
    if (!taskId) {
      throw new Error("No task ID received from Fotor");
    }

    console.log("Fotor task created:", taskId);

    // Poll for task completion
    let productImageBase64 = null;
    const maxAttempts = 30;
    
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`https://api-b.fotor.com/v1/aiart/backgroundremover/${taskId}`, {
        headers: { "Authorization": `Bearer ${FOTOR_API_KEY}` },
      });
      
      if (!statusResponse.ok) continue;
      
      const statusData = await statusResponse.json();
      console.log("Task status:", statusData.data?.status);
      
      if (statusData.data?.status === "completed" && statusData.data?.resultUrl) {
        // Download the result image
        const imageResponse = await fetch(statusData.data.resultUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        productImageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
        console.log("Background removed successfully");
        break;
      } else if (statusData.data?.status === "failed") {
        throw new Error("Background removal failed");
      }
    }

    if (!productImageBase64) {
      throw new Error("Background removal timed out");
    }

    // Now use AI to composite the product into the background photo
    console.log("Compositing product into background scene...");

    const compositeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are given two images:
1. A background scene photo (first image)
2. A product with transparent background (second image)

Your task: Composite the product naturally into the background scene.
- Find an appropriate empty space or surface in the background where the product would naturally fit
- Place the product at a realistic scale relative to the scene
- Match the lighting and perspective of the scene
- Make it look like the product was actually photographed in that location
- The product should look natural and well-integrated, not floating or out of place
- Maintain the product's original appearance and details`
              },
              {
                type: "image_url",
                image_url: { url: backgroundImageBase64 }
              },
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${productImageBase64}` }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!compositeResponse.ok) {
      const errorText = await compositeResponse.text();
      console.error("AI composition error:", compositeResponse.status, errorText);
      throw new Error("Failed to composite image");
    }

    const compositeData = await compositeResponse.json();
    console.log("AI response received");

    const generatedImageUrl = compositeData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImageUrl) {
      console.error("No image in response:", JSON.stringify(compositeData).substring(0, 500));
      throw new Error("No image generated");
    }

    // Extract base64 from data URL
    const base64Match = generatedImageUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
    const imageBase64 = base64Match ? base64Match[1] : generatedImageUrl;

    console.log("Photo composition completed successfully");

    return new Response(
      JSON.stringify({ success: true, imageBase64 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in anita-photo-composite:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Composition failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
