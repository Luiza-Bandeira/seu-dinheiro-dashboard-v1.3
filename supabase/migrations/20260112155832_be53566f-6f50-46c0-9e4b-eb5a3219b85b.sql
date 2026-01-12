-- Habilitar realtime para tabelas de metas e dívidas
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debts_payable;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debts_receivable;