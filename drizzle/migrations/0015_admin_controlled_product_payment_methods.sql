CREATE OR REPLACE FUNCTION public.guard_product_payment_options()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_options IS DISTINCT FROM 'both' THEN RAISE EXCEPTION 'Only admins can select product payment methods'; END IF;
  ELSIF NEW.payment_options IS DISTINCT FROM OLD.payment_options THEN
    RAISE EXCEPTION 'Only admins can change product payment methods';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_product_payment_options BEFORE INSERT OR UPDATE OF payment_options ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_product_payment_options();
CREATE OR REPLACE FUNCTION public.validate_order_payment_method_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.payment_method IS NOT DISTINCT FROM OLD.payment_method THEN RETURN NEW; END IF;
  IF NEW.payment_method IS NULL OR NEW.payment_method NOT IN ('cod','razorpay') THEN RAISE EXCEPTION 'Choose a supported payment method'; END IF;
  IF EXISTS (SELECT 1 FROM public.order_items i JOIN public.products p ON p.id=i.product_id WHERE i.order_id=NEW.id AND ((p.payment_options='online' AND NEW.payment_method='cod') OR (p.payment_options='cod' AND NEW.payment_method='razorpay'))) THEN
    RAISE EXCEPTION 'This payment method is not available for all products in the order';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validate_order_payment_method_change BEFORE UPDATE OF payment_method ON public.orders FOR EACH ROW EXECUTE FUNCTION public.validate_order_payment_method_change();