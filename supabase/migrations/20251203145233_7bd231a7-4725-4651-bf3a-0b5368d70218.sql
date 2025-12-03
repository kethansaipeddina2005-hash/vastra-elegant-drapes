-- Add minimum amount field to coupons table
ALTER TABLE public.coupons 
ADD COLUMN min_amount numeric DEFAULT 0;