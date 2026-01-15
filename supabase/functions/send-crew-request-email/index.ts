import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CrewRequestData {
  crewName: string;
  role: string;
  division: string;
  team: string;
  skills: string;
  description: string;
  agentUrl: string;
  comment: string;
  requestedBy: string;
  selectedImage: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData: CrewRequestData = await req.json();
    console.log("Received crew request data:", formData);

    const divisionLabels: Record<string, string> = {
      "marketing": "Marketing",
      "digital-platform": "Digital Platform",
      "data-intelligence": "Data Intelligence"
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #555; margin-bottom: 5px; }
          .value { background: white; padding: 10px; border-radius: 4px; border: 1px solid #eee; }
          .footer { margin-top: 20px; font-size: 12px; color: #888; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🤖 New Crew Registration Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A new AI crew member has been requested</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Crew Name</div>
              <div class="value">${formData.crewName || '-'}</div>
            </div>
            <div class="field">
              <div class="label">Role</div>
              <div class="value">${formData.role || '-'}</div>
            </div>
            <div class="field">
              <div class="label">Division</div>
              <div class="value">${divisionLabels[formData.division] || formData.division || '-'}</div>
            </div>
            <div class="field">
              <div class="label">Team</div>
              <div class="value">${formData.team || '-'}</div>
            </div>
            <div class="field">
              <div class="label">Key Skills</div>
              <div class="value">${formData.skills || '-'}</div>
            </div>
            <div class="field">
              <div class="label">Description</div>
              <div class="value">${formData.description || '-'}</div>
            </div>
            ${formData.agentUrl ? `
            <div class="field">
              <div class="label">Agent URL</div>
              <div class="value"><a href="${formData.agentUrl}">${formData.agentUrl}</a></div>
            </div>
            ` : ''}
            ${formData.comment ? `
            <div class="field">
              <div class="label">Comment to Reviewer</div>
              <div class="value">${formData.comment}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="label">Selected Image</div>
              <div class="value">${formData.selectedImage || 'None selected'}</div>
            </div>
            <div class="field">
              <div class="label">Requested By</div>
              <div class="value">${formData.requestedBy || '-'}</div>
            </div>
          </div>
          <div class="footer">
            This email was automatically sent from the AI Crew Registration System.
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "AI Crew System <onboarding@resend.dev>",
      to: ["donguk.yim@lge.com"],
      subject: `[Crew Request] New Registration: ${formData.crewName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-crew-request-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
