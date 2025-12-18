-- Add last_login_at and commercial data fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS produto_adquirido text,
ADD COLUMN IF NOT EXISTS data_inicio date,
ADD COLUMN IF NOT EXISTS data_fim_vigencia date,
ADD COLUMN IF NOT EXISTS valor_pago numeric;

-- Add 'aluno' to app_role enum if it doesn't exist
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aluno';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;