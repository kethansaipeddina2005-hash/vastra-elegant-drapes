import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SubscriptionEmailRequest = await req.json();

    console.log("Sending welcome email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Vastra <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Vastra - You're Now Part of Our Family! 🪷",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Georgia', serif; background-color: #f5f5dc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #c2a079;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #c2a079 0%, #d4af37 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-family: 'Georgia', serif; letter-spacing: 2px;">VASTRA</h1>
              <p style="color: #f5f5dc; font-size: 14px; margin-top: 8px; letter-spacing: 1px;">Elegance in Every Weave</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; font-size: 24px; margin: 0 0 20px 0; font-family: 'Georgia', serif;">Welcome to the Vastra Family!</h2>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                Thank you for subscribing to our newsletter. You've taken the first step towards discovering the timeless beauty of traditional Indian sarees.
              </p>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                As a valued member of our community, you'll be the first to know about:
              </p>
              
              <ul style="color: #4a4a4a; font-size: 16px; line-height: 2; margin: 0 0 20px 20px; padding: 0;">
                <li>✨ New collection launches</li>
                <li>🎁 Exclusive offers and discounts</li>
                <li>💫 Style inspiration and draping tips</li>
                <li>📖 Stories of our artisans and their craft</li>
              </ul>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                Every saree tells a story, and we can't wait to share ours with you.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #c2a079 0%, #d4af37 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; font-size: 14px; letter-spacing: 1px; border-radius: 4px;">EXPLORE COLLECTIONS</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f5f5dc; padding: 30px; text-align: center; border-top: 1px solid #c2a079;">
              <p style="color: #6a6a6a; font-size: 14px; margin: 0 0 10px 0;">
                With love and tradition,<br>
                <strong style="color: #c2a079;">The Vastra Team</strong>
              </p>
              <p style="color: #999999; font-size: 12px; margin: 20px 0 0 0;">
                If you wish to unsubscribe, you can do so from our website.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending subscription email:", error);
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
