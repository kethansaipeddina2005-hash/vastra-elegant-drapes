import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
const schema = z.object({ order_id: z.string().uuid(), guest_token: z.string().uuid().nullish() });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid order details" }, 400);
    const { order_id, guest_token } = parsed.data;
    const authorization = req.headers.get("Authorization") ?? "";
    const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: claims } = await client.auth.getClaims(authorization.replace(/^Bearer /, ""));
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: order, error } = await admin.from("orders").select("id,user_id,guest_token,final_amount,payment_method,payment_status,status,razorpay_order_id").eq("id", order_id).maybeSingle();
    if (error || !order || (order.user_id ? order.user_id !== claims?.claims?.sub : !guest_token || guest_token !== order.guest_token)) return json({ error: "Order not found" }, 404);
    if (order.payment_method !== "razorpay" || order.status !== "pending_payment" || order.payment_status === "completed") return json({ error: "Order is not awaiting online payment" }, 409);
    const key = Deno.env.get("Live_Key_ID");
    const secret = Deno.env.get("Live_Key_Secret");
    if (!key || !secret) return json({ error: "Payment service unavailable" }, 503);
    const amount = Math.round(Number(order.final_amount) * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0) return json({ error: "Invalid order total" }, 400);
    let gatewayId = order.razorpay_order_id;
    if (!gatewayId) {
      const response = await fetch("https://api.razorpay.com/v1/orders", { method: "POST", headers: { Authorization: `Basic ${btoa(`${key}:${secret}`)}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount, currency: "INR", receipt: order.id, notes: { order_id: order.id } }) });
      if (!response.ok) return json({ error: "Unable to start payment" }, 502);
      const gateway = await response.json();
      if (gateway.amount !== amount || gateway.currency !== "INR" || typeof gateway.id !== "string") return json({ error: "Invalid payment service response" }, 502);
      const { data: linked, error: linkError } = await admin.from("orders").update({ razorpay_order_id: gateway.id }).eq("id", order.id).is("razorpay_order_id", null).eq("status", "pending_payment").neq("payment_status", "completed").select("razorpay_order_id").maybeSingle();
      if (linkError) return json({ error: "Unable to link payment" }, 500);
      if (linked) gatewayId = linked.razorpay_order_id;
      else {
        const { data: existing } = await admin.from("orders").select("razorpay_order_id,status,payment_status").eq("id", order.id).single();
        if (!existing?.razorpay_order_id || existing.status !== "pending_payment" || existing.payment_status === "completed") return json({ error: "Order payment changed" }, 409);
        gatewayId = existing.razorpay_order_id;
      }
    }
    return json({ orderId: gatewayId, amount, currency: "INR", keyId: key });
  } catch {
    return json({ error: "Unable to create payment order" }, 500);
  }
});
