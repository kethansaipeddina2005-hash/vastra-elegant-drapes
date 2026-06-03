ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_item_id uuid;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_product_id_user_id_key') THEN
    ALTER TABLE public.reviews DROP CONSTRAINT reviews_product_id_user_id_key;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_id_product_id_key') THEN
    ALTER TABLE public.reviews DROP CONSTRAINT reviews_user_id_product_id_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_product_orderitem_uniq
  ON public.reviews (user_id, product_id, order_item_id)
  WHERE order_item_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.user_can_review_product(_user_id uuid, _product_id integer, _order_item_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = _order_item_id
      AND oi.product_id = _product_id
      AND o.user_id = _user_id
      AND o.status = 'delivered'
  );
$$;

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;

CREATE POLICY "Verified purchasers can create reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND order_item_id IS NOT NULL
  AND public.user_can_review_product(auth.uid(), product_id, order_item_id)
);