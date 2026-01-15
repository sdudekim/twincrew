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
    const { imageBase64, aspectRatio, customWidth, customHeight } = await req.json();

    if (!imageBase64) {
      throw new Error("Image base64 is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Determine dimensions - custom dimensions take priority
    let width: number, height: number, orientation: string;
    
    if (customWidth && customHeight) {
      width = customWidth;
      height = customHeight;
      if (width > height) {
        orientation = "horizontal landscape";
      } else if (height > width) {
        orientation = "vertical portrait";
      } else {
        orientation = "square";
      }
    } else {
      switch (aspectRatio) {
        case "1:1":
          width = 1080;
          height = 1080;
          orientation = "square";
          break;
        case "9:16":
          width = 1080;
          height = 1920;
          orientation = "vertical portrait";
          break;
        case "16:9":
        default:
          width = 1920;
          height = 1080;
          orientation = "horizontal landscape";
          break;
      }
    }

    // Determine product positioning based on orientation
    let productPosition: string;
    let textOverlayArea: string;
    
    if (width > height) {
      // Landscape - product on the right, text area on the left
      productPosition = "on the RIGHT side of the image";
      textOverlayArea = "the LEFT side should have clean space for text overlay";
    } else if (height > width) {
      // Portrait - product at the bottom, text area on top
      productPosition = "at the BOTTOM of the image";
      textOverlayArea = "the TOP area should have clean space for text overlay";
    } else {
      // Square - product slightly to the right or center-right
      productPosition = "slightly to the RIGHT of center";
      textOverlayArea = "the LEFT side should have some space for potential text overlay";
    }

    console.log(`Resizing lifestyle image to ${width}x${height} - ${orientation}, product ${productPosition}`);

    // Extract base64 data from data URL if present
    let cleanBase64 = imageBase64;
    if (imageBase64.startsWith("data:")) {
      const base64Match = imageBase64.match(/^data:image\/[^;]+;base64,(.+)$/);
      if (base64Match) {
        cleanBase64 = base64Match[1];
      }
    }

    const prompt = `Transform this lifestyle product image to a ${orientation} format (${width}x${height} pixels).

CRITICAL POSITIONING REQUIREMENTS:
1. Identify the main product/subject in the image
2. Position the product ${productPosition} - this is VERY IMPORTANT for text overlay purposes
3. ${textOverlayArea}
4. The product MUST remain FULLY VISIBLE - do NOT crop or cut any part of the product

COMPOSITION GUIDELINES:
- Extend the background/environment naturally to fill the new canvas
- Keep the same lighting, color palette, and professional photography aesthetic
- The product should be the focal point but positioned ${productPosition}
- Create a balanced composition that allows for marketing text to be added later
- The extended areas should blend seamlessly with the existing image

OUTPUT REQUIREMENTS:
- Generate the final image at exactly ${width} pixels wide and ${height} pixels tall
- Maintain high quality and professional appearance`;

    console.log("Sending request to Lovable AI for resize...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${cleanBase64}`,
                },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);

      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (response.status === 402) {
        throw new Error("Payment required. Please add credits to your workspace.");
      }
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Resize response received successfully");

    const imageUrl = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(result).substring(0, 500));
      throw new Error("No image generated from Lovable AI");
    }

    // Extract base64 from data URL
    const base64Match = imageUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image format from Lovable AI");
    }

    console.log(`Successfully resized image to ${width}x${height}`);

    return new Response(
      JSON.stringify({
        success: true,
        imageBase64: base64Match[1],
        dimensions: { width, height },
        orientation,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in anita-resize-lifestyle:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Resize failed" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
