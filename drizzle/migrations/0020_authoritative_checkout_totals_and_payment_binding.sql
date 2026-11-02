DO $$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef(oid) INTO definition FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='create_checkout_order';
 definition := replace(definition, 'BEGIN
  IF _customer_name', 'BEGIN
  IF _method NOT IN (''razorpay'', ''cod'') THEN RAISE EXCEPTION ''Unsupported payment method''; END IF;
  IF _customer_name');
 definition := replace(definition, 'IF _unit IS NULL THEN', 'IF EXISTS (SELECT 1 FROM public.products p WHERE p.id=_pid AND ((p.payment_options=''online'' AND _method=''cod'') OR (p.payment_options=''cod'' AND _method=''razorpay''))) THEN RAISE EXCEPTION ''Payment method unavailable for product %'', _pid; END IF;
    IF _unit IS NULL THEN');
 definition := replace(definition, 'RETURN QUERY SELECT _new_id, _new_num, _token;', 'PERFORM public.price_checkout_order(_new_id);
  RETURN QUERY SELECT _new_id, _new_num, _token;');
 EXECUTE definition;
END $$;
CREATE OR REPLACE FUNCTION public.price_checkout_order(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders%ROWTYPE; c public.coupons%ROWTYPE; subtotal numeric; eligible numeric; shipping numeric; discount numeric:=0; pct integer:=0; uses integer;
BEGIN
 SELECT * INTO o FROM public.orders WHERE id=_order_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
 IF o.payment_status='completed' OR o.razorpay_order_id IS NOT NULL THEN RAISE EXCEPTION 'Payment amount is already locked'; END IF;
 SELECT sum(i.price*i.quantity) INTO subtotal FROM public.order_items i WHERE i.order_id=o.id;
 IF subtotal IS NULL OR subtotal<=0 THEN RAISE EXCEPTION 'Invalid order total'; END IF;
 shipping:=CASE WHEN lower(coalesce(o.shipping_country,'India')) NOT IN ('india','in') OR coalesce(o.shipping_pincode,'') !~ '^\d{6}$' THEN 4000 WHEN subtotal>2000 THEN 0 ELSE 200 END;
 IF nullif(btrim(o.coupon_code),'') IS NOT NULL THEN
  SELECT * INTO c FROM public.coupons WHERE upper(code)=upper(btrim(o.coupon_code)) AND is_active=true AND expiry_date>=now() FOR UPDATE;
  IF NOT FOUND OR subtotal<coalesce(c.min_amount,0) OR (c.partner_id IS NOT NULL AND c.approval_status IS DISTINCT FROM 'approved') THEN RAISE EXCEPTION 'Coupon is not available for this order'; END IF;
  SELECT count(*) INTO uses FROM public.orders prev WHERE prev.id<>o.id AND upper(prev.coupon_code)=upper(c.code) AND (prev.payment_status='completed' OR (prev.payment_method='cod' AND prev.status NOT IN ('cancelled','pending_payment'))) AND ((o.user_id IS NOT NULL AND prev.user_id=o.user_id) OR lower(prev.customer_email)=lower(o.customer_email));
  IF c.usage_limit_per_user IS NOT NULL AND uses>=c.usage_limit_per_user THEN RAISE EXCEPTION 'Coupon usage limit reached'; END IF;
  SELECT coalesce(sum(i.price*i.quantity),0) INTO eligible FROM public.order_items i JOIN public.products p ON p.id=i.product_id WHERE i.order_id=o.id AND (c.partner_id IS NULL OR p.partner_id=c.partner_id);
  IF eligible<=0 THEN RAISE EXCEPTION 'Coupon does not apply to these products'; END IF;
  pct:=round(c.discount_percent*eligible/subtotal);
  discount:=floor(pct*subtotal/100);
 END IF;
 UPDATE public.orders SET total_amount=subtotal,final_amount=subtotal+shipping-discount,discount_percent=pct,updated_at=now() WHERE id=o.id;
END $$;
REVOKE ALL ON FUNCTION public.price_checkout_order(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.price_checkout_order(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.record_payment_attempt(uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_payment_attempt(uuid,uuid,text) TO anon,authenticated;
CREATE UNIQUE INDEX IF NOT EXISTS orders_unique_razorpay_payment ON public.orders(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_unique_razorpay_order ON public.orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;