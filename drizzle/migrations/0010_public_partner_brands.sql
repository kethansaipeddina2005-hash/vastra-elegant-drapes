CREATE POLICY "Public read approved partner logos" ON storage.objects FOR SELECT
USING (bucket_id = 'partner-applications' AND EXISTS (
  SELECT 1 FROM public.partner_applications a WHERE a.status = 'approved' AND a.logo_path = storage.objects.name));

CREATE OR REPLACE FUNCTION public.get_partner_brands(_ids uuid[] DEFAULT NULL)
RETURNS TABLE(id uuid, brand_name text, logo_path text, logo_url text, location text, business_description text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.brand_name, a.logo_path, a.logo_url, a.location, a.business_description
  FROM partner_applications a
  WHERE a.status = 'approved' AND (_ids IS NULL OR a.id = ANY(_ids));
$$;
GRANT EXECUTE ON FUNCTION public.get_partner_brands(uuid[]) TO anon, authenticated;