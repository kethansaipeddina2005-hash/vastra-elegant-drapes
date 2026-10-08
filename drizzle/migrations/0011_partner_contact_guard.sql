CREATE OR REPLACE FUNCTION public.contains_contact_info(_t text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT COALESCE(_t,'') ~* '(\+?\d[\d\s\-]{8,}\d)|instagram|insta\s*(id|:)|(^|\s)@[a-z0-9_.]{3,}|wa\.me|whatsapp'
$$;

CREATE OR REPLACE FUNCTION public.guard_partner_product_contact()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.partner_id IS NOT NULL AND NOT public.has_role(auth.uid(),'admin')
     AND (public.contains_contact_info(NEW.name) OR public.contains_contact_info(NEW.description)) THEN
    RAISE EXCEPTION 'Phone numbers, Instagram IDs or other contact details are not allowed in product details';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_partner_product_contact BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.guard_partner_product_contact();

CREATE OR REPLACE FUNCTION public.guard_partner_chat_contact()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.sender_type = 'customer' AND public.contains_contact_info(NEW.message)
     AND EXISTS (SELECT 1 FROM conversations c WHERE c.id = NEW.conversation_id AND c.subject LIKE 'Partner:%') THEN
    RAISE EXCEPTION 'Please do not share phone numbers or Instagram IDs in chat';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_partner_chat_contact BEFORE INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.guard_partner_chat_contact();