CREATE TABLE public.popup_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  link_label TEXT,
  delay_seconds INTEGER NOT NULL DEFAULT 3,
  auto_close_seconds INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.popup_ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.popup_ads TO authenticated;
GRANT ALL ON public.popup_ads TO service_role;

ALTER TABLE public.popup_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active popup ads"
ON public.popup_ads FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all popup ads"
ON public.popup_ads FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert popup ads"
ON public.popup_ads FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update popup ads"
ON public.popup_ads FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete popup ads"
ON public.popup_ads FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_popup_ads_updated_at
BEFORE UPDATE ON public.popup_ads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();