ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payu_txn_id text,
  ADD COLUMN IF NOT EXISTS payu_mihpayid text;