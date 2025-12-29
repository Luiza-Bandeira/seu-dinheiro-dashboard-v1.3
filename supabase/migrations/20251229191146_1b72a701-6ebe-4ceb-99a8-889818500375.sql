-- Adicionar campos para rastreamento de origem dos lançamentos
-- Isso permite identificar e excluir lançamentos relacionados a recorrentes/parcelas

ALTER TABLE public.finances 
ADD COLUMN source_type TEXT DEFAULT NULL,
ADD COLUMN source_id UUID DEFAULT NULL;

-- Criar índice para melhorar performance de buscas por origem
CREATE INDEX idx_finances_source ON public.finances(source_type, source_id) WHERE source_id IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.finances.source_type IS 'Tipo de origem: single, recurring, installment';
COMMENT ON COLUMN public.finances.source_id IS 'ID da tabela de origem (recurring_expenses ou installment_purchases)';