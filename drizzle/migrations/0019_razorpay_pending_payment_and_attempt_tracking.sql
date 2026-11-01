CREATE OR REPLACE FUNCTION public.create_checkout_order(_guest_token uuid DEFAULT NULL, _customer_name text DEFAULT NULL, _customer_email text DEFAULT NULL, _customer_phone text DEFAULT NULL, _shipping_address text DEFAULT NULL, _payment_method text DEFAULT NULL, _items jsonb DEFAULT NULL, _coupon_code text DEFAULT NULL, _discount_percent integer DEFAULT NULL, _total_amount numeric DEFAULT NULL, _final_amount numeric DEFAULT NULL, _pricing_region text DEFAULT NULL, _shipping_pincode text DEFAULT NULL, _shipping_country text DEFAULT NULL)
RETURNS TABLE(order_id uuid, order_number text, guest_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  _method text := COALESCE(_payment_method, 'razorpay');
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
    CASE WHEN _method = 'razorpay' THEN 'pending_payment' ELSE 'processing' END,
    _method, 'pending',
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

    INSERT INTO public.order_items (order_id, product_id, quantity, price, selected_size)
    VALUES (_new_id, _pid, _qty, _unit, it->>'selected_size');
  END LOOP;

  RETURN QUERY SELECT _new_id, _new_num, _token;
END;
$$;

-- Records a failed or cancelled Razorpay attempt. Ownership-checked; never
-- overwrites a completed payment, so duplicate/late callbacks are safe.
CREATE OR REPLACE FUNCTION public.record_payment_attempt(_order_id uuid, _guest_token uuid, _outcome text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _ord public.orders%ROWTYPE;
BEGIN
  IF _outcome NOT IN ('failed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid payment outcome';
  END IF;

  SELECT * INTO _ord FROM public.orders WHERE id = _order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF _ord.user_id IS NOT NULL THEN
    IF _uid IS NULL OR _uid <> _ord.user_id THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  ELSE
    IF _guest_token IS NULL OR _guest_token <> _ord.guest_token THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;

  -- Idempotent: only a still-pending payment can be marked failed/cancelled.
  UPDATE public.orders
     SET payment_status = _outcome,
         updated_at = now()
   WHERE id = _order_id
     AND payment_status IN ('pending', 'failed', 'cancelled');
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_payment_attempt(uuid, uuid, text) TO anon, authenticated;