import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      // 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x
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
    
    // Block file protocol attempts
    if (urlString.toLowerCase().startsWith('file:')) {
      return { valid: false, error: "File URLs are not allowed" };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

async function captureScreenshot(
  url: string, 
  apiKey: string, 
  mobile: boolean
): Promise<{ screenshot?: string; error?: string }> {
  const requestBody: any = {
    url: url,
    formats: ["screenshot@fullPage"],
    waitFor: 5000,
  };

  if (mobile) {
    requestBody.mobile = true;
  }

  console.log(`Capturing ${mobile ? 'mobile' : 'PC'} screenshot for:`, url);

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Firecrawl API error (${mobile ? 'mobile' : 'PC'}):`, response.status, errorText);
    return { error: `Failed to capture ${mobile ? 'mobile' : 'PC'} screenshot` };
  }

  const data = await response.json();
  
  if (!data.success) {
    return { error: data.error || `${mobile ? 'Mobile' : 'PC'} scrape failed` };
  }

  return { screenshot: data.data?.screenshot || null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, mode } = await req.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL for SSRF protection
    const urlValidation = isValidExternalUrl(url);
    if (!urlValidation.valid) {
      console.error("URL validation failed:", urlValidation.error);
      return new Response(JSON.stringify({ error: urlValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      console.error("FIRECRAWL_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Firecrawl API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Scraping URL:", url, "Mode:", mode);

    // Handle screenshot-both mode - capture both PC and Mobile screenshots
    if (mode === "screenshot-both") {
      console.log("Capturing both PC and Mobile screenshots...");
      
      // Capture both in parallel
      const [pcResult, mobileResult] = await Promise.all([
        captureScreenshot(url, FIRECRAWL_API_KEY, false),
        captureScreenshot(url, FIRECRAWL_API_KEY, true),
      ]);

      if (pcResult.error && mobileResult.error) {
        return new Response(JSON.stringify({ 
          error: "Failed to capture screenshots",
          details: { pc: pcResult.error, mobile: mobileResult.error }
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Both screenshots captured successfully");
      
      return new Response(JSON.stringify({
        success: true,
        mode: "screenshot-both",
        pcScreenshot: pcResult.screenshot || null,
        mobileScreenshot: mobileResult.screenshot || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const isScreenshot = mode === "screenshot-pc" || mode === "screenshot-mobile";
    const isMobile = mode === "screenshot-mobile";
    
    // Configure formats based on mode
    const formats = isScreenshot ? ["screenshot@fullPage"] : ["markdown"];

    const requestBody: any = {
      url: url,
      formats: formats,
    };

    // Only add onlyMainContent for markdown mode
    if (!isScreenshot) {
      requestBody.onlyMainContent = true;
    } else {
      // Wait for page to fully load before screenshot (5 seconds)
      requestBody.waitFor = 5000;
      
      // Enable mobile viewport for mobile screenshots
      if (isMobile) {
        requestBody.mobile = true;
      }
    }

    console.log("Request body:", JSON.stringify(requestBody));

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Firecrawl API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to scrape URL", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("Firecrawl response keys:", Object.keys(data.data || {}));
    
    if (!data.success) {
      console.error("Firecrawl scrape failed:", data);
      return new Response(JSON.stringify({ error: data.error || "Scrape failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Scrape successful, mode:", mode);

    return new Response(JSON.stringify({ 
      success: true, 
      content: data.data?.markdown || "",
      screenshot: data.data?.screenshot || null,
      metadata: data.data?.metadata || {}
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in maple-scrape:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Scrape failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
