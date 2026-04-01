ALTER TABLE public.categories ADD COLUMN is_featured boolean DEFAULT false;
ALTER TABLE public.categories ADD COLUMN featured_label text DEFAULT NULL;