import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fixed Figma file configuration
const FIGMA_CONFIG = {
  fileKey: "2pFBBAAUfwvuw0xLy7nGgJ",
  fileName: "Promotion-Banners"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIGMA_ACCESS_TOKEN = Deno.env.get('FIGMA_ACCESS_TOKEN');
    
    if (!FIGMA_ACCESS_TOKEN) {
      throw new Error('FIGMA_ACCESS_TOKEN is not configured');
    }

    const { nodeIds, format = 'png', scale = 2 } = await req.json();

    // Validate format
    const validFormats = ['png', 'jpg', 'svg', 'pdf'];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    // Validate scale
    if (scale < 0.01 || scale > 4) {
      throw new Error('Scale must be between 0.01 and 4');
    }

    // If no nodeIds provided, export the entire first page
    let idsToExport = nodeIds;
    
    if (!idsToExport || idsToExport.length === 0) {
      // Get the file structure to find the first page
      const fileResponse = await fetch(
        `https://api.figma.com/v1/files/${FIGMA_CONFIG.fileKey}?depth=1`,
        {
          headers: {
            'X-Figma-Token': FIGMA_ACCESS_TOKEN,
          },
        }
      );

      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch Figma file: ${fileResponse.status}`);
      }

      const fileData = await fileResponse.json();
      
      if (fileData.document && fileData.document.children && fileData.document.children.length > 0) {
        // Get the first page's ID
        idsToExport = [fileData.document.children[0].id];
      } else {
        throw new Error('No pages found in the Figma file');
      }
    }

    console.log(`Exporting nodes: ${idsToExport.join(', ')} as ${format} at ${scale}x`);

    // Request image export from Figma
    const imageResponse = await fetch(
      `https://api.figma.com/v1/images/${FIGMA_CONFIG.fileKey}?ids=${idsToExport.join(',')}&format=${format}&scale=${scale}`,
      {
        headers: {
          'X-Figma-Token': FIGMA_ACCESS_TOKEN,
        },
      }
    );

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Figma images API error:', imageResponse.status, errorText);
      throw new Error(`Figma images API error: ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    
    if (imageData.err) {
      throw new Error(`Figma export error: ${imageData.err}`);
    }

    console.log('Export successful:', imageData);

    // Transform the response to include node IDs and their image URLs
    const exports = Object.entries(imageData.images).map(([nodeId, imageUrl]) => ({
      nodeId,
      imageUrl,
      format,
      scale
    }));

    return new Response(JSON.stringify({
      success: true,
      fileKey: FIGMA_CONFIG.fileKey,
      exports
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in yumi-figma-export:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
