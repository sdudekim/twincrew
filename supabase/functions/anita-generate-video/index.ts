import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate JWT token for Kling API
function generateJWT(accessKey: string, secretKey: string): string {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: accessKey,
    exp: now + 1800, // 30 minutes
    nbf: now - 5
  };

  const encoder = new TextEncoder();
  
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  const key = encoder.encode(secretKey);
  const data = encoder.encode(signatureInput);
  
  // HMAC-SHA256 signature
  const signature = hmacSha256(key, data);
  const signatureB64 = base64UrlEncode(String.fromCharCode(...signature));
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Simple HMAC-SHA256 implementation
function hmacSha256(key: Uint8Array, data: Uint8Array): Uint8Array {
  const blockSize = 64;
  const hashSize = 32;
  
  // If key is longer than block size, hash it
  let keyToUse = key;
  if (key.length > blockSize) {
    keyToUse = sha256(key);
  }
  
  // Pad key to block size
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(keyToUse);
  
  // Create inner and outer padded keys
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = paddedKey[i] ^ 0x36;
    opad[i] = paddedKey[i] ^ 0x5c;
  }
  
  // Inner hash: SHA256(ipad || data)
  const innerData = new Uint8Array(blockSize + data.length);
  innerData.set(ipad);
  innerData.set(data, blockSize);
  const innerHash = sha256(innerData);
  
  // Outer hash: SHA256(opad || innerHash)
  const outerData = new Uint8Array(blockSize + hashSize);
  outerData.set(opad);
  outerData.set(innerHash, blockSize);
  
  return sha256(outerData);
}

// SHA-256 implementation
function sha256(data: Uint8Array): Uint8Array {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);

  let H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]);

  const padded = padMessage(data);
  
  for (let i = 0; i < padded.length; i += 64) {
    const chunk = padded.slice(i, i + 64);
    const W = new Uint32Array(64);
    
    for (let t = 0; t < 16; t++) {
      W[t] = (chunk[t * 4] << 24) | (chunk[t * 4 + 1] << 16) | (chunk[t * 4 + 2] << 8) | chunk[t * 4 + 3];
    }
    
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3);
      const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;

    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  const result = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    result[i * 4] = (H[i] >>> 24) & 0xff;
    result[i * 4 + 1] = (H[i] >>> 16) & 0xff;
    result[i * 4 + 2] = (H[i] >>> 8) & 0xff;
    result[i * 4 + 3] = H[i] & 0xff;
  }
  return result;
}

function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function padMessage(data: Uint8Array): Uint8Array {
  const bitLength = data.length * 8;
  const padLength = (data.length + 9 + 63) & ~63;
  const padded = new Uint8Array(padLength);
  padded.set(data);
  padded[data.length] = 0x80;
  
  const view = new DataView(padded.buffer);
  view.setUint32(padLength - 4, bitLength, false);
  
  return padded;
}

// Poll for task completion
async function pollTaskStatus(taskId: string, token: string, maxAttempts = 120): Promise<any> {
  const pollUrl = `https://api.klingai.com/v1/videos/image2video/${taskId}`;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Polling attempt ${attempt + 1}/${maxAttempts} for task ${taskId}`);
    
    const response = await fetch(pollUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    const result = await response.json();
    console.log(`Poll response:`, JSON.stringify(result));
    
    if (result.code !== 0) {
      throw new Error(`API error: ${result.message}`);
    }
    
    const taskStatus = result.data?.task_status;
    
    if (taskStatus === "succeed") {
      return result.data;
    } else if (taskStatus === "failed") {
      throw new Error(`Task failed: ${result.data?.task_status_msg || "Unknown error"}`);
    }
    
    // Wait 3 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  throw new Error("Task timed out after maximum attempts");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error("Image is required");
    }

    const accessKey = Deno.env.get("KLING_ACCESS_KEY");
    const secretKey = Deno.env.get("KLING_SECRET_KEY");
    
    if (!accessKey || !secretKey) {
      throw new Error("Kling API credentials not configured");
    }

    console.log("Generating JWT token...");
    const token = generateJWT(accessKey, secretKey);
    console.log("JWT token generated");

    // Extract base64 data if it includes the data URI prefix
    let cleanBase64 = imageBase64;
    if (imageBase64.includes(",")) {
      cleanBase64 = imageBase64.split(",")[1];
    }

    // Create video generation task
    console.log("Creating video generation task...");
    const createResponse = await fetch("https://api.klingai.com/v1/videos/image2video", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_name: "kling-v1-5",
        image: cleanBase64,
        prompt: "Gentle slow camera push in with subtle parallax effect, maintaining perfect product clarity and composition. Smooth cinematic movement, no distortion or warping of the product.",
        negative_prompt: "distortion, warping, morphing, blurry, shaky, fast movement, product deformation",
        cfg_scale: 0.5,
        mode: "std",
        duration: "5"
      })
    });

    const createResult = await createResponse.json();
    console.log("Create task response:", JSON.stringify(createResult));

    if (createResult.code !== 0) {
      throw new Error(`Failed to create task: ${createResult.message}`);
    }

    const taskId = createResult.data?.task_id;
    if (!taskId) {
      throw new Error("No task ID returned");
    }

    console.log(`Task created with ID: ${taskId}`);

    // Poll for completion
    const completedTask = await pollTaskStatus(taskId, token);
    
    const videoUrl = completedTask.task_result?.videos?.[0]?.url;
    if (!videoUrl) {
      throw new Error("No video URL in completed task");
    }

    console.log(`Video generated: ${videoUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        videoUrl: videoUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in anita-generate-video:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
