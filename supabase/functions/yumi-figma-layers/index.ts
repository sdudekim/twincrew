import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fixed Figma file configuration
const FIGMA_CONFIG = {
  fileKey: "2pFBBAAUfwvuw0xLy7nGgJ",
  fileName: "Promotion-Banners"
};

// Cache TTL in minutes
const CACHE_TTL_MINUTES = 30;

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  characters?: string;
  children?: FigmaNode[];
  fills?: any[];
}

interface ExtractedLayer {
  id: string;
  name: string;
  type: "TEXT" | "IMAGE" | "COMPONENT";
  currentValue: string | null;
  path: string;
}

function extractLayers(node: FigmaNode, path: string = ""): ExtractedLayer[] {
  const layers: ExtractedLayer[] = [];
  const currentPath = path ? `${path} > ${node.name}` : node.name;

  // Extract TEXT layers
  if (node.type === "TEXT" && node.characters) {
    layers.push({
      id: node.id,
      name: node.name,
      type: "TEXT",
      currentValue: node.characters,
      path: currentPath
    });
  }

  // Extract IMAGE layers (RECTANGLE with image fills)
  if ((node.type === "RECTANGLE" || node.type === "FRAME" || node.type === "INSTANCE") && node.fills) {
    const hasImageFill = node.fills.some((fill: any) => fill.type === "IMAGE");
    if (hasImageFill) {
      layers.push({
        id: node.id,
        name: node.name,
        type: "IMAGE",
        currentValue: null,
        path: currentPath
      });
    }
  }

  // Recursively process children
  if (node.children) {
    for (const child of node.children) {
      layers.push(...extractLayers(child, currentPath));
    }
  }

  return layers;
}

// Simple delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with exponential backoff for rate limiting
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const waitTime = (attempt + 1) * 30000;
      console.log(`Rate limited. Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries}`);
      await delay(waitTime);
      continue;
    }
    
    return response;
  }
  
  throw new Error('RATE_LIMIT_EXCEEDED');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIGMA_ACCESS_TOKEN = Deno.env.get('FIGMA_ACCESS_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!FIGMA_ACCESS_TOKEN) {
      throw new Error('FIGMA_ACCESS_TOKEN is not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check database cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('figma_cache')
      .select('*')
      .eq('file_key', FIGMA_CONFIG.fileKey)
      .single();

    if (!cacheError && cachedData) {
      const expiresAt = new Date(cachedData.expires_at);
      const now = new Date();

      if (expiresAt > now) {
        console.log('Returning cached Figma data from database');
        return new Response(JSON.stringify({
          success: true,
          fileName: cachedData.file_name,
          fileKey: cachedData.file_key,
          ...cachedData.layers,
          fromCache: true,
          cachedAt: cachedData.cached_at,
          expiresAt: cachedData.expires_at
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.log('Database cache expired, fetching fresh data');
      }
    }

    console.log(`Fetching Figma file: ${FIGMA_CONFIG.fileKey}`);

    // Fetch Figma file structure with retry
    let figmaResponse: Response;
    try {
      figmaResponse = await fetchWithRetry(
        `https://api.figma.com/v1/files/${FIGMA_CONFIG.fileKey}`,
        {
          headers: {
            'X-Figma-Token': FIGMA_ACCESS_TOKEN,
          },
        }
      );
    } catch (error) {
      // If rate limited and we have expired cache, use it as fallback
      if (error.message === 'RATE_LIMIT_EXCEEDED' && cachedData) {
        console.log('Rate limited, using expired cache as fallback');
        return new Response(JSON.stringify({
          success: true,
          fileName: cachedData.file_name,
          fileKey: cachedData.file_key,
          ...cachedData.layers,
          fromCache: true,
          isExpiredCache: true,
          cachedAt: cachedData.cached_at
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }

    if (!figmaResponse.ok) {
      const errorText = await figmaResponse.text();
      console.error('Figma API error:', figmaResponse.status, errorText);
      
      if (figmaResponse.status === 429) {
        // If rate limited and we have expired cache, use it
        if (cachedData) {
          console.log('Rate limited, using expired cache as fallback');
          return new Response(JSON.stringify({
            success: true,
            fileName: cachedData.file_name,
            fileKey: cachedData.file_key,
            ...cachedData.layers,
            fromCache: true,
            isExpiredCache: true,
            cachedAt: cachedData.cached_at
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Figma API 사용량이 많습니다. 1분 후에 다시 시도해주세요.',
          errorCode: 'RATE_LIMIT'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Figma API error: ${figmaResponse.status}`);
    }

    const figmaData = await figmaResponse.json();
    console.log(`File name: ${figmaData.name}`);

    // Extract layers from all pages
    const allLayers: ExtractedLayer[] = [];
    const pages: { name: string; id: string; layers: ExtractedLayer[] }[] = [];

    if (figmaData.document && figmaData.document.children) {
      for (const page of figmaData.document.children) {
        const pageLayers = extractLayers(page);
        pages.push({
          name: page.name,
          id: page.id,
          layers: pageLayers
        });
        allLayers.push(...pageLayers);
      }
    }

    // Filter to only include relevant layers (text and image)
    const textLayers = allLayers.filter(l => l.type === "TEXT");
    const imageLayers = allLayers.filter(l => l.type === "IMAGE");

    console.log(`Found ${textLayers.length} text layers, ${imageLayers.length} image layers`);

    // Prepare response data
    const responseData = {
      lastModified: figmaData.lastModified,
      pages,
      summary: {
        totalTextLayers: textLayers.length,
        totalImageLayers: imageLayers.length
      },
      layers: allLayers
    };

    // Save to database cache (upsert)
    const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000);
    
    const { error: upsertError } = await supabase
      .from('figma_cache')
      .upsert({
        file_key: FIGMA_CONFIG.fileKey,
        file_name: figmaData.name,
        layers: responseData,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'file_key'
      });

    if (upsertError) {
      console.error('Error saving to cache:', upsertError);
    } else {
      console.log(`Figma data cached in database until ${expiresAt.toISOString()}`);
    }

    return new Response(JSON.stringify({
      success: true,
      fileName: figmaData.name,
      fileKey: FIGMA_CONFIG.fileKey,
      ...responseData,
      fromCache: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in yumi-figma-layers:', error);
    
    const isRateLimit = error.message === 'RATE_LIMIT_EXCEEDED' || error.message?.includes('Rate limit');
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: isRateLimit 
        ? 'Figma API 사용량이 많습니다. 1분 후에 다시 시도해주세요.'
        : error.message,
      errorCode: isRateLimit ? 'RATE_LIMIT' : 'UNKNOWN'
    }), {
      status: isRateLimit ? 429 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});