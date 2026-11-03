CREATE TABLE public.delivery_rates (country_code text PRIMARY KEY, country_name text NOT NULL, amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0), free_above numeric(12,2) CHECK (free_above >= 0), updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT delivery_country_code CHECK (country_code = '*' OR country_code ~ '^[A-Z]{2}$'));
GRANT SELECT ON public.delivery_rates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.delivery_rates TO authenticated;
GRANT ALL ON public.delivery_rates TO service_role;
ALTER TABLE public.delivery_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY delivery_rates_read ON public.delivery_rates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY delivery_rates_admin ON public.delivery_rates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.orders ADD COLUMN shipping_amount numeric(12,2);
CREATE OR REPLACE FUNCTION public.delivery_charge(_country text, _subtotal numeric) RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.delivery_rates%ROWTYPE; domestic boolean := lower(btrim(coalesce(_country,''))) IN ('india','in');
BEGIN
 SELECT * INTO r FROM public.delivery_rates WHERE country_code=upper(btrim(_country)) OR lower(country_name)=lower(btrim(_country)) ORDER BY (country_code=upper(btrim(_country))) DESC LIMIT 1;
 IF NOT FOUND AND NOT domestic THEN SELECT * INTO r FROM public.delivery_rates WHERE country_code='*'; END IF;
 IF r.country_code IS NOT NULL THEN RETURN CASE WHEN r.free_above IS NOT NULL AND _subtotal > r.free_above THEN 0 ELSE r.amount END; END IF;
 RETURN CASE WHEN NOT domestic THEN 4000 WHEN _subtotal>2000 THEN 0 ELSE 200 END;
END $$;
REVOKE ALL ON FUNCTION public.delivery_charge(text,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_charge(text,numeric) TO anon, authenticated, service_role;
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.price_checkout_order(uuid)'::regprocedure) INTO definition;
 definition := replace(definition, 'shipping:=CASE WHEN lower(coalesce(o.shipping_country,''India'')) NOT IN (''india'',''in'') OR coalesce(o.shipping_pincode,'''') !~ ''^\d{6}$'' THEN 4000 WHEN subtotal>2000 THEN 0 ELSE 200 END;', 'shipping:=public.delivery_charge(coalesce(o.shipping_country,''India''),subtotal);');
 IF definition NOT LIKE '%shipping:=public.delivery_charge%' THEN RAISE EXCEPTION 'Expected shipping pricing not found'; END IF;
 definition := replace(definition,'SET total_amount=subtotal,final_amount=subtotal+shipping-discount','SET shipping_amount=shipping,total_amount=subtotal,final_amount=subtotal+shipping-discount');
 EXECUTE definition;
END $$;