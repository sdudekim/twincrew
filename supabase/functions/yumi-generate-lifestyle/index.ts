import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sceneDescription, includeProduct, productImageUrl, aspectRatio = "16:9" } = await req.json();

    if (!sceneDescription) {
      return new Response(
        JSON.stringify({ success: false, error: 'Scene description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating lifestyle image:', { sceneDescription, includeProduct, aspectRatio });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt for lifestyle image generation
    let prompt = "";
    
    if (includeProduct && productImageUrl) {
      prompt = `Create a high-quality lifestyle photography scene for promotional banner. 
Scene description: ${sceneDescription}

Requirements:
- Professional advertising quality
- Warm, inviting atmosphere
- Natural lighting
- The scene should naturally incorporate a product placement area
- Aspect ratio: ${aspectRatio}
- Modern, aspirational lifestyle setting
- Suitable for e-commerce and digital advertising`;
    } else {
      prompt = `Create a high-quality lifestyle photography scene for promotional banner.
Scene description: ${sceneDescription}

Requirements:
- Focus on people and environment, NOT products
- Professional advertising quality
- Warm, inviting atmosphere with natural lighting
- Capture a genuine moment of lifestyle/experience
- Aspect ratio: ${aspectRatio}
- Modern, aspirational lifestyle setting
- Suitable for brand advertising and digital marketing
- Show authentic human connection and emotion`;
    }

    // Call Lovable AI to generate the image
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'API credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extract the generated image
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error('No image in response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ success: false, error: 'No image generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lifestyle image generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: imageData,
        message: data.choices?.[0]?.message?.content || 'Image generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating lifestyle image:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to generate lifestyle image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
