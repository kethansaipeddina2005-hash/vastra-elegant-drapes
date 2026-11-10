DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Users and admins can read review records" ON public.reviews
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.get_public_product_reviews(_product_id integer)
RETURNS TABLE (
  id uuid,
  rating integer,
  comment text,
  photos text[],
  created_at timestamptz,
  verified_purchase boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT r.id, r.rating, r.comment, r.photos, r.created_at, r.order_item_id IS NOT NULL
  FROM public.reviews r
  WHERE r.product_id = _product_id
  ORDER BY r.created_at DESC;
$function$;
GRANT EXECUTE ON FUNCTION public.get_public_product_reviews(integer) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone upload partner application files" ON storage.objects;
CREATE POLICY "Applicants upload files to own folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'partner-applications'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
  AND (storage.foldername(name))[2] IN ('logo', 'catalogue')
);

DROP POLICY IF EXISTS "Public read approved partner logos" ON storage.objects;