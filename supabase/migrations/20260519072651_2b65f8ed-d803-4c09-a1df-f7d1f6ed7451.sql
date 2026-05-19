
-- Make buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('fit-check-photos', 'chat-images');

-- Drop existing permissive policies for these buckets
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (
        policyname ILIKE '%fit%check%'
        OR policyname ILIKE '%chat%image%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- fit-check-photos: owner-scoped + admin
CREATE POLICY "Fit check photos: owner can read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'fit-check-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Fit check photos: admins can read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'fit-check-photos'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Fit check photos: owner can upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fit-check-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Fit check photos: owner can update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'fit-check-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Fit check photos: owner can delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'fit-check-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- chat-images: customer sees own folder + admin folder, admins see all
CREATE POLICY "Chat images: participant can read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (storage.foldername(name))[1] = 'admin'
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );

CREATE POLICY "Chat images: customer can upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Chat images: admin can upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Realtime access policies: restrict channel subscriptions to own data
-- realtime.messages governs realtime channel access
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'realtime' AND table_name = 'messages'
  ) THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can read own conversation realtime" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "Authenticated can read own conversation realtime"
        ON realtime.messages FOR SELECT TO authenticated
        USING (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.customer_id = auth.uid()
          )
        )
    $p$;
  END IF;
END $$;
