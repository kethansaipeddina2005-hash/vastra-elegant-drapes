ALTER TABLE public.orders ADD COLUMN inventory_deducted boolean NOT NULL DEFAULT false;
-- Existing order items were all deducted on insertion under the old triggers.
UPDATE public.orders SET inventory_deducted = true;

CREATE OR REPLACE FUNCTION public.deduct_confirmed_order_inventory(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders%ROWTYPE; i record; p public.products%ROWTYPE; idx integer; row_data jsonb; previous_flag text;
BEGIN
 SELECT * INTO o FROM public.orders WHERE id=_order_id FOR UPDATE;
 IF NOT FOUND OR (o.inventory_deducted AND NOT o.stock_restored) THEN RETURN; END IF;
 IF o.status IN ('cancelled','returned','pending_payment') OR (o.payment_method IS DISTINCT FROM 'cod' AND o.payment_status IS DISTINCT FROM 'completed') THEN RETURN; END IF;
 previous_flag:=COALESCE(current_setting('vastra.inventory_internal',true),'off');
 PERFORM set_config('vastra.inventory_internal','on',true);
 FOR i IN SELECT product_id,selected_size,sum(quantity)::integer quantity FROM public.order_items WHERE order_id=o.id GROUP BY product_id,selected_size ORDER BY product_id,selected_size LOOP
  SELECT * INTO p FROM public.products WHERE id=i.product_id FOR UPDATE;
  IF NOT FOUND OR p.approval_status IS DISTINCT FROM 'approved' OR COALESCE(p.stock_quantity,0)<i.quantity THEN RAISE EXCEPTION 'Insufficient stock when confirming product %',i.product_id; END IF;
  IF p.sizing_enabled THEN
   idx:=NULL;
   SELECT (ordinality-1)::integer,value INTO idx,row_data FROM jsonb_array_elements(p.size_chart->'rows') WITH ORDINALITY WHERE value->>'size'=i.selected_size;
   IF idx IS NULL OR COALESCE((row_data->>'stock')::integer,0)<i.quantity THEN RAISE EXCEPTION 'Selected size unavailable when confirming product %',i.product_id; END IF;
   UPDATE public.products SET size_chart=jsonb_set(size_chart,ARRAY['rows',idx::text,'stock'],to_jsonb((row_data->>'stock')::integer-i.quantity)) WHERE id=p.id;
  END IF;
  UPDATE public.products SET stock_quantity=stock_quantity-i.quantity,updated_at=now() WHERE id=p.id;
 END LOOP;
 UPDATE public.orders SET inventory_deducted=true,stock_restored=false WHERE id=o.id;
 PERFORM set_config('vastra.inventory_internal',previous_flag,true);
END $$;
REVOKE ALL ON FUNCTION public.deduct_confirmed_order_inventory(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_confirmed_order_inventory(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_size_inventory()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.products%ROWTYPE; row_data jsonb;
BEGIN
 SELECT * INTO p FROM public.products WHERE id=NEW.product_id FOR UPDATE;
 IF NOT FOUND OR p.approval_status IS DISTINCT FROM 'approved' THEN RAISE EXCEPTION 'Product is not available'; END IF;
 IF NEW.quantity<=0 OR COALESCE(p.stock_quantity,0)<NEW.quantity THEN RAISE EXCEPTION 'Insufficient product stock'; END IF;
 IF p.sizing_enabled THEN
  SELECT value INTO row_data FROM jsonb_array_elements(p.size_chart->'rows') WHERE value->>'size'=NEW.selected_size;
  IF row_data IS NULL THEN RAISE EXCEPTION 'Please select a valid size'; END IF;
  IF (row_data->>'stock')::integer<NEW.quantity THEN RAISE EXCEPTION 'Selected size is out of stock'; END IF;
  NEW.size_measurements:=jsonb_build_object('unit',p.size_chart->>'unit','measurements',row_data->'measurements');
 ELSE NEW.selected_size:=NULL; NEW.size_measurements:=NULL;
 END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.decrement_product_stock_on_order_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE previous_flag text;
BEGIN
 -- COD confirms at placement; online draft items never change inventory.
 IF EXISTS(SELECT 1 FROM public.orders WHERE id=NEW.order_id AND payment_method='cod' AND status='processing') THEN
  previous_flag:=COALESCE(current_setting('vastra.inventory_internal',true),'off');
  PERFORM set_config('vastra.inventory_internal','on',true);
  UPDATE public.orders SET inventory_deducted=false WHERE id=NEW.order_id;
  -- Deduct only this new COD line; previously inserted COD lines are already deducted.
  PERFORM set_config('vastra.inventory_internal',previous_flag,true);
  -- Use a separate line operation below to avoid deducting previous lines again.
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.deduct_cod_order_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.products%ROWTYPE; idx integer; row_data jsonb; previous_flag text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.orders WHERE id=NEW.order_id AND payment_method='cod' AND status='processing') THEN RETURN NEW; END IF;
 previous_flag:=COALESCE(current_setting('vastra.inventory_internal',true),'off');
 PERFORM set_config('vastra.inventory_internal','on',true);
 SELECT * INTO p FROM public.products WHERE id=NEW.product_id FOR UPDATE;
 IF COALESCE(p.stock_quantity,0)<NEW.quantity THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
 IF p.sizing_enabled THEN
  SELECT (ordinality-1)::integer,value INTO idx,row_data FROM jsonb_array_elements(p.size_chart->'rows') WITH ORDINALITY WHERE value->>'size'=NEW.selected_size;
  IF idx IS NULL OR (row_data->>'stock')::integer<NEW.quantity THEN RAISE EXCEPTION 'Insufficient size stock'; END IF;
  UPDATE public.products SET size_chart=jsonb_set(size_chart,ARRAY['rows',idx::text,'stock'],to_jsonb((row_data->>'stock')::integer-NEW.quantity)) WHERE id=p.id;
 END IF;
 UPDATE public.products SET stock_quantity=stock_quantity-NEW.quantity,updated_at=now() WHERE id=p.id;
 UPDATE public.orders SET inventory_deducted=true,stock_restored=false WHERE id=NEW.order_id;
 PERFORM set_config('vastra.inventory_internal',previous_flag,true);
 RETURN NEW;
END $$;
DROP TRIGGER trg_decrement_product_stock_on_order_item ON public.order_items;
CREATE TRIGGER trg_decrement_product_stock_on_order_item AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.deduct_cod_order_item();
REVOKE ALL ON FUNCTION public.deduct_cod_order_item() FROM PUBLIC,anon,authenticated;

-- Restore only stock actually deducted, including size stock, exactly once.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.restore_product_stock_for_order(uuid)'::regprocedure) INTO definition;
 definition:=replace(definition,'SELECT stock_restored INTO restored FROM public.orders WHERE id=_order_id FOR UPDATE;','SELECT (stock_restored OR NOT inventory_deducted) INTO restored FROM public.orders WHERE id=_order_id FOR UPDATE;');
 EXECUTE definition;
END $$;

CREATE OR REPLACE FUNCTION public.guard_order_confirmation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.payment_method IS DISTINCT FROM 'cod' AND NEW.payment_status IS DISTINCT FROM 'completed' AND NEW.status IN ('processing','shipped','delivered') THEN
  RAISE EXCEPTION 'Online payment must be completed before order confirmation';
 END IF;
 IF TG_OP='UPDATE' AND NEW.payment_method='razorpay' AND NEW.payment_status='completed' AND OLD.payment_status IS DISTINCT FROM 'completed' THEN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Online payments must be verified by the payment service'; END IF;
  IF NEW.razorpay_order_id IS NULL OR NEW.razorpay_payment_id IS NULL OR NEW.paid_at IS NULL THEN RAISE EXCEPTION 'Verified gateway payment details are required'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_order_confirmation BEFORE INSERT OR UPDATE OF status,payment_status,payment_method ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_order_confirmation();
REVOKE ALL ON FUNCTION public.guard_order_confirmation() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.confirm_order_inventory()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.payment_method IS DISTINCT FROM 'cod' AND NEW.payment_status='completed' AND OLD.payment_status IS DISTINCT FROM 'completed' THEN
  PERFORM public.deduct_confirmed_order_inventory(NEW.id);
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER confirm_order_inventory AFTER UPDATE OF payment_status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.confirm_order_inventory();
REVOKE ALL ON FUNCTION public.confirm_order_inventory() FROM PUBLIC,anon,authenticated;

-- Only trusted functions and service-role payment updates may change protected fields.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.prevent_user_critical_order_updates()'::regprocedure) INTO definition;
 definition:=replace(definition,'IF public.has_role(auth.uid(), ''admin''::app_role) THEN','IF auth.role() = ''service_role'' OR current_setting(''vastra.checkout_internal'',true)=''on'' OR current_setting(''vastra.inventory_internal'',true)=''on'' OR (auth.uid() IS NULL AND current_setting(''request.jwt.claims'',true) IS NULL) OR public.has_role(auth.uid(), ''admin''::app_role) THEN');
 EXECUTE definition;
 SELECT pg_get_functiondef('public.create_checkout_order(uuid,text,text,text,text,text,jsonb,text,integer,numeric,numeric,text,text,text)'::regprocedure) INTO definition;
 definition:=replace(definition,'PERFORM public.price_checkout_order(_new_id);','PERFORM set_config(''vastra.checkout_internal'',''on'',true); PERFORM public.price_checkout_order(_new_id); PERFORM set_config(''vastra.checkout_internal'',''off'',true);');
 EXECUTE definition;
 SELECT pg_get_functiondef('public.record_payment_attempt(uuid,uuid,text)'::regprocedure) INTO definition;
 definition:=replace(definition,'UPDATE public.orders','PERFORM set_config(''vastra.checkout_internal'',''on'',true); UPDATE public.orders');
 definition:=replace(definition,'updated_at = now()','status = ''pending_payment'', updated_at = now()');
 definition:=replace(definition,'AND payment_status IN (''pending'', ''failed'', ''cancelled'');','AND payment_status IN (''pending'', ''failed'', ''cancelled'') AND payment_method = ''razorpay'' AND status NOT IN (''cancelled'',''returned'',''shipped'',''delivered''); PERFORM set_config(''vastra.checkout_internal'',''off'',true);');
 EXECUTE definition;
END $$;