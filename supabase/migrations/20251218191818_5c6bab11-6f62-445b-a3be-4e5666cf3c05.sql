-- Tabela para histórico de resgates de investimentos
CREATE TABLE public.investment_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investment_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  withdrawn_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.investment_withdrawals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own investment_withdrawals"
ON public.investment_withdrawals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investment_withdrawals"
ON public.investment_withdrawals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment_withdrawals"
ON public.investment_withdrawals
FOR DELETE
USING (auth.uid() = user_id);