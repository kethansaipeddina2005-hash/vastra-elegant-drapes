import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const {
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      totalAmount,
      orderItems,
    }: OrderNotificationRequest = await req.json();

    // Create order summary HTML
    const orderItemsHtml = orderItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
        </tr>
      `
      )
      .join("");

    // Send email to admin
    const adminEmail = await resend.emails.send({
      from: "Vastra Orders <onboarding@resend.dev>",
      to: ["kethansaipeddina2005@gmail.com"],
      subject: `New Order Received - #${orderId.slice(0, 8)}`,
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
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #f5f5dc; padding: 12px; text-align: left; }
              .total { font-size: 20px; font-weight: bold; color: #c2a079; margin-top: 20px; text-align: right; }
              .info-box { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color: #fff; margin: 0; font-family: 'Playfair Display', serif;">New Order Alert!</h1>
              </div>
              <div class="content">
                <h2 style="color: #c2a079;">Order Details</h2>
                <p><strong>Order ID:</strong> #${orderId.slice(0, 8)}</p>
                
                <div class="info-box">
                  <h3 style="margin-top: 0;">Customer Information</h3>
                  <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
                  <p style="margin: 5px 0;"><strong>Phone:</strong> ${customerPhone}</p>
                </div>

                <h3>Order Items</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderItemsHtml}
                  </tbody>
                </table>

                <div class="total">
                  Total Amount: ₹${totalAmount.toLocaleString()}
                </div>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; color: #666;">
                  Please process this order as soon as possible.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Vastra <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Order Confirmation - Vastra #${orderId.slice(0, 8)}`,
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
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #f5f5dc; padding: 12px; text-align: left; }
              .total { font-size: 20px; font-weight: bold; color: #c2a079; margin-top: 20px; text-align: right; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color: #fff; margin: 0; font-family: 'Playfair Display', serif;">Thank You for Shopping with Vastra!</h1>
              </div>
              <div class="content">
                <h2 style="color: #c2a079;">Order Confirmed</h2>
                <p>Dear ${customerName},</p>
                <p>Thank you for your purchase! Your order has been successfully placed.</p>
                
                <p><strong>Order ID:</strong> #${orderId.slice(0, 8)}</p>

                <h3>Order Summary</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderItemsHtml}
                  </tbody>
                </table>

                <div class="total">
                  Total: ₹${totalAmount.toLocaleString()}
                </div>

                <p style="margin-top: 30px;">
                  We will send you another email once your order has been shipped with tracking details.
                </p>

                <p style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee; color: #666;">
                  If you have any questions, please contact us at support@vastra.com or call +91 79979 09061
                </p>

                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                  This is an automated email, please do not reply to this message.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Order notification emails sent:", { adminEmail, customerEmailResponse });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order notifications sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});