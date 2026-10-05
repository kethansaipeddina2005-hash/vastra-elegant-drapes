ALTER TABLE public.products ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partner_applications(id);
CREATE INDEX IF NOT EXISTS idx_products_partner_id ON public.products(partner_id);

CREATE OR REPLACE FUNCTION public.partner_application_id(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.partner_applications
  WHERE lower(email) = lower(_email) AND status = 'approved'
  LIMIT 1
$$;

CREATE POLICY "Partners can insert own products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (partner_id IS NOT NULL AND partner_id = public.partner_application_id(auth.jwt() ->> 'email'));

CREATE POLICY "Partners can update own products"
ON public.products FOR UPDATE TO authenticated
USING (partner_id IS NOT NULL AND partner_id = public.partner_application_id(auth.jwt() ->> 'email'))
WITH CHECK (partner_id = public.partner_application_id(auth.jwt() ->> 'email'));

CREATE POLICY "Partners can delete own products"
ON public.products FOR DELETE TO authenticated
USING (partner_id IS NOT NULL AND partner_id = public.partner_application_id(auth.jwt() ->> 'email'));

CREATE POLICY "Partners can view own order items"
ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.products p
  WHERE p.id = order_items.product_id
    AND p.partner_id IS NOT NULL
    AND p.partner_id = public.partner_application_id(auth.jwt() ->> 'email')
));

CREATE POLICY "Partners can view own application"
ON public.partner_applications FOR SELECT TO authenticated
USING (lower(email) = lower(auth.jwt() ->> 'email'));