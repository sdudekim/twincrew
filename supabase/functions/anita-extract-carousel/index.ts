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

// Extract product gallery images from various gallery patterns
function extractCarouselImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  console.log("=== Extracting gallery images ===");

  const addImage = (src: string, source: string) => {
    if (!src) return false;
    
    // Keep full URL including /jcr:content/ for proper image loading
    // Only use cleaned version for deduplication
    let dedupKey = src;
    const jcrIndex = src.indexOf('/jcr:content');
    if (jcrIndex > 0) {
      dedupKey = src.substring(0, jcrIndex);
    }
    
    if (seen.has(dedupKey)) return false;
    
    // Filter out non-product images
    if (src.endsWith('.svg')) return false;
    if (src.includes('logo')) return false;
    if (src.includes('qrcode') || src.includes('qr-code')) return false;
    if (src.includes('icon')) return false;
    if (src.includes('placeholder')) return false;
    if (src.includes('spinner') || src.includes('loading')) return false;
    
    seen.add(dedupKey);
    // Use original src (with jcr:content) for full quality images
    const fullUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href;
    images.push(fullUrl);
    console.log(`✓ [${source}] Image ${images.length}:`, fullUrl.substring(0, 100));
    return true;
  };

  // Pattern 1: Swiper wrapper (LG specific)
  const swiperMatch = html.match(/(<div[^>]*id="swiper-wrapper-[^"]*"[^>]*>)([\s\S]*?)(<div[^>]*class="[^"]*swiper-button|<div[^>]*class="[^"]*swiper-pagination)/i);
  
  if (swiperMatch) {
    console.log("Found swiper wrapper pattern");
    const swiperContent = swiperMatch[2];
    const items = swiperContent.split(/<div[^>]*class="cmp-carousel__item\s+swiper-slide\s+c-carousel__item[^"]*"[^>]*>/i);
    
    for (let i = 1; i < items.length && i <= 20; i++) {
      const itemContent = items[i];
      const imgSrcMatch = itemContent.match(/<img[^>]*\ssrc="([^"]+)"/i);
      if (imgSrcMatch) {
        addImage(imgSrcMatch[1], `swiper-${i}`);
      } else {
        const dataSrcMatch = itemContent.match(/<img[^>]*\sdata-src="([^"]+)"/i);
        if (dataSrcMatch) {
          addImage(dataSrcMatch[1], `swiper-data-${i}`);
        }
      }
    }
  }

  // Pattern 2: Generic swiper-slide pattern
  if (images.length === 0) {
    console.log("Trying generic swiper-slide pattern");
    const slideMatches = html.matchAll(/<div[^>]*class="[^"]*swiper-slide[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*swiper-slide|<\/div>\s*<\/div>)/gi);
    let count = 0;
    for (const match of slideMatches) {
      if (count >= 20) break;
      const imgMatch = match[1].match(/<img[^>]*(?:src|data-src)="([^"]+)"/i);
      if (imgMatch) {
        addImage(imgMatch[1], `slide-${count}`);
        count++;
      }
    }
  }

  // Pattern 3: Product gallery with data-gallery attribute
  if (images.length === 0) {
    console.log("Trying data-gallery pattern");
    const galleryMatch = html.match(/<[^>]*data-gallery[^>]*>([\s\S]*?)(?=<\/section>|<\/div>\s*<\/div>\s*<\/div>)/i);
    if (galleryMatch) {
      const imgMatches = galleryMatch[1].matchAll(/<img[^>]*(?:src|data-src)="([^"]+)"/gi);
      for (const match of imgMatches) {
        addImage(match[1], 'gallery');
      }
    }
  }

  // Pattern 4: Product image containers (common class patterns)
  if (images.length === 0) {
    console.log("Trying product-image class patterns");
    const patterns = [
      /class="[^"]*(?:product-image|pdp-image|gallery-image|hero-image)[^"]*"[^>]*>[\s\S]*?<img[^>]*(?:src|data-src)="([^"]+)"/gi,
      /<img[^>]*class="[^"]*(?:product-image|pdp-image|gallery-image|hero-image)[^"]*"[^>]*(?:src|data-src)="([^"]+)"/gi,
    ];
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        addImage(match[1], 'product-class');
      }
    }
  }

  // Pattern 5: OG image as fallback
  if (images.length === 0) {
    console.log("Trying og:image fallback");
    const ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                    html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
    if (ogMatch) {
      addImage(ogMatch[1], 'og-image');
    }
  }

  // Pattern 6: Large product images (look for images with product-like URLs)
  if (images.length === 0) {
    console.log("Trying large image pattern");
    const imgMatches = html.matchAll(/<img[^>]*(?:src|data-src)="([^"]+)"/gi);
    for (const match of imgMatches) {
      const src = match[1];
      // Filter for likely product images
      if (
        (src.includes('/images/') || src.includes('/product') || src.includes('/media/')) &&
        !src.includes('thumb') &&
        !src.includes('icon') &&
        !src.includes('badge')
      ) {
        addImage(src, 'large-img');
        if (images.length >= 10) break;
      }
    }
  }

  // Already deduplicated during extraction, just return
  console.log(`=== Total unique gallery images: ${images.length} ===`);
  return images;
}

// Extract product dimensions from Spec section
function extractProductDimensions(html: string): { width?: string; height?: string; depth?: string; raw?: string } | null {
  console.log("=== Extracting product dimensions ===");
  
  const dimensions: { width?: string; height?: string; depth?: string; raw?: string } = {};
  
  // Pattern for "Size (W x H x D)" format common in LG spec tables
  const sizeWHDMatch = html.match(/(?:size|dimension)[^<]*?\(?\s*W\s*[x×]\s*H\s*[x×]\s*D\s*\)?[^<]*?(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(mm|cm)?/i);
  if (sizeWHDMatch) {
    dimensions.width = sizeWHDMatch[1] + (sizeWHDMatch[4] || 'mm');
    dimensions.height = sizeWHDMatch[2] + (sizeWHDMatch[4] || 'mm');
    dimensions.depth = sizeWHDMatch[3] + (sizeWHDMatch[4] || 'mm');
    dimensions.raw = `${sizeWHDMatch[1]} x ${sizeWHDMatch[2]} x ${sizeWHDMatch[3]} ${sizeWHDMatch[4] || 'mm'}`;
    console.log("Found W x H x D dimensions:", dimensions);
    return dimensions;
  }

  // Pattern for table rows with dimension labels
  const widthMatch = html.match(/(?:<td[^>]*>|<th[^>]*>|<dt[^>]*>|<span[^>]*>)[^<]*(?:width|가로|W)[^<]*(?:<\/td>|<\/th>|<\/dt>|<\/span>)[^<]*(?:<td[^>]*>|<dd[^>]*>|<span[^>]*>)[^<]*?(\d+(?:\.\d+)?)\s*(mm|cm)?/i);
  const heightMatch = html.match(/(?:<td[^>]*>|<th[^>]*>|<dt[^>]*>|<span[^>]*>)[^<]*(?:height|높이|세로|H)[^<]*(?:<\/td>|<\/th>|<\/dt>|<\/span>)[^<]*(?:<td[^>]*>|<dd[^>]*>|<span[^>]*>)[^<]*?(\d+(?:\.\d+)?)\s*(mm|cm)?/i);
  const depthMatch = html.match(/(?:<td[^>]*>|<th[^>]*>|<dt[^>]*>|<span[^>]*>)[^<]*(?:depth|깊이|D)[^<]*(?:<\/td>|<\/th>|<\/dt>|<\/span>)[^<]*(?:<td[^>]*>|<dd[^>]*>|<span[^>]*>)[^<]*?(\d+(?:\.\d+)?)\s*(mm|cm)?/i);

  if (widthMatch) dimensions.width = widthMatch[1] + (widthMatch[2] || 'mm');
  if (heightMatch) dimensions.height = heightMatch[1] + (heightMatch[2] || 'mm');
  if (depthMatch) dimensions.depth = depthMatch[1] + (depthMatch[2] || 'mm');

  // Also try to find raw dimension string for complex formats
  const rawDimensionMatch = html.match(/(?:dimension|size|spec)[^<]*?[:\s]*(\d+(?:\.\d+)?(?:\s*[x×]\s*\d+(?:\.\d+)?){1,2})\s*(mm|cm|inch)?/i);
  if (rawDimensionMatch) {
    dimensions.raw = rawDimensionMatch[1] + ' ' + (rawDimensionMatch[2] || 'mm');
  }

  if (Object.keys(dimensions).length > 0) {
    console.log("Found dimensions:", dimensions);
    return dimensions;
  }

  console.log("No dimensions found in spec section");
  return null;
}

// Extract TV mount type (Stand or Wall-mount) from product info
function extractTvMountType(html: string, url: string): { mountType: string | null; isTV: boolean } {
  console.log("=== Checking TV mount type ===");
  
  const result: { mountType: string | null; isTV: boolean } = { mountType: null, isTV: false };
  
  // Check if this is a TV product
  const lowerHtml = html.toLowerCase();
  const lowerUrl = url.toLowerCase();
  
  const tvIndicators = [
    'oled tv', 'qned tv', 'led tv', 'lcd tv', 'uhd tv', '4k tv', '8k tv',
    'nanocell', 'smart tv', 'television', 'inch tv', '"tv', 'tv-',
    '/tvs/', '/tv/', 'oled-tv', 'qned-tv', 'ultra-hd-tv'
  ];
  
  const isTV = tvIndicators.some(indicator => lowerHtml.includes(indicator) || lowerUrl.includes(indicator));
  
  if (!isTV) {
    console.log("Product is not a TV, skipping mount type detection");
    return result;
  }
  
  result.isTV = true;
  console.log("Product identified as TV, checking mount type...");
  
  // Check URL patterns first (most reliable)
  if (lowerUrl.includes('wall') || lowerUrl.includes('wallmount') || lowerUrl.includes('wall-mount')) {
    result.mountType = 'wall-mount';
    console.log("Mount type from URL: wall-mount");
    return result;
  }
  
  if (lowerUrl.includes('stand') || lowerUrl.includes('with-stand') || lowerUrl.includes('withstand')) {
    result.mountType = 'stand';
    console.log("Mount type from URL: stand");
    return result;
  }
  
  // Check product title/name patterns
  const titlePatterns = [
    /<title[^>]*>([^<]+)<\/title>/i,
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    /<meta[^>]*name="product[_-]?name"[^>]*content="([^"]+)"/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match) {
      const title = match[1].toLowerCase();
      if (title.includes('wall') || title.includes('wallmount') || title.includes('wall-mount') || title.includes('wall mount')) {
        result.mountType = 'wall-mount';
        console.log("Mount type from title: wall-mount");
        return result;
      }
      if (title.includes('stand') || title.includes('with stand') || title.includes('withstand')) {
        result.mountType = 'stand';
        console.log("Mount type from title: stand");
        return result;
      }
    }
  }
  
  // Check for stand/mount indicators in spec tables or product description
  const standPatterns = [
    /(?:include|with|come)[^<]*stand/i,
    /stand[^<]*(?:include|attach)/i,
    /\bstand\s*type\b/i,
    /(?:floor|table|desk)\s*stand/i,
    /swivel\s*stand/i,
    /center\s*stand/i,
    /wide\s*stand/i
  ];
  
  const wallPatterns = [
    /wall[- ]?mount(?:ed|ing)?/i,
    /(?:mount|hang)[^<]*wall/i,
    /vesa[^<]*mount/i,
    /wall[- ]?bracket/i,
    /flush[- ]?mount/i,
    /slim[- ]?wall/i,
    /zero[- ]?gap[- ]?wall/i
  ];
  
  // Count pattern matches
  let standScore = 0;
  let wallScore = 0;
  
  for (const pattern of standPatterns) {
    if (pattern.test(html)) {
      standScore++;
    }
  }
  
  for (const pattern of wallPatterns) {
    if (pattern.test(html)) {
      wallScore++;
    }
  }
  
  console.log(`Stand score: ${standScore}, Wall score: ${wallScore}`);
  
  // Check product images for stand visibility indicators
  const hasStandImages = /stand.*image|image.*stand|gallery.*stand/i.test(html);
  const hasWallImages = /wall.*mount.*image|flush.*wall/i.test(html);
  
  if (hasStandImages) standScore += 2;
  if (hasWallImages) wallScore += 2;
  
  // Determine mount type based on scores
  if (wallScore > standScore && wallScore >= 2) {
    result.mountType = 'wall-mount';
  } else if (standScore > wallScore && standScore >= 1) {
    result.mountType = 'stand';
  } else if (standScore === 0 && wallScore === 0) {
    // Default: most consumer TVs come with stand
    result.mountType = 'stand';
    console.log("No explicit mount info found, defaulting to stand (common configuration)");
  }
  
  console.log(`Final mount type determination: ${result.mountType}`);
  return result;
}

// Extract product name from HTML
function extractProductName(html: string, url: string): string {
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
                       html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);
  if (ogTitleMatch) {
    return cleanProductName(ogTitleMatch[1]);
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return cleanProductName(titleMatch[1]);
  }

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    return cleanProductName(h1Match[1]);
  }

  const urlParts = url.split('/').filter(p => p && !p.includes('www.') && !p.includes('.com'));
  const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || 'product';
  return cleanProductName(lastPart.replace(/-/g, ' '));
}

function cleanProductName(name: string): string {
  return name
    .replace(/\s*[|\-–—]\s*LG.*$/i, '')
    .replace(/\s*[|\-–—]\s*Buy.*$/i, '')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50)
    .trim() || 'product';
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
      console.error("FIRECRAWL_API_KEY not found in environment");
      return new Response(JSON.stringify({ error: "Firecrawl API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Extracting carousel images from URL:", url);
    console.log("Starting Firecrawl API call...");

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        formats: ["rawHtml"],
        waitFor: 8000, // Reduced from 15000 to avoid timeout
      }),
    });

    console.log("Firecrawl API response status:", response.status);
    console.log("Firecrawl API response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Firecrawl API error response:", errorText);
      return new Response(JSON.stringify({ 
        error: "Failed to scrape URL",
        details: `Status: ${response.status}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("Firecrawl response success:", data.success);

    if (!data.success) {
      console.error("Firecrawl scrape failed:", data.error || "Unknown error");
      return new Response(JSON.stringify({ 
        error: "Scrape failed",
        details: data.error || "Unknown Firecrawl error"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = data.data?.rawHtml || "";
    console.log("HTML length:", html.length);

    if (html.length === 0) {
      console.error("Empty HTML received from Firecrawl");
      return new Response(JSON.stringify({ 
        error: "Empty HTML received from page",
        details: "The page may be protected or require authentication"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const images = extractCarouselImages(html, url);
    const productName = extractProductName(html, url);
    const productDimensions = extractProductDimensions(html);
    const tvMountInfo = extractTvMountType(html, url);
    
    console.log("Total images extracted:", images.length);
    console.log("Product name:", productName);
    console.log("Product dimensions:", productDimensions);
    console.log("TV mount info:", tvMountInfo);

    return new Response(JSON.stringify({
      success: true,
      images: images,
      productName: productName,
      productDimensions: productDimensions,
      tvMountInfo: tvMountInfo,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in anita-extract-carousel:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Extract failed",
      details: "An unexpected error occurred during extraction"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
