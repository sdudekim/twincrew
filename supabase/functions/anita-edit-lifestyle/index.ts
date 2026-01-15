import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function editLifestyleImage(imageBase64: string, editPrompt: string, lovableApiKey: string): Promise<string> {
  console.log("Editing lifestyle image with prompt:", editPrompt);

  const prompt = `You are a professional photo editor and image manipulation specialist.

TASK: Edit the lifestyle image based on the user's request.

USER'S EDIT REQUEST: "${editPrompt}"

INSTRUCTIONS:
1. Carefully analyze the current lifestyle image
2. Apply the requested edit while maintaining:
   - The same product in the scene
   - Overall image quality and professionalism
   - Natural, realistic appearance
   - Consistent lighting and shadows
3. Make only the changes requested by the user
4. Keep the product clearly visible and properly integrated
5. Maintain the marketing/lifestyle photography quality

Apply the edit now and return the modified image.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
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
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/png;base64,${imageBase64}`,
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
    console.error("Gemini AI error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 402) {
      throw new Error("Payment required. Please add credits to your workspace.");
    }
    throw new Error(`Gemini AI error: ${response.status}`);
  }

  const result = await response.json();
  console.log("Gemini AI edit response received");

  const imageUrl = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) {
    throw new Error("No image generated from edit request");
  }

  // Extract base64 from data URL
  const base64Match = imageUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
  if (!base64Match) {
    throw new Error("Invalid image format from Gemini AI");
  }

  return base64Match[1];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, editPrompt } = await req.json();

    if (!imageBase64) {
      throw new Error("Image is required");
    }
    if (!editPrompt) {
      throw new Error("Edit prompt is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Starting lifestyle image edit with prompt:", editPrompt);

    const editedImageBase64 = await editLifestyleImage(imageBase64, editPrompt, LOVABLE_API_KEY);
    console.log("Image edited successfully, length:", editedImageBase64.length);

    return new Response(
      JSON.stringify({
        success: true,
        imageBase64: editedImageBase64,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in anita-edit-lifestyle:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Edit failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
