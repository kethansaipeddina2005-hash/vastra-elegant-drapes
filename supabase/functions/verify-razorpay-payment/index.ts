import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string;
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

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      guest_token,
    }: VerifyPaymentRequest = await req.json();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authorize: signed-in owner OR matching guest_token
    const { data: ord } = await admin
      .from("orders")
      .select("id, user_id, guest_token")
      .eq("id", order_id)
      .maybeSingle();
    const isGuest = !ord?.user_id;
    const guestOk = isGuest && guest_token && ord?.guest_token === guest_token;
    const userOk = !isGuest && user && ord?.user_id === user.id;
    if (!ord || (!guestOk && !userOk)) {
      throw new Error("Unauthorized");
    }

    const razorpayKeySecret = Deno.env.get("Live_Key_Secret");

    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(razorpayKeySecret);
    const messageData = encoder.encode(text);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const generatedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (generatedSignature !== razorpay_signature) {
      console.error("Payment signature verification failed");
      throw new Error("Invalid payment signature");
    }

    // Update order status in database via service role (works for guests too)
    const updQuery = admin
      .from("orders")
      .update({
        payment_status: "completed",
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);
    const { error: updateError } = isGuest
      ? await updQuery.eq("guest_token", guest_token as string)
      : await updQuery.eq("user_id", user!.id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw updateError;
    }

    console.log(`Payment verified for order ${order_id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Payment verified successfully"
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
