import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SSRF protection: Validate URLs to prevent internal network access
function isValidExternalUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);
    
    // Only allow https protocol
    if (url.protocol !== 'https:') {
      return { valid: false, error: "Only HTTPS URLs are allowed" };
    }
    
    const hostname = url.hostname.toLowerCase();
    
    // Block localhost and loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { valid: false, error: "Localhost URLs are not allowed" };
    }
    
    // Block private IP ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b, c] = ipv4Match.map(Number);
      if (
        a === 10 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 169 && b === 254) ||
        a === 127
      ) {
        return { valid: false, error: "Private IP addresses are not allowed" };
      }
    }
    
    // Block AWS/cloud metadata endpoints
    if (hostname === '169.254.169.254' || hostname.includes('metadata')) {
      return { valid: false, error: "Metadata endpoints are not allowed" };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  console.log("Downloading image:", imageUrl);
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const base64 = base64Encode(uint8Array);
  console.log("Image downloaded, base64 length:", base64.length);
  return base64;
}

async function removeBackgroundWithRemoveBg(imageUrl: string, apiKey: string): Promise<string> {
  console.log("Processing image with Remove.bg:", imageUrl);

  // Step 1: Download image and convert to base64
  const imageBase64 = await downloadImageAsBase64(imageUrl);

  // Step 2: Call Remove.bg API
  console.log("Calling Remove.bg API...");
  const formData = new FormData();
  formData.append('image_file_b64', imageBase64);
  formData.append('size', 'auto');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Remove.bg API error:", response.status, errorText);
    throw new Error(`Remove.bg API error: ${response.status}`);
  }

  // Get the result image as base64
  const resultBuffer = await response.arrayBuffer();
  const resultBase64 = base64Encode(new Uint8Array(resultBuffer));
  
  console.log("Background removed, result base64 length:", resultBase64.length);
  return `data:image/png;base64,${resultBase64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mainImageUrl, secondImageUrl } = await req.json();

    if (!mainImageUrl || !secondImageUrl) {
      return new Response(JSON.stringify({ error: "Both image URLs are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URLs for SSRF protection
    const mainUrlValidation = isValidExternalUrl(mainImageUrl);
    if (!mainUrlValidation.valid) {
      console.error("Main URL validation failed:", mainUrlValidation.error);
      return new Response(JSON.stringify({ error: `Main image: ${mainUrlValidation.error}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const secondUrlValidation = isValidExternalUrl(secondImageUrl);
    if (!secondUrlValidation.valid) {
      console.error("Second URL validation failed:", secondUrlValidation.error);
      return new Response(JSON.stringify({ error: `Second image: ${secondUrlValidation.error}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const REMOVE_BG_API_KEY = Deno.env.get("REMOVE_BG_API_KEY");
    if (!REMOVE_BG_API_KEY) {
      throw new Error("REMOVE_BG_API_KEY not configured");
    }

    console.log("Processing images:");
    console.log("Main:", mainImageUrl);
    console.log("Second:", secondImageUrl);

    // Remove backgrounds from both images sequentially to avoid rate limits
    console.log("Processing main image...");
    const mainBase64 = await removeBackgroundWithRemoveBg(mainImageUrl, REMOVE_BG_API_KEY);
    
    console.log("Processing second image...");
    const secondBase64 = await removeBackgroundWithRemoveBg(secondImageUrl, REMOVE_BG_API_KEY);

    console.log("Both images processed successfully");

    return new Response(JSON.stringify({
      success: true,
      mainImage: mainBase64,
      secondImage: secondBase64,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ben-process-images:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Processing failed" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
