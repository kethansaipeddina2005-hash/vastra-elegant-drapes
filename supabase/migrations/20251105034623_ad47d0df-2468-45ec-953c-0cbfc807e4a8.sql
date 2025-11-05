-- Add videos column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}';

COMMENT ON COLUMN products.videos IS 'Array of video URLs for the product';