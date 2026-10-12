ALTER TABLE public.partner_product_pricing ADD COLUMN commission_type text NOT NULL DEFAULT 'partner_default', ADD COLUMN commission_value numeric;
ALTER TABLE public.partner_product_pricing ADD CONSTRAINT partner_commission_configuration CHECK ((commission_type = 'partner_default' AND commission_value IS NULL) OR (commission_type = 'percentage' AND commission_value >= 0 AND commission_value <= 100) OR (commission_type = 'fixed' AND commission_value >= 0));
CREATE OR REPLACE FUNCTION public.set_partner_base_price(_product_id integer, _base numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _pid uuid; _pct numeric; _comm numeric; _final numeric; _mode text; _value numeric; _previous text;
BEGIN
 IF _base IS NULL OR _base <= 0 OR _base::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid base price'; END IF;
 SELECT partner_id INTO _pid FROM public.products WHERE id=_product_id FOR UPDATE;
 IF _pid IS NULL THEN RAISE EXCEPTION 'Not a partner product'; END IF;
 IF NOT public.has_role(auth.uid(),'admin') AND _pid IS DISTINCT FROM public.partner_application_id(auth.jwt()->>'email') THEN RAISE EXCEPTION 'Not allowed'; END IF;
 SELECT commission_percentage INTO _pct FROM public.partner_applications WHERE id=_pid;
 SELECT commission_type,commission_value INTO _mode,_value FROM public.partner_product_pricing WHERE product_id=_product_id;
 _pct := CASE WHEN _mode='percentage' THEN _value WHEN _mode='fixed' THEN 0 ELSE COALESCE(_pct,10) END;
 _comm := CASE WHEN _mode='fixed' THEN round(_value,2) ELSE round(_base*_pct/100,2) END;
 _final := round(_base,2)+_comm;
 INSERT INTO public.partner_product_pricing(product_id,partner_id,partner_base_price,commission_percentage,commission_amount,customer_final_price,partner_earnings,vastra_earnings,updated_at)
 VALUES(_product_id,_pid,round(_base,2),_pct,_comm,_final,round(_base,2),_comm,now())
 ON CONFLICT(product_id) DO UPDATE SET partner_base_price=EXCLUDED.partner_base_price,commission_percentage=EXCLUDED.commission_percentage,commission_amount=EXCLUDED.commission_amount,customer_final_price=EXCLUDED.customer_final_price,partner_earnings=EXCLUDED.partner_earnings,vastra_earnings=EXCLUDED.vastra_earnings,updated_at=now();
 _previous := COALESCE(current_setting('vastra.pricing_sync',true),'off');
 PERFORM set_config('vastra.pricing_sync','on',true);
 UPDATE public.products SET price=_final WHERE id=_product_id;
 PERFORM set_config('vastra.pricing_sync',_previous,true);
 RETURN _final;
END $$;
REVOKE ALL ON FUNCTION public.set_partner_base_price(integer,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_partner_base_price(integer,numeric) TO authenticated;
CREATE OR REPLACE FUNCTION public.set_product_commission(_product_id integer,_base numeric,_type text,_value numeric DEFAULT NULL)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only admins can change commission'; END IF;
 IF _type IS NULL OR _type NOT IN ('partner_default','percentage','fixed') THEN RAISE EXCEPTION 'Invalid commission type'; END IF;
 IF _type<>'partner_default' AND (_value IS NULL OR _value<0 OR _value::text IN ('NaN','Infinity','-Infinity') OR (_type='percentage' AND _value>100)) THEN RAISE EXCEPTION 'Enter a valid commission'; END IF;
 PERFORM public.set_partner_base_price(_product_id,_base);
 UPDATE public.partner_product_pricing SET commission_type=_type,commission_value=CASE WHEN _type='partner_default' THEN NULL ELSE round(_value,2) END WHERE product_id=_product_id;
 RETURN public.set_partner_base_price(_product_id,_base);
END $$;
REVOKE ALL ON FUNCTION public.set_product_commission(integer,numeric,text,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_product_commission(integer,numeric,text,numeric) TO authenticated;