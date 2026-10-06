ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_master boolean NOT NULL DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON public.categories (slug) WHERE slug IS NOT NULL;