import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { email, imageUrl, fileName } = await req.json();
    
    console.log("=== Kai Webhook Proxy ===");
    console.log("Email:", email);
    console.log("Image URL:", imageUrl);
    console.log("File Name:", fileName);

    // Forward request to n8n webhook (server-to-server, no CORS)
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        imageUrl,
        fileName,
      }),
    });

    console.log("n8n response status:", response.status);
    const responseText = await response.text();
    console.log("n8n response:", responseText);

    return new Response(JSON.stringify({ 
      success: true, 
      status: response.status,
      message: responseText 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in kai-webhook-proxy:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
