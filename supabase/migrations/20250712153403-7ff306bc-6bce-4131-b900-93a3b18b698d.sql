
-- Adicionar a coluna max_cnpjs que está faltando na tabela cost_plans
ALTER TABLE public.cost_plans 
ADD COLUMN IF NOT EXISTS max_cnpjs integer;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN public.cost_plans.max_cnpjs IS 'Número máximo de CNPJs permitidos para este plano de custo';
