ALTER TABLE public.products ADD COLUMN foreign_price numeric DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN country_type text DEFAULT 'india';