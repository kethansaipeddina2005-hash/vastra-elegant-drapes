import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export const usePartner = () => {
  const { user, loading: authLoading } = useAuth();
  const [application, setApplication] = useState<Tables<"partner_applications"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.email) {
      setApplication(null);
      setLoading(false);
      return;
    }
    supabase
      .from("partner_applications")
      .select("*")
      .eq("status", "approved")
      .ilike("email", user.email)
      .maybeSingle()
      .then(({ data }) => {
        setApplication(data ?? null);
        setLoading(false);
      });
  }, [user, authLoading]);

  return { partner: application, isPartner: !!application, loading: loading || authLoading };
};
