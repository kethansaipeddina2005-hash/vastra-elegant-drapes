-- Add stock_restored guard column
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_restored boolean NOT NULL DEFAULT false;

-- Restore function
CREATE OR REPLACE FUNCTION public.restore_product_stock_for_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  already_restored boolean;
BEGIN
  SELECT stock_restored INTO already_restored FROM public.orders WHERE id = _order_id;
  IF already_restored IS TRUE THEN
    RETURN;
  END IF;

  UPDATE public.products p
  SET stock_quantity = COALESCE(p.stock_quantity, 0) + oi.quantity,
      updated_at = now()
  FROM public.order_items oi
  WHERE oi.order_id = _order_id
    AND oi.product_id = p.id;

  UPDATE public.orders SET stock_restored = true WHERE id = _order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.restore_product_stock_for_order(uuid) FROM PUBLIC, anon, authenticated;

-- Trigger function on orders status change
CREATE OR REPLACE FUNCTION public.handle_order_status_stock_restore()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (COALESCE(OLD.status, '') NOT IN ('cancelled','returned'))
     AND (NEW.status IN ('cancelled','returned'))
     AND NEW.stock_restored IS NOT TRUE
  THEN
    PERFORM public.restore_product_stock_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restore_stock_on_order_status_change ON public.orders;
CREATE TRIGGER restore_stock_on_order_status_change
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_status_stock_restore();