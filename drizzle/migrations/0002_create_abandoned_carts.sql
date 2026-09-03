CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_token uuid NOT NULL UNIQUE,
  user_id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  item_count integer NOT NULL DEFAULT 0,
  cart_value numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  checkout_started_at timestamptz,
  purchased_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_abandoned_carts_status ON public.abandoned_carts(status);
CREATE INDEX idx_abandoned_carts_last_activity ON public.abandoned_carts(last_activity_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.abandoned_carts TO authenticated;
GRANT ALL ON public.abandoned_carts TO service_role;

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view carts" ON public.abandoned_carts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update carts" ON public.abandoned_carts
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete carts" ON public.abandoned_carts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_abandoned_carts_updated
  BEFORE UPDATE ON public.abandoned_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Anonymous cart sync: no personal data required, keyed only by an opaque cart token.
CREATE OR REPLACE FUNCTION public.sync_cart(
  _cart_token uuid,
  _items jsonb,
  _cart_value numeric,
  _item_count integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _cart_token IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.abandoned_carts (cart_token, user_id, items, cart_value, item_count, status, last_activity_at)
  VALUES (_cart_token, auth.uid(), COALESCE(_items, '[]'::jsonb), COALESCE(_cart_value, 0),
          COALESCE(_item_count, 0),
          CASE WHEN COALESCE(_item_count, 0) > 0 THEN 'active' ELSE 'abandoned' END,
          now())
  ON CONFLICT (cart_token) DO UPDATE
    SET items = COALESCE(EXCLUDED.items, '[]'::jsonb),
        cart_value = EXCLUDED.cart_value,
        item_count = EXCLUDED.item_count,
        user_id = COALESCE(public.abandoned_carts.user_id, EXCLUDED.user_id),
        last_activity_at = now(),
        status = CASE
          WHEN public.abandoned_carts.status IN ('purchased', 'recovered') THEN public.abandoned_carts.status
          WHEN COALESCE(EXCLUDED.item_count, 0) = 0 THEN 'abandoned'
          WHEN public.abandoned_carts.status = 'checkout_started' THEN 'checkout_started'
          ELSE 'active'
        END;
END;
$$;

-- Associates voluntarily entered checkout details with the existing anonymous cart.
CREATE OR REPLACE FUNCTION public.attach_cart_customer(
  _cart_token uuid,
  _customer_name text DEFAULT NULL,
  _customer_email text DEFAULT NULL,
  _customer_phone text DEFAULT NULL,
  _checkout_started boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _cart_token IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.abandoned_carts
  SET customer_name = COALESCE(NULLIF(btrim(COALESCE(_customer_name, '')), ''), customer_name),
      customer_email = COALESCE(NULLIF(lower(btrim(COALESCE(_customer_email, ''))), ''), customer_email),
      customer_phone = COALESCE(NULLIF(btrim(COALESCE(_customer_phone, '')), ''), customer_phone),
      user_id = COALESCE(user_id, auth.uid()),
      checkout_started_at = CASE WHEN _checkout_started THEN COALESCE(checkout_started_at, now()) ELSE checkout_started_at END,
      status = CASE
        WHEN status IN ('purchased', 'recovered') THEN status
        WHEN _checkout_started THEN 'checkout_started'
        ELSE status
      END,
      last_activity_at = now()
  WHERE cart_token = _cart_token;
END;
$$;

-- Links a completed order back to the originating cart.
CREATE OR REPLACE FUNCTION public.mark_cart_purchased(
  _cart_token uuid,
  _order_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  was_stale boolean;
BEGIN
  IF _cart_token IS NULL OR _order_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = _order_id) THEN
    RETURN;
  END IF;

  SELECT (last_activity_at < now() - interval '30 minutes') INTO was_stale
  FROM public.abandoned_carts WHERE cart_token = _cart_token;

  UPDATE public.abandoned_carts
  SET order_id = _order_id,
      status = CASE WHEN COALESCE(was_stale, false) THEN 'recovered' ELSE 'purchased' END,
      purchased_at = COALESCE(purchased_at, now()),
      last_activity_at = now()
  WHERE cart_token = _cart_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_cart(uuid, jsonb, numeric, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attach_cart_customer(uuid, text, text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_cart_purchased(uuid, uuid) TO anon, authenticated;