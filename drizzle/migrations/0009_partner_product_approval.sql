ALTER TABLE public.products ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS approval_notes text;

CREATE OR REPLACE FUNCTION public.enforce_partner_product_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.partner_id IS NULL OR public.has_role(auth.uid(),'admin') OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  -- Partner-created or partner-edited products go back to review
  NEW.approval_status := 'pending';
  IF TG_OP = 'UPDATE' THEN NEW.approval_notes := OLD.approval_notes; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_enforce_partner_product_approval BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.enforce_partner_product_approval();

DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Approved products are viewable by everyone" ON public.products FOR SELECT
USING (approval_status = 'approved'
  OR public.has_role(auth.uid(),'admin')
  OR (partner_id IS NOT NULL AND partner_id = public.partner_application_id(auth.jwt()->>'email')));

CREATE OR REPLACE FUNCTION public.block_unapproved_order_items()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND approval_status <> 'approved') THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_block_unapproved_order_items BEFORE INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.block_unapproved_order_items();