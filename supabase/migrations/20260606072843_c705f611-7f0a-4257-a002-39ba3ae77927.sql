
-- 1. Fix chat-images SELECT policy: don't let any authenticated user read admin-uploaded files
DROP POLICY IF EXISTS "Chat images: participant can read" ON storage.objects;
CREATE POLICY "Chat images: participant can read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-images'
  AND (
    -- Owner of the folder
    (storage.foldername(name))[1] = (auth.uid())::text
    -- Admins can read all chat images
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    -- Customers can read admin-uploaded images that belong to a conversation they own
    OR (
      (storage.foldername(name))[1] = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.customer_id = auth.uid()
          AND (storage.foldername(name))[2] = (c.id)::text
      )
    )
  )
);

-- 2. Fix review-photos INSERT policy: enforce folder ownership
DROP POLICY IF EXISTS "Authenticated users can upload review photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'review-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- 3. Lock down SECURITY DEFINER functions from anon; keep get_guest_order publicly callable
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.user_can_review_product(uuid, integer, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_review_product(uuid, integer, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.restore_product_stock_for_order(uuid) FROM anon, PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_product_stock_for_order(uuid) TO service_role;
