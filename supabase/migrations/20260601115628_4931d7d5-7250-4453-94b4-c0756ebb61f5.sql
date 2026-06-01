-- Allow guest checkout: orders can be created without an authenticated user.
-- Guests are identified by a guest_token stored on the order. The token is
-- returned to the buyer and required for any later lookup via RPC.

ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_token uuid;

-- Backfill not needed for existing rows (they have user_id). New guest rows must have a token.
CREATE UNIQUE INDEX IF NOT EXISTS orders_guest_token_uidx
  ON public.orders (guest_token) WHERE guest_token IS NOT NULL;

-- Allow anon role to create guest orders and their items
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;

-- New policy: anyone (anon or authenticated) can create a guest order
-- as long as user_id is NULL, guest_token is provided, and customer_email is given.
DROP POLICY IF EXISTS "Anyone can create guest orders" ON public.orders;
CREATE POLICY "Anyone can create guest orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL
  AND guest_token IS NOT NULL
  AND customer_email IS NOT NULL
  AND length(btrim(customer_email)) > 3
);

-- Allow inserting order_items into a freshly-created guest order (matched by null user_id)
DROP POLICY IF EXISTS "Anyone can insert items for guest orders" ON public.order_items;
CREATE POLICY "Anyone can insert items for guest orders"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.user_id IS NULL
      AND o.guest_token IS NOT NULL
      AND o.created_at > (now() - interval '15 minutes')
  )
);

-- Security-definer lookup so a guest can fetch their order with the token they received.
CREATE OR REPLACE FUNCTION public.get_guest_order(_order_id uuid, _guest_token uuid)
RETURNS TABLE (
  id uuid,
  order_number text,
  status text,
  payment_status text,
  payment_method text,
  total_amount numeric,
  final_amount numeric,
  discount_percent integer,
  coupon_code text,
  customer_name text,
  customer_email text,
  customer_phone text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method,
         o.total_amount, o.final_amount, o.discount_percent, o.coupon_code,
         o.customer_name, o.customer_email, o.customer_phone, o.created_at
  FROM public.orders o
  WHERE o.id = _order_id
    AND o.guest_token IS NOT NULL
    AND o.guest_token = _guest_token;
$$;

REVOKE EXECUTE ON FUNCTION public.get_guest_order(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guest_order(uuid, uuid) TO anon, authenticated;
