ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_public_coupons(_cart_total numeric DEFAULT 0)
RETURNS TABLE(code text, discount_percent integer, min_amount numeric, expiry_date timestamptz, usage_limit_per_user integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.code, c.discount_percent, COALESCE(c.min_amount, 0), c.expiry_date, c.usage_limit_per_user
  FROM public.coupons c
  WHERE c.is_active = true
    AND c.is_public = true
    AND c.expiry_date >= now()
  ORDER BY c.discount_percent DESC, c.min_amount ASC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_coupons(numeric) TO anon, authenticated;