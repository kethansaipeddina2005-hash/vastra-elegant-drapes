
-- Replace overly-broad public INSERT policies with role-scoped policies (anon + authenticated only)
-- and add validation triggers to prevent abuse without exposing any existing data.

-- ============ subscriptions ============
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscriptions;

CREATE POLICY "Public can subscribe to newsletter"
ON public.subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 5 AND 255
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- ============ contact_messages ============
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;

CREATE POLICY "Public can submit contact messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL AND length(btrim(name)) BETWEEN 1 AND 100
  AND email IS NOT NULL
    AND length(email) BETWEEN 5 AND 255
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND subject IS NOT NULL AND length(btrim(subject)) BETWEEN 1 AND 200
  AND message IS NOT NULL AND length(btrim(message)) BETWEEN 1 AND 2000
);

-- Normalization trigger: force is_active=true on new subscriptions and lowercase email
CREATE OR REPLACE FUNCTION public.normalize_subscription_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email := lower(btrim(NEW.email));
  NEW.is_active := true;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_subscription_insert_trg ON public.subscriptions;
CREATE TRIGGER normalize_subscription_insert_trg
BEFORE INSERT ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.normalize_subscription_insert();

-- Normalization trigger: force is_read=false on new contact messages and trim fields
CREATE OR REPLACE FUNCTION public.normalize_contact_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email := lower(btrim(NEW.email));
  NEW.name := btrim(NEW.name);
  NEW.subject := btrim(NEW.subject);
  NEW.message := btrim(NEW.message);
  NEW.is_read := false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_contact_message_insert_trg ON public.contact_messages;
CREATE TRIGGER normalize_contact_message_insert_trg
BEFORE INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.normalize_contact_message_insert();
