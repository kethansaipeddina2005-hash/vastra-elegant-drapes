import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PartnerBrand {
  id: string;
  brand_name: string;
  slug: string;
  location: string | null;
  business_description: string | null;
  logoSrc: string | null;
}

const cache = new Map<string, PartnerBrand | null>();
let brandDirectory: Promise<PartnerBrand[]> | null = null;

export const brandSlug = (name: string) => name.normalize("NFKC").toLowerCase()
  .replace(/['’]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "designer";

const getBrandDirectory = () => {
  if (!brandDirectory) {
    brandDirectory = (async () => {
      const { data, error } = await supabase.rpc("get_partner_brands", {});
      if (error) throw error;
      const used = new Set<string>();
      return [...(data || [])].sort((a, b) => a.id.localeCompare(b.id)).map((row) => {
        const base = brandSlug(row.brand_name);
        let slug = base;
        let suffix = 2;
        while (used.has(slug)) slug = `${base}-${suffix++}`;
        used.add(slug);
        return { ...row, slug, logoSrc: row.logo_url || null };
      });
    })().catch((error) => { brandDirectory = null; throw error; });
  }
  return brandDirectory;
};

export const fetchPartnerBrand = async (id: string): Promise<PartnerBrand | null> => {
  if (cache.has(id)) return cache.get(id) ?? null;
  const directory = await getBrandDirectory();
  const row = directory.find((brand) => brand.id === id || brand.slug === id);
  if (!row) { cache.set(id, null); return null; }
  let logoSrc: string | null = row.logo_url || null;
  if (row.logo_path) {
    const { data: s } = await supabase.storage.from("partner-applications").createSignedUrl(row.logo_path, 3600);
    if (s?.signedUrl) logoSrc = s.signedUrl;
  }
  const brand = { id: row.id, slug: row.slug, brand_name: row.brand_name, location: row.location, business_description: row.business_description, logoSrc };
  cache.set(id, brand);
  cache.set(row.id, brand);
  cache.set(row.slug, brand);
  return brand;
};

export const usePartnerBrand = (id?: string | null) => {
  const [brand, setBrand] = useState<PartnerBrand | null>(null);
  useEffect(() => {
    let active = true;
    setBrand(null);
    if (!id) { setBrand(null); return; }
    fetchPartnerBrand(id).then((result) => { if (active) setBrand(result); })
      .catch(() => { if (active) setBrand(null); });
    return () => { active = false; };
  }, [id]);
  return brand;
};
