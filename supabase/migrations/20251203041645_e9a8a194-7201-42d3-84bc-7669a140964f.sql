-- Fix foreign key constraints to allow product deletion
-- First, drop existing foreign key constraint on order_items
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Re-add with ON DELETE CASCADE (allows deleting products even with order history)
ALTER TABLE public.order_items 
  ADD CONSTRAINT order_items_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE CASCADE;

-- Also fix reviews foreign key to cascade on delete
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;

ALTER TABLE public.reviews 
  ADD CONSTRAINT reviews_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE CASCADE;

-- Add RLS policies for user_roles management by admins
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (has_role(auth.uid(), 'admin'));