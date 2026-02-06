-- Enable realtime for conversations table so admin gets live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;