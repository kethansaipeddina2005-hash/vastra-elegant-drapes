import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { canNotifyOrder } from "../_shared/payment-policy.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationRequest {
  orderId: string;
  guest_token?: string | null;
}

function escapeHtml(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";
    const isServiceCall = serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;

    const { orderId, guest_token }: OrderNotificationRequest = await req.json();
    if (!orderId) throw new Error("orderId is required");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey
    );

    // Authorization: internal service call, the signed-in order owner, or the
    // matching guest token. Everyone else is rejected.
    if (!isServiceCall) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: authHeader ? { Authorization: authHeader } : {} } }
      );
      const { data: { user } } = await supabaseClient.auth.getUser();

      const { data: ord } = await adminClient
        .from("orders")
        .select("user_id, guest_token")
        .eq("id", orderId)
        .maybeSingle();
      const guestOk = ord && !ord.user_id && guest_token && ord.guest_token === guest_token;
      const userOk = ord && ord.user_id && user && ord.user_id === user.id;
      if (!ord || (!guestOk && !userOk)) {
        throw new Error("Unauthorized");
      }
    }

    // All email content is derived server-side from the order record.
    const { data: orderRow } = await adminClient
      .from("orders")
      .select("order_number, payment_method, payment_status, status, final_amount, total_amount, discount_percent, coupon_code, customer_name, customer_email, customer_phone, shipping_address_text, shipping_address_id")
      .eq("id", orderId)
      .maybeSingle();
    if (!orderRow) throw new Error("Order not found");
    if (!canNotifyOrder(orderRow)) return new Response(JSON.stringify({ error: "Order is not confirmed" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: itemRows } = await adminClient
      .from("order_items")
      .select("quantity, price, selected_size, products(name)")
      .eq("order_id", orderId);
    const orderItems = (itemRows ?? []).map((i: any) => ({
      name: i.products?.name ?? "Product",
      quantity: Number(i.quantity) || 0,
      price: Number(i.price) || 0,
      size: i.selected_size ?? null,
    }));

    const safeName = escapeHtml(orderRow.customer_name);
    const safeEmail = escapeHtml(orderRow.customer_email);
    const safePhone = escapeHtml(orderRow.customer_phone);
    const displayOrderNumber = orderRow.order_number ?? `#${String(orderId).slice(0, 8)}`;
    const safeDisplayOrderNumber = escapeHtml(displayOrderNumber);
    const totalAmount = Number(orderRow.final_amount) || Number(orderRow.total_amount) || 0;

    let addressRow: any = null;
    if (orderRow.shipping_address_id) {
      const { data: addr } = await adminClient
        .from("addresses")
        .select("full_name, phone, address_line1, address_line2, city, state, postal_code, country")
        .eq("id", orderRow.shipping_address_id)
        .maybeSingle();
      addressRow = addr;
    }
    const addressHtml = addressRow
      ? `
        <div class="info-box">
          <h3 style="margin-top: 0;">Shipping Address</h3>
          <p style="margin: 5px 0;">${escapeHtml(addressRow.full_name)}</p>
          <p style="margin: 5px 0;">${escapeHtml(addressRow.address_line1)}${addressRow.address_line2 ? ", " + escapeHtml(addressRow.address_line2) : ""}</p>
          <p style="margin: 5px 0;">${escapeHtml(addressRow.city)}, ${escapeHtml(addressRow.state)} ${escapeHtml(addressRow.postal_code)}</p>
          <p style="margin: 5px 0;">${escapeHtml(addressRow.country)}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${escapeHtml(addressRow.phone)}</p>
        </div>`
      : orderRow.shipping_address_text
        ? `
        <div class="info-box">
          <h3 style="margin-top: 0;">Shipping Address</h3>
          <p style="margin: 5px 0;">${escapeHtml(orderRow.shipping_address_text)}</p>
        </div>`
        : "";
    const paymentHtml = `
        <div class="info-box">
          <h3 style="margin-top: 0;">Payment</h3>
          <p style="margin: 5px 0;"><strong>Method:</strong> ${escapeHtml(orderRow.payment_method ?? "-")}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${escapeHtml(orderRow.payment_status ?? "-")}</p>
          <p style="margin: 5px 0;"><strong>Order Status:</strong> ${escapeHtml(orderRow.status ?? "-")}</p>
        </div>`;

    // Create order summary HTML
    const orderItemsHtml = orderItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)}${item.size ? ` (Size ${escapeHtml(item.size)})` : ""}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
        </tr>
      `
      )
      .join("");

    // Send email to admins
    const adminEmail = await resend.emails.send({
      from: "Vastra Orders <onboarding@resend.dev>",
      to: ["kethan2311@gmail.com", "kethansaipeddina2005@gmail.com"],
      subject: `New Order Received - ${displayOrderNumber}`,
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
                <p><strong>Order Number:</strong> ${safeDisplayOrderNumber}</p>

                <div class="info-box">
                  <h3 style="margin-top: 0;">Customer Information</h3>
                  <p style="margin: 5px 0;"><strong>Name:</strong> ${safeName}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${safeEmail}</p>
                  <p style="margin: 5px 0;"><strong>Phone:</strong> ${safePhone}</p>
                </div>
                ${addressHtml}
                ${paymentHtml}
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
    if ((adminEmail as any)?.error) {
      console.error("Resend admin email error:", (adminEmail as any).error);
    }

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Vastra <onboarding@resend.dev>",
      to: [orderRow.customer_email],
      subject: `Order Confirmation - Vastra ${displayOrderNumber}`,
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
                <p>Dear ${safeName},</p>
                <p>Thank you for your purchase! Your order has been successfully placed.</p>

                <p><strong>Order Number:</strong> ${safeDisplayOrderNumber}</p>

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
    if ((customerEmailResponse as any)?.error) {
      console.error("Resend customer email error:", (customerEmailResponse as any).error);
    }

    if (adminEmail.error || customerEmailResponse.error) throw new Error("Email delivery request rejected");

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
      JSON.stringify({ error: "Unable to send order notification." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
