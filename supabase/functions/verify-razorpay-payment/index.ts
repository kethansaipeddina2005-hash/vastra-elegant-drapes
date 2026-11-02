import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { signaturesMatch, validateCapturedPayment } from "../_shared/payment-policy.ts";

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string;
  guest_token?: string | null;
}

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

// Sends the order confirmation emails server-side after verified payment.
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

    const parsed = z.object({ razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/), razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/), razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/), order_id: z.string().uuid(), guest_token: z.string().uuid().nullish() }).safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid payment details" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      guest_token,
    } = parsed.data;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authorize: signed-in owner OR matching guest_token
    const { data: ord } = await admin
      .from("orders")
      .select("id, user_id, guest_token, final_amount, payment_status, razorpay_payment_id, razorpay_order_id, payment_method, status")
      .eq("id", order_id)
      .maybeSingle();
    const isGuest = !ord?.user_id;
    const guestOk = isGuest && guest_token && ord?.guest_token === guest_token;
    const userOk = !isGuest && user && ord?.user_id === user.id;
    if (!ord || (!guestOk && !userOk)) {
      throw new Error("Unauthorized");
    }

    if (ord.razorpay_order_id !== razorpay_order_id || ord.payment_method !== "razorpay") throw new Error("Payment order mismatch");

    // Idempotency: a duplicate success callback for an already-confirmed order is a no-op.
    if (ord.payment_status === "completed") {
      return new Response(
        JSON.stringify({ success: true, message: "Payment already confirmed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const razorpayKeyId = Deno.env.get("Live_Key_ID");
    const razorpayKeySecret = Deno.env.get("Live_Key_Secret");

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    // 1) Verify the checkout signature (proves the callback came from Razorpay).
    const generatedSignature = await hmacSha256Hex(
      razorpayKeySecret,
      `${razorpay_order_id}|${razorpay_payment_id}`
    );
    if (!signaturesMatch(generatedSignature, razorpay_signature)) {
      console.error("Payment signature verification failed");
      throw new Error("Invalid payment signature");
    }

    // 2) Fetch the payment from Razorpay and validate status, order linkage and amount.
    const rzpAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { Authorization: `Basic ${rzpAuth}` },
    });
    if (!payRes.ok) {
      console.error("Razorpay payment fetch failed");
      throw new Error("Could not validate payment with Razorpay");
    }
    const payment = await payRes.json();

    validateCapturedPayment(ord, payment);

    // 3) Confirm the order exactly once (conditional update guards concurrent retries).
    const updQuery = admin
      .from("orders")
      .update({
        payment_status: "completed",
        status: "processing",
        razorpay_payment_id,
        razorpay_order_id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .neq("payment_status", "completed")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("status", "pending_payment");
    const { data: updated, error: updateError } = isGuest
      ? await updQuery.eq("guest_token", guest_token as string).select("id")
      : await updQuery.eq("user_id", user?.id).select("id");

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw updateError;
    }

    // 4) Notifications only after verified payment, and only on the first confirmation.
    if (updated && updated.length > 0) {
      await sendOrderNotifications(order_id);
    }

    if (!updated?.length) {
      const { data: latest } = await admin.from("orders").select("payment_status").eq("id", order_id).single();
      if (latest?.payment_status !== "completed") throw new Error("Payment could not be confirmed");
    }

    console.log(`Payment verified for order ${order_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-razorpay-payment function:", error);
    return new Response(
      JSON.stringify({ error: "Payment verification failed." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
