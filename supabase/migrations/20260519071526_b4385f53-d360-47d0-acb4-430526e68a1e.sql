ALTER TABLE public.orders
  DROP COLUMN IF EXISTS stripe_session_id,
  DROP COLUMN IF EXISTS stripe_payment_intent_id,
  DROP COLUMN IF EXISTS paypal_order_id,
  DROP COLUMN IF EXISTS paypal_capture_id,
  DROP COLUMN IF EXISTS payu_txn_id,
  DROP COLUMN IF EXISTS payu_mihpayid;