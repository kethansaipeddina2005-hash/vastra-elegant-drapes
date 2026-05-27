import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderId, reason } = await req.json();
    if (!orderId || typeof orderId !== "string") {
      return new Response(JSON.stringify({ error: "orderId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, order_number, user_id, customer_name, customer_email, customer_phone, status, payment_status, payment_method, final_amount, total_amount, shipping_address_id, created_at")
      .eq("id", orderId)
      .maybeSingle();
    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorize: customer who owns the order, or an admin
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleRow;
    if (order.user_id !== user.id && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: items } = await admin
      .from("order_items")
      .select("quantity, price, product_id")
      .eq("order_id", orderId);

    const productIds = (items ?? []).map((i: any) => i.product_id);
    const { data: products } = productIds.length
      ? await admin.from("products").select("id, name").in("id", productIds)
      : { data: [] as any[] };
    const nameById = new Map((products ?? []).map((p: any) => [p.id, p.name]));

    let address: any = null;
    if (order.shipping_address_id) {
      const { data: a } = await admin
        .from("addresses")
        .select("full_name, phone, address_line1, address_line2, city, state, postal_code, country")
        .eq("id", order.shipping_address_id)
        .maybeSingle();
      address = a;
    }

    const itemsHtml = (items ?? [])
      .map((it: any) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">${escapeHtml(nameById.get(it.product_id) ?? `#${it.product_id}`)}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${Number(it.quantity) || 0}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">₹${(Number(it.price) || 0).toLocaleString()}</td>
        </tr>`).join("");

    const addressHtml = address ? `
      <div class="info-box">
        <h3 style="margin-top:0;">Shipping Address</h3>
        <p style="margin:5px 0;">${escapeHtml(address.full_name)}</p>
        <p style="margin:5px 0;">${escapeHtml(address.address_line1)}${address.address_line2 ? ", " + escapeHtml(address.address_line2) : ""}</p>
        <p style="margin:5px 0;">${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.postal_code)}</p>
        <p style="margin:5px 0;">${escapeHtml(address.country)}</p>
        <p style="margin:5px 0;"><strong>Phone:</strong> ${escapeHtml(address.phone)}</p>
      </div>` : "";

    const displayOrderNumber = (order as any).order_number ?? `#${String(order.id).slice(0, 8)}`;
    const safeDisplayOrderNumber = escapeHtml(displayOrderNumber);
    const total = Number(order.final_amount ?? order.total_amount ?? 0);

    await resend.emails.send({
      from: "Vastra Returns <onboarding@resend.dev>",
      to: ["kethan2311@gmail.com", "kethansaipeddina2005@gmail.com"],
      subject: `Return Requested - ${displayOrderNumber}`,
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
          body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}
          .container{max-width:600px;margin:0 auto;padding:20px;}
          .header{background:linear-gradient(135deg,#f5f5dc 0%,#c2a079 100%);padding:30px;text-align:center;border-radius:8px 8px 0 0;}
          .content{background:#fff;padding:30px;border:1px solid #eee;}
          table{width:100%;border-collapse:collapse;margin:20px 0;}
          th{background:#f5f5dc;padding:12px;text-align:left;}
          .info-box{background:#f9f9f9;padding:15px;border-radius:5px;margin:15px 0;}
          .total{font-size:20px;font-weight:bold;color:#c2a079;margin-top:20px;text-align:right;}
        </style></head>
        <body><div class="container">
          <div class="header"><h1 style="color:#fff;margin:0;font-family:'Playfair Display',serif;">Return Request</h1></div>
          <div class="content">
            <h2 style="color:#c2a079;">Return Requested</h2>
            <p><strong>Order Number:</strong> ${safeDisplayOrderNumber}</p>
            <p><strong>Requested on:</strong> ${escapeHtml(new Date().toISOString())}</p>
            ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
            <div class="info-box">
              <h3 style="margin-top:0;">Customer Information</h3>
              <p style="margin:5px 0;"><strong>Name:</strong> ${escapeHtml(order.customer_name)}</p>
              <p style="margin:5px 0;"><strong>Email:</strong> ${escapeHtml(order.customer_email)}</p>
              <p style="margin:5px 0;"><strong>Phone:</strong> ${escapeHtml(order.customer_phone)}</p>
            </div>
            ${addressHtml}
            <div class="info-box">
              <h3 style="margin-top:0;">Payment</h3>
              <p style="margin:5px 0;"><strong>Method:</strong> ${escapeHtml(order.payment_method ?? "-")}</p>
              <p style="margin:5px 0;"><strong>Status:</strong> ${escapeHtml(order.payment_status ?? "-")}</p>
              <p style="margin:5px 0;"><strong>Order Status:</strong> ${escapeHtml(order.status ?? "-")}</p>
            </div>
            <h3>Items</h3>
            <table>
              <thead><tr><th>Product</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="total">Total: ₹${total.toLocaleString()}</div>
          </div>
        </div></body></html>`,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-return-notification error:", error);
    return new Response(JSON.stringify({ error: "Unable to send return notification." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});