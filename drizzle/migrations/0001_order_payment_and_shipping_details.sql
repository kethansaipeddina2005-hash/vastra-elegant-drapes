ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_pincode text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_country text;

-- Extend the checkout RPC so pincode / country are stored as structured fields
CREATE OR REPLACE FUNCTION public.create_checkout_order(
  _guest_token uuid,
  _customer_name text,
  _customer_email text,
  _customer_phone text,
  _shipping_address text,
  _payment_method text,
  _items jsonb,
  _coupon_code text DEFAULT NULL,
  _discount_percent integer DEFAULT 0,
  _total_amount numeric DEFAULT 0,
  _final_amount numeric DEFAULT 0,
  _pricing_region text DEFAULT 'india',
  _shipping_pincode text DEFAULT NULL,
  _shipping_country text DEFAULT NULL
)
RETURNS TABLE(order_id uuid, order_number text, guest_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _token uuid;
  _new_id uuid;
  _new_num text;
  it jsonb;
  _pid integer;
  _qty integer;
  _unit numeric;
  _stock integer;
BEGIN
  IF _customer_name IS NULL OR btrim(_customer_name) = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  IF _customer_email IS NULL OR _customer_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;
  IF _customer_phone IS NULL OR length(regexp_replace(_customer_phone, '\D', '', 'g')) < 8 THEN
    RAISE EXCEPTION 'A valid phone number is required';
  END IF;
  IF _shipping_address IS NULL OR length(btrim(_shipping_address)) < 10 THEN
    RAISE EXCEPTION 'A complete shipping address is required';
  END IF;
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Your cart is empty';
  END IF;

  IF _uid IS NULL THEN
    _token := COALESCE(_guest_token, gen_random_uuid());
  ELSE
    _token := NULL;
  END IF;

  INSERT INTO public.orders (
    user_id, guest_token, total_amount, final_amount, discount_percent, coupon_code,
    status, payment_method, payment_status,
    customer_name, customer_email, customer_phone,
    shipping_address_text, shipping_pincode, shipping_country
  ) VALUES (
    _uid, _token, COALESCE(_total_amount, 0), COALESCE(_final_amount, 0),
    COALESCE(_discount_percent, 0), NULLIF(btrim(COALESCE(_coupon_code, '')), ''),
    'processing', COALESCE(_payment_method, 'razorpay'), 'pending',
    btrim(_customer_name), lower(btrim(_customer_email)), btrim(_customer_phone),
    btrim(_shipping_address),
    NULLIF(btrim(COALESCE(_shipping_pincode, '')), ''),
    COALESCE(NULLIF(btrim(COALESCE(_shipping_country, '')), ''),
             CASE WHEN _pricing_region = 'foreign' THEN 'International' ELSE 'India' END)
  )
  RETURNING id, orders.order_number INTO _new_id, _new_num;

  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _pid := (it->>'product_id')::int;
    _qty := GREATEST(1, COALESCE((it->>'quantity')::int, 1));

    SELECT CASE WHEN _pricing_region = 'foreign' AND p.foreign_price IS NOT NULL AND p.foreign_price > 0
                THEN p.foreign_price ELSE p.price END,
           COALESCE(p.stock_quantity, 0)
      INTO _unit, _stock
    FROM public.products p WHERE p.id = _pid;

    IF _unit IS NULL THEN
      RAISE EXCEPTION 'Product % is no longer available', _pid;
    END IF;
    IF _stock < _qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %', _pid;
    END IF;

    INSERT INTO public.order_items (order_id, product_id, quantity, price)
    VALUES (_new_id, _pid, _qty, _unit);
  END LOOP;

  RETURN QUERY SELECT _new_id, _new_num, _token;
END;
$$;

REVOKE ALL ON FUNCTION public.create_checkout_order(uuid,text,text,text,text,text,jsonb,text,integer,numeric,numeric,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(uuid,text,text,text,text,text,jsonb,text,integer,numeric,numeric,text,text,text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.create_checkout_order(uuid,text,text,text,text,text,jsonb,text,integer,numeric,numeric,text);
