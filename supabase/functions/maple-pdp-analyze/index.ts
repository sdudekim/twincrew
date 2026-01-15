import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PodcastSegment {
  imageUrl: string;
  text: string;
  estimatedDuration: number; // in seconds
}

function extractCarouselImages(markdownContent: string, baseUrl: string): string[] {
  const images: string[] = [];
  
  // Extract image URLs from markdown format: ![alt](url) or just URLs
  const imgPatterns = [
    // Markdown image syntax: ![alt](url)
    /!\[[^\]]*\]\(([^)]+)\)/gi,
    // Direct URLs ending with image extensions
    /(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>]*)?)/gi,
    // URLs in parentheses or brackets
    /\((https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|webp|gif)[^)]*)\)/gi,
  ];
  
  for (const pattern of imgPatterns) {
    let match;
    while ((match = pattern.exec(markdownContent)) !== null) {
      let url = match[1];
      
      // Skip thumbnails and small images
      if (url.includes('thum') || url.includes('180x180') || url.includes('50x50') || 
          url.includes('icon') || url.includes('logo') || url.includes('badge') ||
          url.includes('placeholder') || url.includes('spinner')) {
        continue;
      }
      
      // Prefer larger images
      if (url.includes('450x450') && !url.includes('1600') && !url.includes('1200')) {
        continue;
      }
      
      // Make absolute URL
      if (url.startsWith('//')) {
        url = 'https:' + url;
      } else if (url.startsWith('/')) {
        try {
          const urlObj = new URL(baseUrl);
          url = urlObj.origin + url;
        } catch {}
      }
      
      // Clean URL (remove trailing stuff)
      url = url.split(')')[0].split(' ')[0];
      
      if (url.startsWith('http') && !images.includes(url)) {
        images.push(url);
      }
    }
  }
  
  console.log("Extracted images:", images);
  
  // Return first 6 images max for the video
  return images.slice(0, 6);
}

async function generateVideoPodcastScript(
  url: string, 
  htmlContent: string, 
  imageUrls: string[], 
  lovableApiKey: string
): Promise<PodcastSegment[]> {
  const imageCount = Math.min(imageUrls.length, 6);
  
  const systemPrompt = `You are Maple, a product curator creating video podcast scripts.
Your task is to create a structured script where each segment describes what's shown in a product image.

CRITICAL RULES:
- Start IMMEDIATELY with product content. NO greetings, NO introductions like "안녕하세요" or "Hi there"
- First sentence should describe the product or its key feature directly
- Each segment should be 2-3 sentences (about 8-15 seconds when spoken)
- Total script should be 40-60 seconds
- Use natural, conversational Korean for Korean products
- Focus on visual elements that match what would be shown in product images
- End with a compelling call-to-action

You will create exactly ${imageCount} segments to match ${imageCount} product images.`;

  const userPrompt = `Create a ${imageCount}-segment video podcast script for this product:

URL: ${url}

Page Content:
${htmlContent.slice(0, 10000)}

Return ONLY a JSON array with exactly ${imageCount} segments in this format:
[
  {"text": "segment 1 script text here", "imageIndex": 0},
  {"text": "segment 2 script text here", "imageIndex": 1},
  ...
]

Remember: Start with product content directly. NO greetings or introductions!`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  // Parse JSON from response
  let segments: { text: string; imageIndex: number }[] = [];
  try {
    // Try to extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      segments = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse segments JSON:", e);
    // Fallback: create single segment with full content
    segments = [{ text: content.replace(/[\[\]{}]/g, ''), imageIndex: 0 }];
  }

  // Map segments to images with duration estimates
  const result: PodcastSegment[] = segments.map((seg, idx) => {
    // Estimate duration: roughly 150 characters per 10 seconds for Korean
    const charCount = seg.text.length;
    const estimatedDuration = Math.max(5, Math.min(15, Math.round(charCount / 15)));
    
    return {
      imageUrl: imageUrls[Math.min(seg.imageIndex || idx, imageUrls.length - 1)] || imageUrls[0] || '',
      text: seg.text,
      estimatedDuration,
    };
  });

  return result;
}

async function generateCurationText(url: string, htmlContent: string, lovableApiKey: string): Promise<string> {
  const systemPrompt = `You are Maple, a friendly and knowledgeable product curator with a warm, engaging voice. 
Your role is to create podcast-style audio scripts that feel like a personal shopping consultant talking to a customer.

Guidelines for your script:
- Speak naturally and conversationally, as if talking to a friend
- Use Korean language for Korean product pages, English for English pages
- Keep it concise but engaging (around 30-45 seconds when spoken)
- IMPORTANT: Start DIRECTLY with the product content - NO greetings like "안녕하세요" or introductions
- Begin immediately with what makes this product special
- Highlight 2-3 key selling points with enthusiasm
- Mention who would love this product
- End with a warm recommendation
- Avoid technical jargon, use everyday language
- Add natural pauses and transitions
- Sound excited but genuine, not salesy`;

  const userPrompt = `Create a podcast-style curation script for this product page:

URL: ${url}

Page Content:
${htmlContent}

Remember: Start IMMEDIATELY with the product - NO greeting, NO intro. Jump straight into what makes this product great.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

async function generateAudio(text: string, elevenLabsApiKey: string): Promise<string> {
  // Using Sarah voice - warm, friendly female voice
  const voiceId = "EXAVITQu4vr4xnSDxMaL";
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": elevenLabsApiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("ElevenLabs error:", response.status, errorText);
    throw new Error(`ElevenLabs TTS failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64Audio = arrayBufferToBase64(arrayBuffer);
  
  return base64Audio;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, htmlContent, analysisType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Handle video podcast (with image segments)
    if (analysisType === "video-podcast") {
      if (!ELEVENLABS_API_KEY) {
        throw new Error("ELEVENLABS_API_KEY is not configured");
      }

      console.log("Extracting carousel images...");
      const imageUrls = extractCarouselImages(htmlContent, url);
      console.log("Found images:", imageUrls.length);

      if (imageUrls.length === 0) {
        throw new Error("No product images found on the page");
      }

      console.log("Generating video podcast script...");
      const segments = await generateVideoPodcastScript(url, htmlContent, imageUrls, LOVABLE_API_KEY);
      console.log("Generated segments:", segments.length);

      // Generate audio for full script
      const fullScript = segments.map(s => s.text).join(' ');
      console.log("Generating audio for full script...");
      const audioBase64 = await generateAudio(fullScript, ELEVENLABS_API_KEY);
      console.log("Audio generated");

      return new Response(
        JSON.stringify({ 
          success: true, 
          audioBase64,
          segments,
          fullScript,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle podcast curation (audio only, no video)
    if (analysisType === "summary" || analysisType === "podcast") {
      if (!ELEVENLABS_API_KEY) {
        throw new Error("ELEVENLABS_API_KEY is not configured");
      }

      console.log("Generating curation text...");
      const curationText = await generateCurationText(url, htmlContent, LOVABLE_API_KEY);
      console.log("Curation text generated, length:", curationText.length);

      console.log("Generating audio...");
      const audioBase64 = await generateAudio(curationText, ELEVENLABS_API_KEY);
      console.log("Audio generated, base64 length:", audioBase64.length);

      return new Response(
        JSON.stringify({ 
          success: true, 
          audioBase64,
          script: curationText,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle audit (text streaming as before)
    if (analysisType === "audit") {
      const systemPrompt = `You are Maple, a PDP (Product Detail Page) content auditor. 
Your role is to analyze product pages and provide a comprehensive content audit.

You should identify:
- What content elements ARE present on the page
- What content elements are MISSING that should typically be on a PDP
- Quality assessment of each content section

Common PDP content elements to check:
- Product title and subtitle
- Product images (hero, gallery, lifestyle)
- Price and promotions
- Product description (short and long)
- Key features and specifications
- Technical specifications table
- Customer reviews and ratings
- Q&A section
- Related/recommended products
- Add to cart/Buy now buttons
- Availability/Stock status
- Shipping information
- Return policy
- Brand information
- Video content
- 360° view
- AR/VR experience
- Size guide (if applicable)
- Color/variant options
- Bundle offers
- Warranty information
- Installation/Setup information
- Comparison tools
- Social proof elements
- Trust badges/certifications

Format your response as a clear checklist with ✅ for present and ❌ for missing items.
Add notes about quality where relevant.`;

      const userPrompt = `Please audit this product page content:

URL: ${url}

Page Content:
${htmlContent}

Provide a comprehensive content audit showing:
1. ✅ Content elements that ARE present (with quality notes)
2. ❌ Content elements that are MISSING
3. Overall content completeness score (%)
4. Priority recommendations for improvement`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        return new Response(JSON.stringify({ error: "AI analysis failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid analysis type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in maple-pdp-analyze:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
