-- 1. Prevent users from modifying protected order fields (payment_status, totals, etc.)
CREATE OR REPLACE FUNCTION public.prevent_user_critical_order_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.final_amount IS DISTINCT FROM OLD.final_amount
     OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
     OR NEW.discount_percent IS DISTINCT FROM OLD.discount_percent
     OR NEW.coupon_code IS DISTINCT FROM OLD.coupon_code
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.refund_status IS DISTINCT FROM OLD.refund_status
     OR NEW.refund_amount IS DISTINCT FROM OLD.refund_amount
     OR NEW.refund_notes IS DISTINCT FROM OLD.refund_notes
     OR NEW.shipping_id IS DISTINCT FROM OLD.shipping_id
     OR NEW.shipping_company IS DISTINCT FROM OLD.shipping_company
     OR NEW.return_product_received IS DISTINCT FROM OLD.return_product_received
     OR NEW.return_product_ok IS DISTINCT FROM OLD.return_product_ok
     OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'Users cannot modify protected order fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_user_critical_order_updates_trg ON public.orders;
CREATE TRIGGER prevent_user_critical_order_updates_trg
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.prevent_user_critical_order_updates();

REVOKE EXECUTE ON FUNCTION public.prevent_user_critical_order_updates() FROM PUBLIC, anon, authenticated;

-- 2. Restrict coupons SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons FOR SELECT
TO authenticated
USING (is_active = true);

-- 3. Add UPDATE policy for review-photos bucket scoped to owner
DROP POLICY IF EXISTS "Users can update their own review photos" ON storage.objects;
CREATE POLICY "Users can update their own review photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'review-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'review-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Tighten realtime.messages policy to scope by topic (conversation id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'realtime' AND table_name = 'messages'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can read own conversation realtime" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "Authenticated can read own conversation realtime"
        ON realtime.messages FOR SELECT TO authenticated
        USING (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.customer_id = auth.uid()
              AND realtime.topic() LIKE '%' || c.id::text || '%'
          )
        )
    $p$;
  END IF;
END $$;