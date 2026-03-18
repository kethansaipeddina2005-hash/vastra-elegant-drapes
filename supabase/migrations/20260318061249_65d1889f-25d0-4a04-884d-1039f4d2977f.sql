
-- Add fit_check_photo column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fit_check_photo text;

-- Create storage bucket for fit-check photos
INSERT INTO storage.buckets (id, name, public) VALUES ('fit-check-photos', 'fit-check-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own fit check photos
CREATE POLICY "Users can upload fit check photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fit-check-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Anyone can view fit check photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fit-check-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their fit check photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fit-check-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
