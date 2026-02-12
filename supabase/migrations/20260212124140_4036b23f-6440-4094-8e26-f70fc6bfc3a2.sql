
-- Create patrimony_assets table for user physical assets (house, car, etc.)
CREATE TABLE public.patrimony_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  acquisition_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patrimony_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own patrimony_assets" ON public.patrimony_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patrimony_assets" ON public.patrimony_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patrimony_assets" ON public.patrimony_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patrimony_assets" ON public.patrimony_assets FOR DELETE USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_patrimony_assets_updated_at
BEFORE UPDATE ON public.patrimony_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
