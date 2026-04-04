ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS return_product_received boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS return_product_ok boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS refund_status text DEFAULT null,
ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS refund_notes text DEFAULT null;