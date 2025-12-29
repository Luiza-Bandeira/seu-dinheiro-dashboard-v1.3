
-- Create recurring_expenses table for recurring expenses
CREATE TABLE public.recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  next_due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create installment_purchases table for installment purchases
CREATE TABLE public.installment_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  total_amount NUMERIC NOT NULL,
  installment_amount NUMERIC NOT NULL,
  total_installments INTEGER NOT NULL,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for recurring_expenses
CREATE POLICY "Users can view own recurring_expenses"
ON public.recurring_expenses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring_expenses"
ON public.recurring_expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring_expenses"
ON public.recurring_expenses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring_expenses"
ON public.recurring_expenses
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for installment_purchases
CREATE POLICY "Users can view own installment_purchases"
ON public.installment_purchases
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own installment_purchases"
ON public.installment_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own installment_purchases"
ON public.installment_purchases
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own installment_purchases"
ON public.installment_purchases
FOR DELETE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_recurring_expenses_updated_at
BEFORE UPDATE ON public.recurring_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_installment_purchases_updated_at
BEFORE UPDATE ON public.installment_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
