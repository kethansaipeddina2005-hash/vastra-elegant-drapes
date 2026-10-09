ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizing_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_chart jsonb NOT NULL DEFAULT '{"unit":"cm","columns":["Bust","Waist","Hip","Shoulder","Length"],"rows":[]}'::jsonb;
ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS size_editing_allowed boolean NOT NULL DEFAULT true;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_size text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size_measurements jsonb;
CREATE TABLE public.size_chart_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, category_id uuid REFERENCES public.categories(id), chart jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.size_chart_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.size_chart_templates TO authenticated;
GRANT ALL ON public.size_chart_templates TO service_role;
ALTER TABLE public.size_chart_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read size templates" ON public.size_chart_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage size templates" ON public.size_chart_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.validate_product_sizing() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r jsonb; labels text[] := ARRAY[]::text[]; total integer := 0; m jsonb;
BEGIN
 IF current_setting('vastra.inventory_internal',true)='on' THEN RETURN NEW; END IF;
 IF NEW.partner_id IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') AND (TG_OP='INSERT' OR NEW.size_chart IS DISTINCT FROM OLD.size_chart OR NEW.sizing_enabled IS DISTINCT FROM OLD.sizing_enabled OR (NEW.sizing_enabled AND NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity)) THEN
  IF NOT EXISTS (SELECT 1 FROM public.partner_applications WHERE id=NEW.partner_id AND size_editing_allowed AND status='approved' AND lower(email)=lower(auth.jwt()->>'email')) THEN RAISE EXCEPTION 'Size editing is restricted by admin'; END IF;
 END IF;
 IF NOT NEW.sizing_enabled THEN RETURN NEW; END IF;
 IF jsonb_typeof(NEW.size_chart->'rows') IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.size_chart->'rows')=0 THEN RAISE EXCEPTION 'Add at least one size'; END IF;
 IF NEW.size_chart->>'unit' NOT IN ('cm','in') OR jsonb_typeof(NEW.size_chart->'columns') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid chart format'; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(NEW.size_chart->'rows') LOOP
  IF length(btrim(COALESCE(r->>'size','')))=0 OR lower(btrim(r->>'size'))=ANY(labels) THEN RAISE EXCEPTION 'Sizes must be named and unique'; END IF;
  labels := array_append(labels,lower(btrim(r->>'size')));
  IF COALESCE(r->>'stock','') !~ '^\d+$' THEN RAISE EXCEPTION 'Size stock must be a non-negative whole number'; END IF;
  IF jsonb_typeof(r->'measurements') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid measurements'; END IF;
  FOR m IN SELECT value FROM jsonb_each(r->'measurements') LOOP
   IF m#>>'{}' <> '' AND ((m#>>'{}') !~ '^\d+(\.\d+)?$' OR (m#>>'{}')::numeric<=0) THEN RAISE EXCEPTION 'Measurements must be positive numbers'; END IF;
  END LOOP;
  total := total+(r->>'stock')::integer;
 END LOOP;
 NEW.stock_quantity := total;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_validate_product_sizing BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.validate_product_sizing();
CREATE OR REPLACE FUNCTION public.enforce_partner_product_approval() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF current_setting('vastra.inventory_internal',true)='on' OR current_setting('vastra.pricing_sync',true)='on' OR NEW.partner_id IS NULL OR public.has_role(auth.uid(),'admin') OR auth.uid() IS NULL THEN RETURN NEW; END IF;
 NEW.approval_status:='pending';
 IF TG_OP='UPDATE' THEN NEW.approval_notes:=OLD.approval_notes; END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.reserve_size_inventory() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.products%ROWTYPE; idx integer; row_data jsonb; previous_flag text;
BEGIN
 SELECT * INTO p FROM public.products WHERE id=NEW.product_id FOR UPDATE;
 IF p.id IS NULL OR p.approval_status IS DISTINCT FROM 'approved' THEN RAISE EXCEPTION 'Product is not available'; END IF;
 IF NEW.quantity<=0 OR COALESCE(p.stock_quantity,0)<NEW.quantity THEN RAISE EXCEPTION 'Insufficient product stock'; END IF;
 IF p.sizing_enabled THEN
  SELECT (ordinality-1)::integer,value INTO idx,row_data FROM jsonb_array_elements(p.size_chart->'rows') WITH ORDINALITY WHERE value->>'size'=NEW.selected_size;
  IF idx IS NULL THEN RAISE EXCEPTION 'Please select a valid size'; END IF;
  IF (row_data->>'stock')::integer<NEW.quantity THEN RAISE EXCEPTION 'Selected size is out of stock'; END IF;
  NEW.size_measurements := jsonb_build_object('unit',p.size_chart->>'unit','measurements',row_data->'measurements');
  previous_flag:=COALESCE(current_setting('vastra.inventory_internal',true),'off');
  PERFORM set_config('vastra.inventory_internal','on',true);
  UPDATE public.products SET size_chart=jsonb_set(size_chart,ARRAY['rows',idx::text,'stock'],to_jsonb((row_data->>'stock')::integer-NEW.quantity)) WHERE id=p.id;
  PERFORM set_config('vastra.inventory_internal',previous_flag,true);
 ELSE
  NEW.selected_size:=NULL; NEW.size_measurements:=NULL;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_reserve_size_inventory BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.reserve_size_inventory();
CREATE OR REPLACE FUNCTION public.decrement_product_stock_on_order_item() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE previous_flag text;
BEGIN
 previous_flag:=COALESCE(current_setting('vastra.inventory_internal',true),'off');
 PERFORM set_config('vastra.inventory_internal','on',true);
 UPDATE public.products SET stock_quantity=COALESCE(stock_quantity,0)-NEW.quantity,updated_at=now() WHERE id=NEW.product_id;
 PERFORM set_config('vastra.inventory_internal',previous_flag,true);
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.restore_product_stock_for_order(_order_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE restored boolean; i record; p public.products%ROWTYPE; idx integer; row_data jsonb; previous_flag text;
BEGIN
 SELECT stock_restored INTO restored FROM public.orders WHERE id=_order_id FOR UPDATE;
 IF restored IS TRUE OR restored IS NULL THEN RETURN; END IF;
 previous_flag:=COALESCE(current_setting('vastra.inventory_internal',true),'off');
 PERFORM set_config('vastra.inventory_internal','on',true);
 FOR i IN SELECT * FROM public.order_items WHERE order_id=_order_id ORDER BY product_id LOOP
  SELECT * INTO p FROM public.products WHERE id=i.product_id FOR UPDATE;
  IF i.selected_size IS NOT NULL THEN
   SELECT (ordinality-1)::integer,value INTO idx,row_data FROM jsonb_array_elements(p.size_chart->'rows') WITH ORDINALITY WHERE value->>'size'=i.selected_size;
   IF idx IS NOT NULL THEN
    UPDATE public.products SET size_chart=jsonb_set(size_chart,ARRAY['rows',idx::text,'stock'],to_jsonb((row_data->>'stock')::integer+i.quantity)) WHERE id=i.product_id;
   ELSE
    UPDATE public.products SET size_chart=jsonb_set(size_chart,'{rows}',(size_chart->'rows') || jsonb_build_array(jsonb_build_object('size',i.selected_size,'stock',i.quantity,'measurements',COALESCE(i.size_measurements->'measurements','{}'::jsonb)))) WHERE id=i.product_id;
   END IF;
  END IF;
  UPDATE public.products SET stock_quantity=COALESCE(stock_quantity,0)+i.quantity,updated_at=now() WHERE id=i.product_id;
 END LOOP;
 UPDATE public.orders SET stock_restored=true WHERE id=_order_id;
 PERFORM set_config('vastra.inventory_internal',previous_flag,true);
END $$;
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef(oid) INTO definition FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='create_checkout_order';
 definition:=replace(definition,'INSERT INTO public.order_items (order_id, product_id, quantity, price)','INSERT INTO public.order_items (order_id, product_id, quantity, price, selected_size)');
 definition:=replace(definition,'VALUES (_new_id, _pid, _qty, _unit);','VALUES (_new_id, _pid, _qty, _unit, it->>''selected_size'');');
 EXECUTE definition;
END $$;
CREATE OR REPLACE FUNCTION public.get_order_receipt(_order_id uuid,_guest_token uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT to_jsonb(o) - 'guest_token' || jsonb_build_object('order_items',COALESCE((SELECT jsonb_agg(to_jsonb(i)||jsonb_build_object('products',jsonb_build_object('name',p.name,'images',p.images,'product_code',p.product_code))) FROM public.order_items i LEFT JOIN public.products p ON p.id=i.product_id WHERE i.order_id=o.id),'[]'::jsonb))
 FROM public.orders o WHERE o.id=_order_id AND (o.user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR (o.user_id IS NULL AND o.guest_token IS NOT NULL AND o.guest_token=_guest_token));
$$;
REVOKE ALL ON FUNCTION public.get_order_receipt(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_receipt(uuid,uuid) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.guard_partner_conversation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE partner uuid;
BEGIN
 partner:=public.partner_application_id(auth.jwt()->>'email');
 IF partner IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
  IF NEW.customer_id IS DISTINCT FROM auth.uid() OR NOT EXISTS(SELECT 1 FROM public.products WHERE id=NEW.product_id AND partner_id=partner) THEN RAISE EXCEPTION 'Select one of your products for this query'; END IF;
  SELECT 'Partner: '||brand_name||' — product query' INTO NEW.subject FROM public.partner_applications WHERE id=partner;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_partner_conversation BEFORE INSERT OR UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.guard_partner_conversation();