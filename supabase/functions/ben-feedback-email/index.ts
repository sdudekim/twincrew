import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory storage for cumulative stats per crew (resets on function cold start)
const crewStats: Record<string, { total: number; likes: number; dislikes: number }> = {
  Ben: { total: 0, likes: 0, dislikes: 0 },
  Anita: { total: 0, likes: 0, dislikes: 0 },
};

interface FeedbackRequest {
  crewName: 'Ben' | 'Anita';
  feedbackType: 'like' | 'dislike';
  comment: string;
  productUrls: string[];
  // Legacy support for old API
  mainProductUrl?: string;
  secondProductUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: FeedbackRequest = await req.json();
    
    // Support both new and old API formats
    const crewName = body.crewName || 'Ben';
    const { feedbackType, comment } = body;
    const productUrls = body.productUrls || [body.mainProductUrl, body.secondProductUrl].filter(Boolean);

    console.log('Received feedback:', { crewName, feedbackType, comment, productUrls });

    // Initialize crew stats if not exists
    if (!crewStats[crewName]) {
      crewStats[crewName] = { total: 0, likes: 0, dislikes: 0 };
    }

    // Update cumulative stats
    crewStats[crewName].total++;
    if (feedbackType === 'like') {
      crewStats[crewName].likes++;
    } else {
      crewStats[crewName].dislikes++;
    }

    const stats = crewStats[crewName];
    const likePercentage = stats.total > 0 ? Math.round((stats.likes / stats.total) * 100) : 0;
    const dislikePercentage = stats.total > 0 ? Math.round((stats.dislikes / stats.total) * 100) : 0;

    // Format timestamp in Korean timezone
    const timestamp = new Date().toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const feedbackEmoji = feedbackType === 'like' ? '👍' : '👎';
    const feedbackLabel = feedbackType === 'like' ? 'Like' : 'Dislike';

    const crewColor = crewName === 'Ben' ? '#667eea' : '#e879f9';
    const crewGradient = crewName === 'Ben' 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'linear-gradient(135deg, #e879f9 0%, #8b5cf6 100%)';

    const urlsHtml = productUrls.length > 0 
      ? productUrls.map((url, i) => `
          <p><strong>Product ${i + 1}:</strong></p>
          <div class="url-box">${url || 'N/A'}</div>
        `).join('')
      : '<div class="url-box">No product URLs provided</div>';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${crewGradient}; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .stats { background: white; padding: 15px; border-radius: 8px; margin-top: 15px; }
            .stat-item { display: inline-block; margin-right: 20px; }
            .label { font-size: 12px; color: #6b7280; }
            .value { font-size: 18px; font-weight: bold; }
            .like { color: #10b981; }
            .dislike { color: #ef4444; }
            .url-box { background: #e5e7eb; padding: 10px; border-radius: 5px; margin: 5px 0; word-break: break-all; font-size: 13px; }
            .comment-box { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 15px; }
            .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📊 ${crewName} Feedback Report</h1>
              <p style="margin: 5px 0 0; opacity: 0.9;">LG AI Crew - ${crewName === 'Ben' ? 'PTO Gallery Image Generator' : 'Lifestyle Image Generator'}</p>
            </div>
            
            <div class="content">
              <p><strong>⏰ Timestamp:</strong> ${timestamp}</p>
              <p><strong>${feedbackEmoji} Feedback Type:</strong> <span class="${feedbackType}">${feedbackLabel}</span></p>
              
              ${comment ? `
                <div class="comment-box">
                  <strong>💬 User Comment:</strong>
                  <p style="margin: 10px 0 0;">${comment}</p>
                </div>
              ` : ''}
              
              <h3 style="margin-top: 20px;">📝 Product URLs:</h3>
              ${urlsHtml}
              
              <div class="stats">
                <h3 style="margin-top: 0;">📈 Cumulative Stats (Current Session)</h3>
                <div class="stat-item">
                  <div class="label">Total Feedback</div>
                  <div class="value">${stats.total}</div>
                </div>
                <div class="stat-item">
                  <div class="label">Likes</div>
                  <div class="value like">${stats.likes} (${likePercentage}%)</div>
                </div>
                <div class="stat-item">
                  <div class="label">Dislikes</div>
                  <div class="value dislike">${stats.dislikes} (${dislikePercentage}%)</div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>This email was automatically sent from LG AI Crew - ${crewName}.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "LG AI Crew <onboarding@resend.dev>",
      to: ["donguk.yim@lge.com"],
      subject: `[${crewName} Feedback] ${feedbackEmoji} ${feedbackLabel} - ${timestamp}`,
      html: emailHtml,
    });

    console.log("Feedback email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Feedback sent successfully",
        stats: crewStats[crewName],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in ben-feedback-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
