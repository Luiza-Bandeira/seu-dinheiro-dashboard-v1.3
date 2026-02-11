
-- Add UPDATE policy for investment_withdrawals (was missing)
CREATE POLICY "Users can update own investment_withdrawals"
  ON public.investment_withdrawals FOR UPDATE
  USING (auth.uid() = user_id);
