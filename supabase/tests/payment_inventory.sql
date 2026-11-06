-- Run through a privileged migration connection. Fixtures roll back deliberately.
DO $$
DECLARE pid integer; oid uuid; token uuid:=gen_random_uuid(); actual integer;
BEGIN
 BEGIN
  PERFORM set_config('vastra.inventory_internal','on',true);
  INSERT INTO public.products(name,price,stock_quantity,approval_status,payment_options,sizing_enabled,size_chart)
  VALUES('Payment inventory regression fixture',100,3,'approved','both',true,'{"unit":"cm","columns":["Chest"],"rows":[{"size":"M","stock":3,"measurements":{"Chest":"90"}}]}') RETURNING id INTO pid;
  PERFORM set_config('vastra.inventory_internal','off',true);
  SELECT order_id INTO oid FROM public.create_checkout_order(_guest_token=>token,_customer_name=>'Regression Test',_customer_email=>'inventory-test@example.invalid',_customer_phone=>'9999999999',_shipping_address=>'Test address for inventory verification',_payment_method=>'razorpay',_items=>jsonb_build_array(jsonb_build_object('product_id',pid,'quantity',1,'selected_size','M')),_shipping_country=>'IN');
  SELECT stock_quantity INTO actual FROM public.products WHERE id=pid;
  IF actual<>3 THEN RAISE EXCEPTION 'Pending payment deducted stock: %',actual; END IF;
  PERFORM public.record_payment_attempt(oid,token,'failed');
  SELECT stock_quantity INTO actual FROM public.products WHERE id=pid;
  IF actual<>3 THEN RAISE EXCEPTION 'Failed payment deducted stock: %',actual; END IF;
  IF (SELECT status FROM public.orders WHERE id=oid)<>'pending_payment' THEN RAISE EXCEPTION 'Failed order confirmed'; END IF;
  IF (SELECT (size_chart->'rows'->0->>'stock')::integer FROM public.products WHERE id=pid)<>3 THEN RAISE EXCEPTION 'Pending/failed payment deducted size stock'; END IF;
  PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
  UPDATE public.orders SET payment_status='completed',status='processing',razorpay_order_id='order_regression',razorpay_payment_id='pay_regression',paid_at=now() WHERE id=oid;
  SELECT stock_quantity INTO actual FROM public.products WHERE id=pid;
  IF actual<>2 THEN RAISE EXCEPTION 'Completed payment did not deduct one: %',actual; END IF;
  IF (SELECT (size_chart->'rows'->0->>'stock')::integer FROM public.products WHERE id=pid)<>2 THEN RAISE EXCEPTION 'Completed payment did not deduct size stock'; END IF;
  UPDATE public.orders SET payment_status='completed' WHERE id=oid;
  IF (SELECT stock_quantity FROM public.products WHERE id=pid)<>2 THEN RAISE EXCEPTION 'Duplicate confirmation deducted again'; END IF;
  UPDATE public.orders SET status='cancelled' WHERE id=oid;
  IF (SELECT stock_quantity FROM public.products WHERE id=pid)<>3 THEN RAISE EXCEPTION 'Cancellation did not restore stock'; END IF;
  PERFORM set_config('request.jwt.claims','{}',true);
  token:=gen_random_uuid();
  SELECT order_id INTO oid FROM public.create_checkout_order(_guest_token=>token,_customer_name=>'Regression Test',_customer_email=>'inventory-test@example.invalid',_customer_phone=>'9999999999',_shipping_address=>'Test address for inventory verification',_payment_method=>'cod',_items=>jsonb_build_array(jsonb_build_object('product_id',pid,'quantity',1,'selected_size','M')),_shipping_country=>'IN');
  IF (SELECT stock_quantity FROM public.products WHERE id=pid)<>2 THEN RAISE EXCEPTION 'COD did not deduct stock'; END IF;
  RAISE EXCEPTION SQLSTATE 'ZX001' USING MESSAGE='Regression fixture rollback';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
 END;
END $$;