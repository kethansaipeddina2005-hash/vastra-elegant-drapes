CREATE OR REPLACE FUNCTION public.is_product_chat_partner(_conversation_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.conversations c JOIN public.products p ON p.id=c.product_id JOIN public.partner_applications a ON a.id=p.partner_id WHERE c.id=_conversation_id AND c.customer_id<>auth.uid() AND a.status='approved' AND lower(a.email)=lower(auth.jwt()->>'email'));
$$;
REVOKE ALL ON FUNCTION public.is_product_chat_partner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_product_chat_partner(uuid) TO authenticated;
ALTER TABLE public.chat_messages DROP CONSTRAINT chat_messages_sender_type_check;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_sender_type_check CHECK(sender_type IN ('customer','admin','partner'));
GRANT SELECT,INSERT,UPDATE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
CREATE POLICY "Owning partners read product messages" ON public.chat_messages FOR SELECT TO authenticated USING(public.is_product_chat_partner(conversation_id));
CREATE POLICY "Owning partners send product replies" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK(public.is_product_chat_partner(conversation_id) AND sender_id=auth.uid() AND sender_type='partner');
CREATE POLICY "Enforce chat sender identity" ON public.chat_messages AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(sender_id=auth.uid() AND ((sender_type='admin' AND public.has_role(auth.uid(),'admin')) OR (sender_type='partner' AND public.is_product_chat_partner(conversation_id)) OR (sender_type='customer' AND EXISTS(SELECT 1 FROM public.conversations c WHERE c.id=conversation_id AND c.customer_id=auth.uid()))));
CREATE OR REPLACE FUNCTION public.partner_chat_inbox() RETURNS TABLE(id uuid,customer_name text,product_id integer,product_name text,product_code text,product_image text,subject text,status text,updated_at timestamptz,last_message text,unread_count bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT c.id,CASE WHEN c.customer_name LIKE '%@%' THEN 'Customer' ELSE COALESCE(c.customer_name,'Customer') END,c.product_id,p.name,p.product_code,p.images[1],c.subject,c.status,c.updated_at,(SELECT m.message FROM public.chat_messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1),(SELECT count(*) FROM public.chat_messages m WHERE m.conversation_id=c.id AND m.sender_type='customer' AND NOT COALESCE(m.is_read,false)) FROM public.conversations c JOIN public.products p ON p.id=c.product_id WHERE public.is_product_chat_partner(c.id) ORDER BY c.updated_at DESC;
$$;
REVOKE ALL ON FUNCTION public.partner_chat_inbox() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.partner_chat_inbox() TO authenticated;
CREATE OR REPLACE FUNCTION public.mark_product_chat_read(_conversation_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF public.has_role(auth.uid(),'admin') OR public.is_product_chat_partner(_conversation_id) THEN
 UPDATE public.chat_messages SET is_read=true WHERE conversation_id=_conversation_id AND sender_type='customer' AND is_read=false;
 ELSIF EXISTS(SELECT 1 FROM public.conversations WHERE id=_conversation_id AND customer_id=auth.uid()) THEN
 UPDATE public.chat_messages SET is_read=true WHERE conversation_id=_conversation_id AND sender_type IN ('admin','partner') AND is_read=false;
 ELSE RAISE EXCEPTION 'Conversation access denied'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.mark_product_chat_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_product_chat_read(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_partner_chat_contact() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.sender_type<>'admin' AND public.contains_contact_info(NEW.message) AND (NEW.sender_type='partner' OR EXISTS(SELECT 1 FROM public.conversations c JOIN public.products p ON p.id=c.product_id WHERE c.id=NEW.conversation_id AND p.partner_id IS NOT NULL)) THEN RAISE EXCEPTION 'Please do not share phone numbers or Instagram IDs in chat'; END IF;
 IF TG_OP='UPDATE' AND NOT public.has_role(auth.uid(),'admin') AND (NEW.conversation_id IS DISTINCT FROM OLD.conversation_id OR NEW.sender_id IS DISTINCT FROM OLD.sender_id OR NEW.sender_type IS DISTINCT FROM OLD.sender_type OR NEW.message IS DISTINCT FROM OLD.message OR NEW.images IS DISTINCT FROM OLD.images) THEN RAISE EXCEPTION 'Chat messages cannot be changed'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_product_chat_updates BEFORE UPDATE ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.guard_partner_chat_contact();
CREATE OR REPLACE FUNCTION public.touch_product_chat() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN UPDATE public.conversations SET updated_at=now() WHERE id=NEW.conversation_id; RETURN NEW; END $$;
CREATE TRIGGER touch_product_chat_after_message AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.touch_product_chat();
CREATE OR REPLACE FUNCTION public.guard_partner_conversation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE partner uuid;
BEGIN
 IF TG_OP='UPDATE' AND NOT public.has_role(auth.uid(),'admin') THEN
 IF NEW.customer_id IS DISTINCT FROM OLD.customer_id OR NEW.product_id IS DISTINCT FROM OLD.product_id THEN RAISE EXCEPTION 'Conversation participants and product cannot be changed'; END IF;
 RETURN NEW;
 END IF;
 partner:=public.partner_application_id(auth.jwt()->>'email');
 IF partner IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
 IF NEW.customer_id IS DISTINCT FROM auth.uid() OR NOT EXISTS(SELECT 1 FROM public.products WHERE id=NEW.product_id AND partner_id=partner) THEN RAISE EXCEPTION 'Select one of your products for this query'; END IF;
 SELECT 'Partner: '||brand_name||' — product query' INTO NEW.subject FROM public.partner_applications WHERE id=partner;
 END IF;
 RETURN NEW;
END $$;
CREATE POLICY "Product chat participants read attachments" ON storage.objects FOR SELECT TO authenticated USING(bucket_id='chat-images' AND EXISTS(SELECT 1 FROM public.chat_messages m WHERE objects.name=ANY(m.images) AND public.is_product_chat_partner(m.conversation_id)));
CREATE POLICY "Customers read product reply attachments" ON storage.objects FOR SELECT TO authenticated USING(bucket_id='chat-images' AND EXISTS(SELECT 1 FROM public.chat_messages m JOIN public.conversations c ON c.id=m.conversation_id WHERE c.customer_id=auth.uid() AND objects.name=ANY(m.images)));
CREATE INDEX IF NOT EXISTS conversations_product_chat_idx ON public.conversations(product_id,updated_at DESC);