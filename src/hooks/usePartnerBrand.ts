import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PartnerBrand {
  id: string;
  brand_name: string;
  location: string | null;
  business_description: string | null;
  logoSrc: string | null;
}

const cache = new Map<string, PartnerBrand | null>();

export const fetchPartnerBrand = async (id: string): Promise<PartnerBrand | null> => {
  if (cache.has(id)) return cache.get(id)!;
  const { data } = await supabase.rpc("get_partner_brands", { _ids: [id] });
  const row: any = data?.[0];
  if (!row) { cache.set(id, null); return null; }
  let logoSrc: string | null = row.logo_url || null;
  if (row.logo_path) {
    const { data: s } = await supabase.storage.from("partner-applications").createSignedUrl(row.logo_path, 3600);
    if (s?.signedUrl) logoSrc = s.signedUrl;
  }
  const brand = { id: row.id, brand_name: row.brand_name, location: row.location, business_description: row.business_description, logoSrc };
  cache.set(id, brand);
  return brand;
};

export const usePartnerBrand = (id?: string | null) => {
  const [brand, setBrand] = useState<PartnerBrand | null>(null);
  useEffect(() => {
    if (!id) { setBrand(null); return; }
    fetchPartnerBrand(id).then(setBrand);
  }, [id]);
  return brand;
};
