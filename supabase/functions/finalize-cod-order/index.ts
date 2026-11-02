import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

interface Body {
  order_id: string;
  items: Array<{ product_id: number; quantity: number }>;
  shipping?: number;
  coupon_code?: string | null;
  pricing_region?: "india" | "foreign";
  guest_token?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: authHeader ? { Authorization: authHeader } : {} } }
    );
    const { data: { user } } = await userClient.auth.getUser();

    const parsed = z.object({ order_id: z.string().uuid(), guest_token: z.string().uuid().nullish() }).safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const body = parsed.data;
    const { order_id, guest_token } = body;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify order ownership: either signed-in owner OR matching guest_token
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, user_id, guest_token, payment_status, payment_method, status, final_amount, total_amount, discount_percent")
      .eq("id", order_id)
      .maybeSingle();
    const isGuest = !order?.user_id;
    const guestOk = isGuest && guest_token && order?.guest_token === guest_token;
    const userOk = !isGuest && user && order?.user_id === user.id;
    if (orderErr || !order || (!guestOk && !userOk)) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.payment_method !== "cod" || order.status !== "processing") {
      return new Response(JSON.stringify({ error: "Order is not awaiting cash on delivery" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(
      JSON.stringify({ final_amount: order.final_amount, subtotal: order.total_amount, discount_percent: order.discount_percent }),
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