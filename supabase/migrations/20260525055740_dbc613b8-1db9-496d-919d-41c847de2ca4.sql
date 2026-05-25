
CREATE OR REPLACE FUNCTION public.normalize_subscription_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.email := lower(btrim(NEW.email));
  NEW.is_active := true;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_contact_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
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

REVOKE EXECUTE ON FUNCTION public.normalize_subscription_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_contact_message_insert() FROM PUBLIC, anon, authenticated;
