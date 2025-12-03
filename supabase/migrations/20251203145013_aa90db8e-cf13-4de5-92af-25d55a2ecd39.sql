-- Add shipping_company column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_company text;