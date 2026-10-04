CREATE TABLE public.partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  owner_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  instagram text,
  website text,
  location text NOT NULL,
  business_category text NOT NULL,
  products_sold text,
  business_description text NOT NULL,
  why_partner text,
  catalogue_url text,
  expected_products integer,
  shipping_info text,
  return_policy text,
  gst_info text,
  logo_url text,
  additional_notes text,
  status text NOT NULL DEFAULT 'pending',
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT partner_app_status_chk CHECK (status IN ('pending','under_review','approved','rejected','on_hold','info_requested'))
);
GRANT INSERT ON public.partner_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.partner_applications TO authenticated;
GRANT ALL ON public.partner_applications TO service_role;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.normalize_partner_application_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.email := lower(btrim(NEW.email));
  NEW.status := 'pending';
  NEW.internal_notes := NULL;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_partner_app_insert BEFORE INSERT ON public.partner_applications
FOR EACH ROW EXECUTE FUNCTION public.normalize_partner_application_insert();
CREATE TRIGGER trg_partner_app_updated BEFORE UPDATE ON public.partner_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Anyone can apply" ON public.partner_applications FOR INSERT TO anon, authenticated
WITH CHECK (length(brand_name) BETWEEN 1 AND 150 AND length(email) <= 255 AND length(business_description) <= 3000);
CREATE POLICY "Admins view applications" ON public.partner_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update applications" ON public.partner_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete applications" ON public.partner_applications FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));