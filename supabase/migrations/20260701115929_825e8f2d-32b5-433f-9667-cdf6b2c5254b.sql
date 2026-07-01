
-- 1. Extend coupons
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS collaborator_name text,
  ADD COLUMN IF NOT EXISTS collaborator_email text,
  ADD COLUMN IF NOT EXISTS commission_percent numeric NOT NULL DEFAULT 10;

CREATE INDEX IF NOT EXISTS coupons_collaborator_email_idx
  ON public.coupons (lower(collaborator_email));

-- Normalize email
CREATE OR REPLACE FUNCTION public.normalize_coupon_collaborator_email()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.collaborator_email IS NOT NULL THEN
    NEW.collaborator_email := lower(btrim(NEW.collaborator_email));
    IF NEW.collaborator_email = '' THEN
      NEW.collaborator_email := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_coupon_collab_email ON public.coupons;
CREATE TRIGGER trg_normalize_coupon_collab_email
BEFORE INSERT OR UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.normalize_coupon_collaborator_email();

-- 2. Commissions table
CREATE TABLE IF NOT EXISTS public.collaborator_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  coupon_code text NOT NULL,
  collaborator_email text NOT NULL,
  order_amount numeric NOT NULL DEFAULT 0,
  commission_percent numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending | paid
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collaborator_commissions TO authenticated;
GRANT ALL ON public.collaborator_commissions TO service_role;

ALTER TABLE public.collaborator_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage commissions"
ON public.collaborator_commissions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Collaborators view own commissions"
ON public.collaborator_commissions
FOR SELECT TO authenticated
USING (
  collaborator_email = lower((auth.jwt() ->> 'email'))
);

CREATE TRIGGER trg_collab_commissions_updated
BEFORE UPDATE ON public.collaborator_commissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Auto-create commission when an order is created with a collaborator coupon
CREATE OR REPLACE FUNCTION public.create_collaborator_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c RECORD;
  base_amount numeric;
  commission numeric;
BEGIN
  IF NEW.coupon_code IS NULL OR NEW.coupon_code = '' THEN
    RETURN NEW;
  END IF;

  SELECT id, collaborator_email, commission_percent
    INTO c
  FROM public.coupons
  WHERE lower(code) = lower(NEW.coupon_code)
  LIMIT 1;

  IF NOT FOUND OR c.collaborator_email IS NULL THEN
    RETURN NEW;
  END IF;

  base_amount := COALESCE(NEW.final_amount, NEW.total_amount, 0);
  commission := ROUND(base_amount * COALESCE(c.commission_percent, 0) / 100.0, 2);

  INSERT INTO public.collaborator_commissions
    (order_id, coupon_id, coupon_code, collaborator_email, order_amount, commission_percent, commission_amount)
  VALUES
    (NEW.id, c.id, NEW.coupon_code, c.collaborator_email, base_amount, c.commission_percent, commission)
  ON CONFLICT (order_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_collab_commission ON public.orders;
CREATE TRIGGER trg_create_collab_commission
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.create_collaborator_commission();

-- 4. Helper: is current user a collaborator?
CREATE OR REPLACE FUNCTION public.is_collaborator(_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coupons
    WHERE is_active = true
      AND collaborator_email IS NOT NULL
      AND lower(collaborator_email) = lower(_email)
  );
$$;

-- Backfill commissions for existing orders with collaborator coupons
INSERT INTO public.collaborator_commissions
  (order_id, coupon_id, coupon_code, collaborator_email, order_amount, commission_percent, commission_amount)
SELECT o.id, c.id, o.coupon_code, c.collaborator_email,
       COALESCE(o.final_amount, o.total_amount, 0),
       c.commission_percent,
       ROUND(COALESCE(o.final_amount, o.total_amount, 0) * COALESCE(c.commission_percent,0)/100.0, 2)
FROM public.orders o
JOIN public.coupons c ON lower(c.code) = lower(o.coupon_code)
WHERE o.coupon_code IS NOT NULL
  AND c.collaborator_email IS NOT NULL
ON CONFLICT (order_id) DO NOTHING;
