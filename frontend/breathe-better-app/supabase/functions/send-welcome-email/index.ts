import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, name } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstName = name?.split(" ")[0] || "there";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0e1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0e1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:linear-gradient(135deg,#111827,#1e293b);border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:36px 32px 20px;text-align:center;">
              <div style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#06b6d4);width:48px;height:48px;border-radius:12px;line-height:48px;font-size:22px;">🌬️</div>
              <h1 style="color:#f1f5f9;font-size:22px;margin:16px 0 0;font-weight:700;">Welcome to BreatheSync</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:8px 32px 28px;">
              <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 20px;">
                Hey ${firstName} 👋
              </p>
              <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 20px;">
                Thanks for joining BreatheSync! You've just taken the first step toward understanding and improving your respiratory health.
              </p>
              <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
                Here's what you can explore:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 16px;background:rgba(59,130,246,0.08);border-radius:10px;margin-bottom:8px;">
                    <p style="color:#e2e8f0;font-size:14px;margin:0;"><strong>🫁 Lung Gym</strong> — Breathing exercises to strengthen your lungs</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:rgba(6,182,212,0.08);border-radius:10px;">
                    <p style="color:#e2e8f0;font-size:14px;margin:0;"><strong>🗺️ Trigger Map</strong> — Track air quality and environmental triggers</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:rgba(139,92,246,0.08);border-radius:10px;">
                    <p style="color:#e2e8f0;font-size:14px;margin:0;"><strong>🎤 Voice Check</strong> — AI-powered respiratory voice analysis</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:rgba(16,185,129,0.08);border-radius:10px;">
                    <p style="color:#e2e8f0;font-size:14px;margin:0;"><strong>🐉 Dragon Breather</strong> — A fun game to practice deep breathing</p>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:24px 0;">
                Breathe well. Live well. 💙
              </p>
              <p style="color:#64748b;font-size:13px;margin:0;">— The BreatheSync Team</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0;">© 2026 BreatheSync. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BreatheSync <onboarding@resend.dev>",
        to: [email],
        subject: `Welcome to BreatheSync, ${firstName}! 🌬️`,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending welcome email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
