ALTER TABLE public.partner_applications ADD COLUMN logo_path text, ADD COLUMN catalogue_path text;
CREATE POLICY "Anyone upload partner application files" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'partner-applications' AND (storage.foldername(name))[1] IN ('logo','catalogue'));
CREATE POLICY "Admins read partner application files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'partner-applications' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete partner application files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'partner-applications' AND public.has_role(auth.uid(),'admin'));