CREATE OR REPLACE FUNCTION public.handle_order_status_stock_restore() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.stock_restored IS NOT TRUE AND NEW.inventory_deducted AND
  ((OLD.status NOT IN ('cancelled','returned') AND NEW.status IN ('cancelled','returned')) OR
   (NEW.status='pending_payment' AND NEW.payment_method='razorpay' AND NEW.payment_status IN ('pending','failed','cancelled'))) THEN
  PERFORM public.restore_product_stock_for_order(NEW.id);
 END IF;
 RETURN NEW;
END $$;