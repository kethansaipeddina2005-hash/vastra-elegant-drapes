GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_collaborator(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_review_product(uuid, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_order(uuid, uuid) TO anon, authenticated;