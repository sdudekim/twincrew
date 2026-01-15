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

    console.log("=== Kai Background Removal Proxy ===");
    console.log("Email:", email);
    console.log("File Name:", fileName);
    console.log("File Type:", fileType);
    console.log("Image Base64 Length:", image?.length || 0);
    console.log("Forwarding to n8n webhook...");

    // Forward request to n8n webhook (server-to-server, no CORS issues)
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
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

    console.log("n8n Response Status:", n8nResponse.status);
    
    let responseBody;
    try {
      responseBody = await n8nResponse.text();
      console.log("n8n Response Body:", responseBody);
    } catch (e) {
      console.log("Could not read response body");
      responseBody = "";
    }

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook returned ${n8nResponse.status}: ${responseBody}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Request forwarded to n8n successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("=== Proxy Error ===");
    console.error("Error:", error.message);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
