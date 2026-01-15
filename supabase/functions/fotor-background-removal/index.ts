import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const REMOVE_BG_API_KEY = Deno.env.get('REMOVE_BG_API_KEY');
    if (!REMOVE_BG_API_KEY) {
      throw new Error('REMOVE_BG_API_KEY not configured');
    }

    console.log('Processing image with Remove.bg API...');
    console.log('Input base64 length:', imageBase64.length);

    // Create form data for Remove.bg API
    const formData = new FormData();
    formData.append('image_file_b64', imageBase64);
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Remove.bg API error:', response.status, errorText);
      throw new Error(`Remove.bg API error: ${response.status} - ${errorText}`);
    }

    // Get the result image as binary
    const resultBuffer = await response.arrayBuffer();
    const resultBase64 = base64Encode(new Uint8Array(resultBuffer));

    console.log('Background removed successfully, result length:', resultBase64.length);

    return new Response(
      JSON.stringify({ imageBase64: resultBase64 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in background removal:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
