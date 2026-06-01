ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS batch_number integer,
  ADD COLUMN IF NOT EXISTS product_code text;

CREATE UNIQUE INDEX IF NOT EXISTS products_product_code_uidx
  ON public.products (product_code) WHERE product_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.assign_product_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_seq int;
  candidate text;
BEGIN
  IF NEW.batch_number IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.product_code IS NOT NULL AND NEW.product_code <> '' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(
    MAX(NULLIF(split_part(product_code, '-', 2), '')::int),
    0
  ) + 1
  INTO next_seq
  FROM public.products
  WHERE batch_number = NEW.batch_number
    AND product_code LIKE 'B' || NEW.batch_number || '-%';

  candidate := 'B' || NEW.batch_number || '-' || next_seq;

  WHILE EXISTS (SELECT 1 FROM public.products WHERE product_code = candidate) LOOP
    next_seq := next_seq + 1;
    candidate := 'B' || NEW.batch_number || '-' || next_seq;
  END LOOP;

  NEW.product_code := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_product_code ON public.products;
CREATE TRIGGER trg_assign_product_code
BEFORE INSERT OR UPDATE OF batch_number ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.assign_product_code();
