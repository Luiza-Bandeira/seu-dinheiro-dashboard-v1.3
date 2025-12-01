-- Criar tabela de dívidas a pagar
CREATE TABLE public.debts_payable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  creditor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de dívidas a receber
CREATE TABLE public.debts_receivable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  debtor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para debts_payable
ALTER TABLE public.debts_payable ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para debts_payable
CREATE POLICY "Users can view own debts_payable"
ON public.debts_payable
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debts_payable"
ON public.debts_payable
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts_payable"
ON public.debts_payable
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts_payable"
ON public.debts_payable
FOR DELETE
USING (auth.uid() = user_id);

-- Habilitar RLS para debts_receivable
ALTER TABLE public.debts_receivable ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para debts_receivable
CREATE POLICY "Users can view own debts_receivable"
ON public.debts_receivable
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debts_receivable"
ON public.debts_receivable
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts_receivable"
ON public.debts_receivable
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts_receivable"
ON public.debts_receivable
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at em debts_payable
CREATE TRIGGER update_debts_payable_updated_at
BEFORE UPDATE ON public.debts_payable
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em debts_receivable
CREATE TRIGGER update_debts_receivable_updated_at
BEFORE UPDATE ON public.debts_receivable
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();