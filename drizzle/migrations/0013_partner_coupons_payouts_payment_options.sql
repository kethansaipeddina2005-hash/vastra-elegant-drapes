ALTER TABLE public.products ADD COLUMN IF NOT EXISTS payment_options text NOT NULL DEFAULT 'both';
ALTER TABLE public.products ADD CONSTRAINT products_payment_options_chk CHECK (payment_options IN ('online','cod','both'));

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partner_applications(id) ON DELETE CASCADE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';

CREATE OR REPLACE FUNCTION public.enforce_partner_coupon()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  NEW.partner_id := public.partner_application_id(auth.jwt()->>'email');
  IF NEW.partner_id IS NULL THEN RAISE EXCEPTION 'Not allowed'; END IF;
  NEW.approval_status := 'pending';
  NEW.is_active := false;
  NEW.is_public := COALESCE(NEW.is_public, false);
  NEW.collaborator_email := NULL;
  NEW.commission_percent := 0;
  NEW.code := upper(btrim(NEW.code));
  IF NEW.discount_percent < 1 OR NEW.discount_percent > 90 THEN RAISE EXCEPTION 'Discount must be 1-90%%'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_enforce_partner_coupon BEFORE INSERT OR UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.enforce_partner_coupon();

CREATE POLICY "Partners view own coupons" ON public.coupons FOR SELECT TO authenticated
USING (partner_id IS NOT NULL AND partner_id = public.partner_application_id(auth.jwt()->>'email'));
CREATE POLICY "Partners create own coupons" ON public.coupons FOR INSERT TO authenticated
WITH CHECK (public.partner_application_id(auth.jwt()->>'email') IS NOT NULL);
CREATE POLICY "Partners update own coupons" ON public.coupons FOR UPDATE TO authenticated
USING (partner_id IS NOT NULL AND partner_id = public.partner_application_id(auth.jwt()->>'email'));
CREATE POLICY "Partners delete own coupons" ON public.coupons FOR DELETE TO authenticated
USING (partner_id IS NOT NULL AND partner_id = public.partner_application_id(auth.jwt()->>'email'));

CREATE POLICY "Partners add categories to own products" ON public.product_categories FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.partner_id IS NOT NULL AND p.partner_id = public.partner_application_id(auth.jwt()->>'email')));
CREATE POLICY "Partners remove categories from own products" ON public.product_categories FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.partner_id IS NOT NULL AND p.partner_id = public.partner_application_id(auth.jwt()->>'email')));

CREATE TABLE public.partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_applications(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  reference text,
  notes text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_payouts TO authenticated;
GRANT ALL ON public.partner_payouts TO service_role;
ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage payouts" ON public.partner_payouts FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Partners view own payouts" ON public.partner_payouts FOR SELECT TO authenticated
USING (partner_id = public.partner_application_id(auth.jwt()->>'email'));

CREATE OR REPLACE FUNCTION public.enforce_product_payment_option()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _opt text; _pm text;
BEGIN
  SELECT payment_options INTO _opt FROM products WHERE id = NEW.product_id;
  SELECT payment_method INTO _pm FROM orders WHERE id = NEW.order_id;
  IF _opt = 'online' AND _pm = 'cod' THEN RAISE EXCEPTION 'Cash on Delivery is not available for one of the products'; END IF;
  IF _opt = 'cod' AND _pm IS DISTINCT FROM 'cod' THEN RAISE EXCEPTION 'Online payment is not available for one of the products'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_enforce_product_payment_option BEFORE INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_product_payment_option();