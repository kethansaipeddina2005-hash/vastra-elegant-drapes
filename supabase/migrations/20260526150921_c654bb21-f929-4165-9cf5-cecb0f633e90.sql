
-- Auto-decrement product stock when an order item is created
CREATE OR REPLACE FUNCTION public.decrement_product_stock_on_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - COALESCE(NEW.quantity, 0)),
      updated_at = now()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_product_stock_on_order_item() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_decrement_product_stock_on_order_item ON public.order_items;
CREATE TRIGGER trg_decrement_product_stock_on_order_item
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.decrement_product_stock_on_order_item();
