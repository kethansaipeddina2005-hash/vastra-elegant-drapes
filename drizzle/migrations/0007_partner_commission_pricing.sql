ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS commission_percentage numeric NOT NULL DEFAULT 10;

CREATE TABLE public.partner_product_pricing (
  product_id integer PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partner_applications(id) ON DELETE CASCADE,
  partner_base_price numeric NOT NULL,
  commission_percentage numeric NOT NULL,
  commission_amount numeric NOT NULL,
  customer_final_price numeric NOT NULL,
  partner_earnings numeric NOT NULL,
  vastra_earnings numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_product_pricing TO authenticated;
GRANT ALL ON public.partner_product_pricing TO service_role;
ALTER TABLE public.partner_product_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view pricing" ON public.partner_product_pricing FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Partners view own pricing" ON public.partner_product_pricing FOR SELECT TO authenticated USING (partner_id = public.partner_application_id(auth.jwt()->>'email'));

CREATE TABLE public.partner_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id integer NOT NULL,
  partner_id uuid NOT NULL REFERENCES public.partner_applications(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  partner_base_price numeric NOT NULL,
  commission_percentage numeric NOT NULL,
  commission_amount numeric NOT NULL,
  customer_final_price numeric NOT NULL,
  partner_earnings numeric NOT NULL,
  vastra_earnings numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_sales TO authenticated;
GRANT ALL ON public.partner_sales TO service_role;
ALTER TABLE public.partner_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view sales" ON public.partner_sales FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Partners view own sales" ON public.partner_sales FOR SELECT TO authenticated USING (partner_id = public.partner_application_id(auth.jwt()->>'email'));

-- Partner sets base price; server computes commission and the customer price
CREATE OR REPLACE FUNCTION public.set_partner_base_price(_product_id integer, _base numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pid uuid; _pct numeric; _comm numeric; _final numeric; _is_admin boolean;
BEGIN
  IF _base IS NULL OR _base <= 0 THEN RAISE EXCEPTION 'Invalid base price'; END IF;
  SELECT partner_id INTO _pid FROM products WHERE id = _product_id;
  IF _pid IS NULL THEN RAISE EXCEPTION 'Not a partner product'; END IF;
  _is_admin := public.has_role(auth.uid(),'admin');
  IF NOT _is_admin AND _pid IS DISTINCT FROM public.partner_application_id(auth.jwt()->>'email') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  SELECT commission_percentage INTO _pct FROM partner_applications WHERE id = _pid;
  _comm := round(_base * COALESCE(_pct,10) / 100, 2);
  _final := _base + _comm;
  INSERT INTO partner_product_pricing AS p (product_id, partner_id, partner_base_price, commission_percentage, commission_amount, customer_final_price, partner_earnings, vastra_earnings, updated_at)
  VALUES (_product_id, _pid, _base, COALESCE(_pct,10), _comm, _final, _base, _comm, now())
  ON CONFLICT (product_id) DO UPDATE SET partner_base_price=EXCLUDED.partner_base_price, commission_percentage=EXCLUDED.commission_percentage,
    commission_amount=EXCLUDED.commission_amount, customer_final_price=EXCLUDED.customer_final_price,
    partner_earnings=EXCLUDED.partner_earnings, vastra_earnings=EXCLUDED.vastra_earnings, updated_at=now();
  PERFORM set_config('vastra.pricing_sync','on',true);
  UPDATE products SET price = _final WHERE id = _product_id;
  RETURN _final;
END $$;
REVOKE ALL ON FUNCTION public.set_partner_base_price(integer, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_partner_base_price(integer, numeric) TO authenticated;

-- Prevent partners from changing the customer price directly
CREATE OR REPLACE FUNCTION public.enforce_partner_product_price()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _final numeric;
BEGIN
  IF NEW.partner_id IS NULL OR current_setting('vastra.pricing_sync', true) = 'on' THEN RETURN NEW; END IF;
  SELECT customer_final_price INTO _final FROM partner_product_pricing WHERE product_id = NEW.id;
  IF _final IS NOT NULL THEN NEW.price := _final; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_enforce_partner_product_price BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.enforce_partner_product_price();

-- Record partner/Vastra split for every sold partner item
CREATE OR REPLACE FUNCTION public.record_partner_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r partner_product_pricing%ROWTYPE;
BEGIN
  SELECT * INTO r FROM partner_product_pricing WHERE product_id = NEW.product_id;
  IF r.product_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO partner_sales (order_item_id, order_id, product_id, partner_id, quantity, partner_base_price, commission_percentage, commission_amount, customer_final_price, partner_earnings, vastra_earnings)
  VALUES (NEW.id, NEW.order_id, NEW.product_id, r.partner_id, NEW.quantity, r.partner_base_price, r.commission_percentage, r.commission_amount, r.customer_final_price,
          r.partner_earnings * NEW.quantity, r.vastra_earnings * NEW.quantity)
  ON CONFLICT (order_item_id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_record_partner_sale AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.record_partner_sale();