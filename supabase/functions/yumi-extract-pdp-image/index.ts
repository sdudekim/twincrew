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
    const { pdpUrl } = await req.json();

    if (!pdpUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'PDP URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting product image from PDP URL:', pdpUrl);

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Firecrawl to scrape the PDP page
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdpUrl,
        formats: ['html'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape PDP page' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const html = scrapeData.data?.html || scrapeData.html || '';

    // Extract image URLs from the HTML
    // Look for common product image patterns
    const imagePatterns = [
      // Common e-commerce image patterns
      /<img[^>]+(?:data-src|src)=["']([^"']+(?:product|gallery|main|hero)[^"']*\.(?:jpg|jpeg|png|webp))/gi,
      // OpenGraph image
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/gi,
      // Generic large images
      /<img[^>]+(?:data-src|src)=["']([^"']+\.(?:jpg|jpeg|png|webp))["'][^>]*(?:width|height)=["'](?:[5-9]\d{2}|[1-9]\d{3})/gi,
      // Any image with product-related class
      /<img[^>]+class=["'][^"']*(?:product|gallery|main)[^"']*["'][^>]+(?:data-src|src)=["']([^"']+)/gi,
    ];

    const foundImages: string[] = [];

    for (const pattern of imagePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const imageUrl = match[1];
        if (imageUrl && !foundImages.includes(imageUrl)) {
          // Make sure it's a valid URL
          if (imageUrl.startsWith('http') || imageUrl.startsWith('//')) {
            const fullUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl;
            foundImages.push(fullUrl);
          }
        }
      }
    }

    // Fallback: extract all images and filter
    if (foundImages.length === 0) {
      const allImagesPattern = /<img[^>]+(?:data-src|src)=["']([^"']+\.(?:jpg|jpeg|png|webp))/gi;
      let match;
      while ((match = allImagesPattern.exec(html)) !== null) {
        const imageUrl = match[1];
        if (imageUrl && !foundImages.includes(imageUrl)) {
          if (imageUrl.startsWith('http') || imageUrl.startsWith('//')) {
            const fullUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl;
            // Skip small icons and logos
            if (!fullUrl.includes('icon') && !fullUrl.includes('logo') && !fullUrl.includes('sprite')) {
              foundImages.push(fullUrl);
            }
          }
        }
      }
    }

    if (foundImages.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No product images found on the page' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${foundImages.length} product images`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: foundImages[0],
        allImages: foundImages.slice(0, 5) // Return first 5 images
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting PDP image:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to extract product image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
