-- Enable realtime for reduction_goals and finances tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.reduction_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.finances;