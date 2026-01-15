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

// Product size category mapping based on product type
type SizeCategory = 'L' | 'M' | 'S';

const PRODUCT_SIZE_MAP: Record<string, SizeCategory> = {
  // Large (대)
  'refrigerator': 'L',
  'fridge': 'L',
  'washtower': 'L',
  'wash-tower': 'L',
  'soundbar': 'L',
  'tv': 'L',
  'oled': 'L',
  'qned': 'L',
  'nanocell': 'L',
  'monitor': 'L',
  'styler': 'L',
  
  // Medium (중)
  'washer': 'M',
  'washing': 'M',
  'dryer': 'M',
  'vacuum': 'M',
  'cordzero': 'M',
  'standbyme': 'M',
  'stanbyme': 'M',
  'projector': 'M',
  'cinebeam': 'M',
  'laptop': 'M',
  'gram': 'M',
  'dishwasher': 'M',
  'air-conditioner': 'M',
  'airconditioner': 'M',
  'microwave': 'M',
  'dehumidifier': 'M',
  'air-purifier': 'M',
  'puricare': 'M',
  
  // Small (소)
  'earbuds': 'S',
  'tone-free': 'S',
  'tonefree': 'S',
  'headphones': 'S',
  'speaker': 'S',
  'xboom': 'S',
};

function detectProductCategory(url: string): SizeCategory {
  const lowerUrl = url.toLowerCase();
  for (const [keyword, size] of Object.entries(PRODUCT_SIZE_MAP)) {
    if (lowerUrl.includes(keyword)) {
      console.log(`Detected product keyword: ${keyword} -> Size: ${size}`);
      return size;
    }
  }
  console.log("No product keyword matched, defaulting to Medium");
  return 'M'; // Default to medium if no match
}

// CSS selector to match: #swiper-wrapper-* > div.cmp-carousel__item.swiper-slide.swiper-slide-active > div > div > div > img
function extractFirstCarouselImage(html: string): string | null {
  // Priority 1: Look for swiper-slide-active (first/current slide)
  const activeSlideRegex = /<div[^>]*class="[^"]*swiper-slide-active[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>/i;
  const activeMatch = activeSlideRegex.exec(html);
  if (activeMatch && activeMatch[1] && !activeMatch[1].includes('logo') && !activeMatch[1].endsWith('.svg')) {
    console.log("Found active slide image:", activeMatch[1]);
    return activeMatch[1];
  }
  
  // Priority 2: Look for first cmp-carousel__item with img
  const carouselItemRegex = /<div[^>]*class="[^"]*cmp-carousel__item[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>/i;
  const carouselMatch = carouselItemRegex.exec(html);
  if (carouselMatch && carouselMatch[1] && !carouselMatch[1].includes('logo') && !carouselMatch[1].endsWith('.svg')) {
    console.log("Found carousel item image:", carouselMatch[1]);
    return carouselMatch[1];
  }
  
  // Priority 3: Look for first swiper-slide with img
  const swiperSlideRegex = /<div[^>]*class="[^"]*swiper-slide[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>/i;
  const swiperMatch = swiperSlideRegex.exec(html);
  if (swiperMatch && swiperMatch[1] && !swiperMatch[1].includes('logo') && !swiperMatch[1].endsWith('.svg')) {
    console.log("Found swiper slide image:", swiperMatch[1]);
    return swiperMatch[1];
  }
  
  console.log("No carousel image found");
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
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

    console.log("Extracting images from URL:", url);
    
    // Detect product size category from URL
    const sizeCategory = detectProductCategory(url);
    console.log("Product size category:", sizeCategory);

    // Get rawHtml to parse for images
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        formats: ["rawHtml"],
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Firecrawl API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to scrape URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error("Firecrawl scrape failed:", data);
      return new Response(JSON.stringify({ error: "Scrape failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = data.data?.rawHtml || "";
    console.log("HTML length:", html.length);
    
    const firstImage = extractFirstCarouselImage(html);
    
    console.log("First carousel image URL:", firstImage);

    return new Response(JSON.stringify({ 
      success: true, 
      imageUrl: firstImage,
      sizeCategory: sizeCategory,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ben-extract-images:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Extract failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
