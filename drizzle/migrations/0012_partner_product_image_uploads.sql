CREATE POLICY "Partners can upload product images to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'partner-' || public.partner_application_id(auth.jwt() ->> 'email')::text
);

CREATE POLICY "Partners can update own product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'partner-' || public.partner_application_id(auth.jwt() ->> 'email')::text
);

CREATE POLICY "Partners can delete own product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'partner-' || public.partner_application_id(auth.jwt() ->> 'email')::text
);