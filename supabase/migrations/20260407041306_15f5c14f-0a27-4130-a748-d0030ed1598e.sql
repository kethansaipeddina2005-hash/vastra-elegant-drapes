
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can view all contact messages" ON public.contact_messages
  FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contact messages" ON public.contact_messages
  FOR UPDATE TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contact messages" ON public.contact_messages
  FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));
