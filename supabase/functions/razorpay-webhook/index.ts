import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { signaturesMatch, validateCapturedPayment } from "../_shared/payment-policy.ts";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

// Razorpay webhook: a server-to-server confirmation channel so orders are
// confirmed even when the customer closes the browser after paying.
// Configure the webhook URL in the Razorpay dashboard with the
// RAZORPAY_WEBHOOK_SECRET stored in this project's secrets.

async function hmacSha256Hex(secret: string, text: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(text));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendOrderNotifications(orderId: string) {
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-notification`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ orderId }),
    });
  } catch (e) {
    console.error("Order notification dispatch failed:", e);
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not configured");
    return new Response("Webhook not configured", { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  // Verify the webhook signature before trusting anything in the payload.
  const expected = await hmacSha256Hex(webhookSecret, rawBody);
  if (!signaturesMatch(expected, signature)) {
    console.error("Webhook signature verification failed");
    return new Response("Invalid signature", { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const payment = event?.payload?.payment?.entity;
  const eventType: string = event?.event ?? "";

  if (!payment?.order_id) {
    // Unrelated event — acknowledge so Razorpay stops retrying.
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  // Find the internal order via the Razorpay order id stored at creation,
  // falling back to the receipt (internal order id) set by create-razorpay-order.
  let order: any = null;
  const { data: byRzpId } = await admin
    .from("orders")
    .select("id, final_amount, payment_status, razorpay_order_id, payment_method, status")
    .eq("razorpay_order_id", payment.order_id)
    .maybeSingle();
  order = byRzpId;

  if (!order) {
    console.error("Webhook: no internal order for Razorpay order", payment.order_id);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  if (eventType === "payment.captured") {
    try { validateCapturedPayment(order, payment); }
    catch { return new Response("Payment does not match an awaiting order", { status: 400 }); }

    // Idempotent: only the first confirmation transitions the order.
    const { data: updated, error } = await admin
      .from("orders")
      .update({
        payment_status: "completed",
        status: "processing",
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .neq("payment_status", "completed")
      .eq("status", "pending_payment")
      .eq("razorpay_order_id", payment.order_id)
      .select("id");

    if (error) {
      console.error("Webhook order update failed:", error);
      return new Response("Update failed", { status: 500 });
    }

    if (updated && updated.length > 0) {
      await sendOrderNotifications(order.id);
      console.log(`Webhook confirmed order ${order.id}`);
    }
  } else if (eventType === "payment.failed") {
    const { error } = await admin
      .from("orders")
      .update({ payment_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", order.id)
      .in("payment_status", ["pending", "cancelled"]);
    if (error) return new Response("Update failed", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
