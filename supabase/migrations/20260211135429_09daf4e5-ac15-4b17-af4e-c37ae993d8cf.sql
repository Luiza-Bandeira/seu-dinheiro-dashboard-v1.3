
-- Create table for investment contribution history
CREATE TABLE public.investment_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investment_id UUID NOT NULL REFERENCES public.investments_current(id) ON DELETE CASCADE,
  investment_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  contributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_contributions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own contributions"
  ON public.investment_contributions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contributions"
  ON public.investment_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contributions"
  ON public.investment_contributions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contributions"
  ON public.investment_contributions FOR DELETE
  USING (auth.uid() = user_id);
