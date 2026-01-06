-- Add image_url column to categories table
ALTER TABLE public.categories
ADD COLUMN image_url text;

-- Create a junction table for many-to-many relationship between products and categories
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id integer NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, category_id)
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_categories
CREATE POLICY "Anyone can view product categories"
ON public.product_categories
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert product categories"
ON public.product_categories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product categories"
ON public.product_categories
FOR DELETE
USING (has_role(auth.uid(), 'admin'));