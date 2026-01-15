import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_WEBHOOK_URL = "https://dev.eaip.lge.com/n8n/webhook/9634011e-6e81-418b-b1e1-55f6653a159d";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, image, fileName, fileType } = await req.json();

    console.log("=== Kai Proxy Request ===");
    console.log("Email:", email);
    console.log("File Name:", fileName);
    console.log("File Type:", fileType);
    console.log("Image Base64 Length:", image?.length || 0);

    // Forward to n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        image,
        fileName,
        fileType,
      }),
    });

    console.log("n8n Response Status:", response.status);

    const responseText = await response.text();
    console.log("n8n Response:", responseText);

    return new Response(JSON.stringify({ success: true, response: responseText }), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in kai-proxy function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
