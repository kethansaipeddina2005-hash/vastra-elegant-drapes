-- Create categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon_name text NOT NULL DEFAULT 'Sparkles',
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Anyone can view active categories"
ON public.categories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all categories"
ON public.categories
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add category_id to products table
ALTER TABLE public.products
ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create trigger for updated_at on categories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();