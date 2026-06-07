-- Enable realtime for the messages table so new messages appear instantly
alter publication supabase_realtime add table public.messages;
