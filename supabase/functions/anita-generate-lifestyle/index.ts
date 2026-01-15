import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  console.log("Downloading source image...");
  
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status}`);
  }
  
  const imageArrayBuffer = await imageResponse.arrayBuffer();
  return base64Encode(new Uint8Array(imageArrayBuffer));
}

async function generateLifestyleImage(
  productImageBase64: string, 
  lovableApiKey: string, 
  aspectRatio: string = "16:9", 
  country: string | null = null,
  productDimensions: { width?: string; height?: string; depth?: string; raw?: string } | null = null,
  tvMountInfo: { mountType: string | null; isTV: boolean } | null = null
): Promise<string> {
  console.log("Generating lifestyle image with Gemini...", country ? `for ${country}` : "", productDimensions ? `with dimensions: ${JSON.stringify(productDimensions)}` : "", tvMountInfo ? `TV mount: ${JSON.stringify(tvMountInfo)}` : "");

  // Determine dimensions based on aspect ratio
  let width: number, height: number;
  switch (aspectRatio) {
    case "1:1":
      width = 1080;
      height = 1080;
      break;
    case "9:16":
      width = 1080;
      height = 1920;
      break;
    case "16:9":
    default:
      width = 1920;
      height = 1080;
      break;
  }

  // Product dimensions context for accurate sizing
  const dimensionsContext = productDimensions ? `
PRODUCT PHYSICAL DIMENSIONS:
${productDimensions.raw ? `- Overall size: ${productDimensions.raw}` : ''}
${productDimensions.width ? `- Width: ${productDimensions.width}` : ''}
${productDimensions.height ? `- Height: ${productDimensions.height}` : ''}
${productDimensions.depth ? `- Depth: ${productDimensions.depth}` : ''}

CRITICAL SIZE ACCURACY INSTRUCTIONS:
- Use these exact dimensions to determine the product's real-world scale
- Place the product in the scene with ACCURATE proportions relative to furniture and surroundings
- A 1000mm tall refrigerator should appear roughly human-height in the scene
- A 500mm tall washing machine should appear waist-height when placed on the floor
- Compare product dimensions to standard furniture sizes (sofa ~85cm height, dining table ~75cm height, door ~200cm height)
- The product should look naturally sized - not too large or too small for the space
- Use reference objects in the scene to establish correct scale perception
` : '';

  // TV mount type specific instructions
  const tvMountContext = (tvMountInfo?.isTV && tvMountInfo?.mountType) ? `
⚠️ CRITICAL TV PLACEMENT INSTRUCTIONS:
This is a TV product with ${tvMountInfo.mountType === 'stand' ? 'STAND' : 'WALL-MOUNT'} configuration.

${tvMountInfo.mountType === 'stand' ? `
**STAND VERSION TV - MANDATORY REQUIREMENTS:**
- The TV MUST be placed on a TV stand, entertainment center, console table, or media cabinet
- The TV stand/base MUST be visible and resting on furniture
- NEVER mount this TV on a wall - it has a stand and must be shown with the stand
- Show the TV sitting on furniture like: TV console, media cabinet, sideboard, or floating shelf unit
- The stand/base of the TV should be clearly visible on the furniture surface
- Typical placement: On a wooden/modern TV unit with the stand feet touching the surface
` : `
**WALL-MOUNT VERSION TV - MANDATORY REQUIREMENTS:**
- The TV MUST be mounted flush against the wall
- NEVER show this TV on a stand or furniture - it is designed for wall mounting
- The TV should appear to float on the wall with minimal gap (zero-gap or slim mount)
- No TV stand or base should be visible
- Below the TV can be a low console for devices, but the TV itself is ON THE WALL
- Create a clean, floating appearance typical of wall-mounted displays
`}

IMPORTANT: Violating these placement rules will result in an incorrect product representation.
The ${tvMountInfo.mountType === 'stand' ? 'stand-based' : 'wall-mounted'} configuration is a key product feature that must be accurately depicted.
` : '';
  const countryContext = country ? `
TARGET MARKET: ${country}
Create a lifestyle scene that resonates with ${country} consumers:
- Use interior design styles, furniture, and decor typical of ${country} homes
- Reflect the cultural preferences and aesthetic sensibilities of ${country}
- Consider typical home layouts and living spaces in ${country}
- Include elements that feel authentic and aspirational for ${country} market
- If applicable, consider climate and lifestyle patterns typical of ${country}

For example:
- South Korea: Modern minimalist apartments, ondol floor heating, compact but stylish spaces
- Japan: Clean, organized spaces with natural materials, zen-like simplicity
- United States: Spacious open-concept homes, casual comfortable lifestyle
- Germany: Functional, efficient design with quality craftsmanship
- United Kingdom: Mix of traditional and modern, cozy home atmosphere
- France: Elegant, sophisticated interiors with classic touches
- Italy: Warm Mediterranean aesthetics, stylish and artistic
- Brazil: Vibrant colors, tropical elements, warm family-oriented spaces
- India: Rich colors and textures, blend of traditional and modern
- China: Balance of contemporary and traditional Chinese elements
- Middle East (UAE, Saudi Arabia): Luxurious, opulent interiors
- Australia: Indoor-outdoor living, bright natural light
` : '';

  const prompt = `You are a professional lifestyle photographer and product placement specialist.

TASK: Create a stunning lifestyle marketing image at ${width}x${height} resolution (${aspectRatio} aspect ratio).
${tvMountContext}
${dimensionsContext}
${countryContext}
INSTRUCTIONS:
1. First, analyze the product in the image - identify what type of product it is (electronics, appliance, furniture, etc.)
2. Based on the product type, determine the ideal target persona:
   - Premium electronics → Modern professional, tech-savvy lifestyle
   - Home appliances → Family-oriented, comfortable modern home
   - Beauty/personal care → Wellness-focused, self-care lifestyle
   - Kitchen appliances → Culinary enthusiast, home chef lifestyle
   - Audio/Visual equipment → Entertainment lover, music/movie enthusiast
   - TV/Display → Luxurious living room, home theater experience

3. Create a lifestyle scene that:
   - Matches the identified persona's aspirational environment
   - Places the product naturally as if in actual use or display
   - Uses appropriate lighting for the product type (warm for home, bright for tech)
   - Includes contextual elements that tell a story about the user's lifestyle
   - Feels like a high-end catalog or magazine advertisement
   ${productDimensions ? '- MAINTAINS ACCURATE PRODUCT SIZE based on the provided dimensions' : ''}

4. Technical requirements:
   - Professional photography quality
   - Natural, realistic lighting with subtle shadows
   - Product should be clearly visible and prominently featured
   - Background should complement, not distract from the product
   - Color harmony between product and environment
   ${productDimensions ? '- Product scale must be realistic relative to surrounding furniture and space' : ''}

Generate the lifestyle image now.`;

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
                url: `data:image/png;base64,${productImageBase64}`,
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
  console.log("Gemini AI response received");

  const imageUrl = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) {
    throw new Error("No image generated from Gemini AI");
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
    const { imageUrl, aspectRatio = "16:9", country = null, productDimensions = null, tvMountInfo = null } = await req.json();

    if (!imageUrl) {
      throw new Error("Image URL is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Starting lifestyle image generation for:", imageUrl, "with aspect ratio:", aspectRatio, "country:", country, "dimensions:", productDimensions, "tvMount:", tvMountInfo);

    // Step 1: Download image
    console.log("Step 1: Downloading product image...");
    const productImageBase64 = await downloadImageAsBase64(imageUrl);
    console.log("Image downloaded, length:", productImageBase64.length);

    // Step 2: Generate lifestyle image with Gemini
    console.log("Step 2: Generating lifestyle image with Gemini...");
    const lifestyleImageBase64 = await generateLifestyleImage(productImageBase64, LOVABLE_API_KEY, aspectRatio, country, productDimensions, tvMountInfo);
    console.log("Lifestyle image generated, length:", lifestyleImageBase64.length);

    return new Response(
      JSON.stringify({
        success: true,
        imageBase64: lifestyleImageBase64,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in anita-generate-lifestyle:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Generation failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
