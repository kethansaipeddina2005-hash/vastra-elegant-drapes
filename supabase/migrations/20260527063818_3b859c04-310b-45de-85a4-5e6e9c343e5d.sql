
-- Add order_number column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text UNIQUE;

-- Function to generate order number ORD-YYYYMMDD-NNNN (daily sequence)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  day_str text;
  next_seq int;
  candidate text;
BEGIN
  IF NEW.order_number IS NOT NULL AND NEW.order_number <> '' THEN
    RETURN NEW;
  END IF;

  day_str := to_char(COALESCE(NEW.created_at, now()) AT TIME ZONE 'UTC', 'YYYYMMDD');

  SELECT COALESCE(MAX(CAST(split_part(order_number, '-', 3) AS int)), 0) + 1
    INTO next_seq
  FROM public.orders
  WHERE order_number LIKE 'ORD-' || day_str || '-%';

  candidate := 'ORD-' || day_str || '-' || lpad(next_seq::text, 4, '0');

  -- Defensive uniqueness loop in case of race
  WHILE EXISTS (SELECT 1 FROM public.orders WHERE order_number = candidate) LOOP
    next_seq := next_seq + 1;
    candidate := 'ORD-' || day_str || '-' || lpad(next_seq::text, 4, '0');
  END LOOP;

  NEW.order_number := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_order_number();

-- Backfill existing orders without an order_number
DO $$
DECLARE
  r record;
  day_str text;
  next_seq int;
  candidate text;
BEGIN
  FOR r IN
    SELECT id, created_at
    FROM public.orders
    WHERE order_number IS NULL
    ORDER BY created_at ASC
  LOOP
    day_str := to_char(COALESCE(r.created_at, now()) AT TIME ZONE 'UTC', 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(split_part(order_number, '-', 3) AS int)), 0) + 1
      INTO next_seq
    FROM public.orders
    WHERE order_number LIKE 'ORD-' || day_str || '-%';
    candidate := 'ORD-' || day_str || '-' || lpad(next_seq::text, 4, '0');
    UPDATE public.orders SET order_number = candidate WHERE id = r.id;
  END LOOP;
END $$;
