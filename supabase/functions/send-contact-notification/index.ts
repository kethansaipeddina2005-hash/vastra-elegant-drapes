import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactRequest = await req.json();

    // Validate input
    if (!name || !email || !subject || !message) {
      throw new Error("All fields are required");
    }

    // Send email to admin
    const emailResponse = await resend.emails.send({
      from: "Vastra Contact Form <onboarding@resend.dev>",
      to: ["kethansaipeddina2005@gmail.com"],
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f5f5dc 0%, #c2a079 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #eee; }
              .info-box { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .message-box { background: #fff; padding: 20px; border-left: 4px solid #c2a079; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color: #fff; margin: 0; font-family: 'Playfair Display', serif;">New Contact Form Submission</h1>
              </div>
              <div class="content">
                <div class="info-box">
                  <h3 style="margin-top: 0;">Contact Details</h3>
                  <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                  <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
                </div>

                <h3>Message</h3>
                <div class="message-box">
                  ${message.replace(/\n/g, '<br>')}
                </div>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; color: #666;">
                  Please respond to this inquiry as soon as possible by replying to this email or contacting ${email} directly.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // Send confirmation to user
    await resend.emails.send({
      from: "Vastra <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message - Vastra",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f5f5dc 0%, #c2a079 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color: #fff; margin: 0; font-family: 'Playfair Display', serif;">Thank You for Contacting Vastra</h1>
              </div>
              <div class="content">
                <p>Dear ${name},</p>
                <p>Thank you for reaching out to us. We have received your message and will get back to you within 24 hours.</p>
                
                <p><strong>Your message:</strong></p>
                <p style="background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #c2a079;">
                  ${message.replace(/\n/g, '<br>')}
                </p>

                <p style="margin-top: 30px;">
                  If you have any urgent queries, feel free to call us at +91 79979 09061
                </p>

                <p style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee; color: #666;">
                  Best regards,<br>
                  The Vastra Team
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Contact form notification sent:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Message sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});