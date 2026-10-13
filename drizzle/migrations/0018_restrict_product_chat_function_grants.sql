REVOKE ALL ON FUNCTION public.partner_chat_inbox() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.is_product_chat_partner(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.mark_product_chat_read(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.touch_product_chat() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.partner_chat_inbox(),public.is_product_chat_partner(uuid),public.mark_product_chat_read(uuid) TO authenticated;