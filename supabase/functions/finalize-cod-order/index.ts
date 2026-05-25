import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  order_id: string;
  items: Array<{ product_id: number; quantity: number }>;
  shipping?: number;
  coupon_code?: string | null;
  pricing_region?: "india" | "foreign";
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

    const body: Body = await req.json();
    const { order_id, items, shipping = 0, coupon_code, pricing_region } = body;

    if (!order_id || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify order ownership and that it's still pending
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, user_id, payment_status")
      .eq("id", order_id)
      .maybeSingle();
    if (orderErr || !order || order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productIds = items.map((i) => Number(i.product_id));
    const { data: products, error: productsErr } = await admin
      .from("products")
      .select("id, price, foreign_price")
      .in("id", productIds);
    if (productsErr) throw productsErr;

    const priceMap = new Map<number, { price: number; foreign_price: number | null }>();
    (products ?? []).forEach((p: any) =>
      priceMap.set(p.id, {
        price: Number(p.price),
        foreign_price: p.foreign_price != null ? Number(p.foreign_price) : null,
      })
    );

    let subtotal = 0;
    for (const it of items) {
      const p = priceMap.get(Number(it.product_id));
      if (!p) {
        return new Response(JSON.stringify({ error: "Invalid product" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const qty = Math.max(1, Math.floor(Number(it.quantity) || 0));
      const unit = pricing_region === "foreign" && p.foreign_price && p.foreign_price > 0
        ? p.foreign_price
        : p.price;
      subtotal += unit * qty;
    }

    let discountPercent = 0;
    if (coupon_code && coupon_code.trim()) {
      const { data: coupon } = await admin
        .from("coupons")
        .select("discount_percent, expiry_date, min_amount, is_active")
        .eq("code", coupon_code.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      if (
        coupon &&
        new Date(coupon.expiry_date) >= new Date() &&
        subtotal >= Number(coupon.min_amount ?? 0)
      ) {
        discountPercent = Number(coupon.discount_percent) || 0;
      }
    }

    const discountAmount = Math.floor((discountPercent / 100) * subtotal);
    const shippingAmount = Math.max(0, Number(shipping) || 0);
    const finalAmount = Math.max(0, subtotal + shippingAmount - discountAmount);

    const { error: updErr } = await admin
      .from("orders")
      .update({
        total_amount: subtotal,
        final_amount: finalAmount,
        discount_percent: discountPercent,
        coupon_code: discountPercent > 0 ? coupon_code : null,
      })
      .eq("id", order_id)
      .eq("user_id", user.id);
    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({ final_amount: finalAmount, subtotal, discount_percent: discountPercent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("finalize-cod-order error:", error);
    return new Response(
      JSON.stringify({ error: "Unable to finalize order." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});