import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  amount?: number; // legacy / fallback only — server recomputes
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  // Server-authoritative inputs
  items?: Array<{ product_id: number; quantity: number }>;
  shipping?: number;
  coupon_code?: string | null;
  pricing_region?: "india" | "foreign";
  order_id?: string;
  guest_token?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    const body: CreateOrderRequest = await req.json();
    const { currency = "INR", receipt, notes, items, shipping, coupon_code, pricing_region, order_id, guest_token } = body;

    // Allow either: authenticated user, OR a valid guest_token matching the order_id.
    const adminClientForAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    let isGuest = false;
    if (!user) {
      if (!order_id || !guest_token) throw new Error("Unauthorized");
      const { data: ord } = await adminClientForAuth
        .from("orders")
        .select("id, guest_token, user_id")
        .eq("id", order_id)
        .maybeSingle();
      if (!ord || ord.user_id || ord.guest_token !== guest_token) throw new Error("Unauthorized");
      isGuest = true;
    }

    // Recompute the charge amount server-side to prevent client-side price/discount tampering.
    let chargeAmount = body.amount ?? 0;

    if (Array.isArray(items) && items.length > 0) {
      // Use a service-role client to read product prices (bypass RLS for trusted server-side compute)
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const productIds = items.map((i) => i.product_id);
      const { data: products, error: productsError } = await adminClient
        .from("products")
        .select("id, price, foreign_price")
        .in("id", productIds);

      if (productsError) throw productsError;

      const priceMap = new Map<number, { price: number; foreign_price: number | null }>();
      (products ?? []).forEach((p: any) =>
        priceMap.set(p.id, { price: Number(p.price), foreign_price: p.foreign_price != null ? Number(p.foreign_price) : null })
      );

      let subtotal = 0;
      for (const it of items) {
        const p = priceMap.get(it.product_id);
        if (!p) throw new Error(`Invalid product: ${it.product_id}`);
        const qty = Math.max(1, Math.floor(Number(it.quantity) || 0));
        const unit = pricing_region === "foreign" && p.foreign_price && p.foreign_price > 0 ? p.foreign_price : p.price;
        subtotal += unit * qty;
      }

      // Validate coupon server-side
      let discountPercent = 0;
      if (coupon_code && coupon_code.trim()) {
        const { data: coupon } = await adminClient
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
      chargeAmount = Math.max(0, subtotal + shippingAmount - discountAmount);

      // If an order id was passed, sync the canonical amount onto the order
      if (order_id) {
        await adminClient
          .from("orders")
          .update({
            final_amount: chargeAmount,
            discount_percent: discountPercent,
            coupon_code: discountPercent > 0 ? coupon_code : null,
          })
          .eq("id", order_id)
          .eq(isGuest ? "guest_token" : "user_id", isGuest ? (guest_token as string) : user!.id);
      }
    }

    if (!chargeAmount || chargeAmount <= 0) {
      throw new Error("Invalid order amount");
    }

    const razorpayKeyId = Deno.env.get("Live_Key_ID");
    const razorpayKeySecret = Deno.env.get("Live_Key_Secret");

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    // Create Razorpay order
    const orderData = {
      amount: Math.round(chargeAmount * 100), // Razorpay expects amount in paise
      currency,
      receipt: receipt || `order_${Date.now()}`,
      notes: notes || {},
    };

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Razorpay API error:", error);
      throw new Error("Failed to create Razorpay order");
    }

    const razorpayOrder = await response.json();

    console.log("Razorpay order created:", razorpayOrder.id);

    return new Response(
      JSON.stringify({ 
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: razorpayKeyId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in create-razorpay-order function:", error);
    return new Response(
      JSON.stringify({ error: "Unable to create payment order." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
