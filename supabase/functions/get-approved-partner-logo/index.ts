import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const schema = z.object({ partner_id: z.string().uuid() });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid partner" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: partner, error } = await admin
      .from("partner_applications")
      .select("logo_path")
      .eq("id", parsed.data.partner_id)
      .eq("status", "approved")
      .maybeSingle();

    if (error || !partner?.logo_path) return json({ error: "Logo unavailable" }, 404);

    const { data, error: signingError } = await admin.storage
      .from("partner-applications")
      .createSignedUrl(partner.logo_path, 3600);
    if (signingError || !data?.signedUrl) return json({ error: "Logo unavailable" }, 404);
    return json({ logo_url: data.signedUrl });
  } catch {
    return json({ error: "Unable to retrieve logo" }, 500);
  }
});