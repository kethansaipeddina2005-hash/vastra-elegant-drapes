import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UPI_ID = "9014883449-3@ybl";
const MERCHANT_NAME = "Vastra Store";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { orderId, amount } = await req.json();

    if (!orderId || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing orderId or amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate transaction note with order reference
    const transactionNote = `Vastra Order ${orderId.slice(0, 8)}`;
    
    // Create UPI deep link
    const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;

    // Generate QR code using external API service (works in Deno)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;

    // App-specific deep links for better mobile experience
    const phonepeLink = `phonepe://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;
    const gpayLink = `tez://upi/pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;
    const paytmLink = `paytmmp://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;

    // Update order with UPI payment method
    const { error: updateError } = await supabase
      .from("orders")
      .update({ 
        payment_method: "upi",
        payment_status: "pending"
      })
      .eq("id", orderId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`UPI order created: ${orderId}, amount: ${amount}`);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        amount,
        upiId: UPI_ID,
        upiLink,
        qrCode: qrCodeUrl,
        deepLinks: {
          phonepe: phonepeLink,
          gpay: gpayLink,
          paytm: paytmLink,
          generic: upiLink,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating UPI order:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
