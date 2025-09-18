-- Adicionar as colunas min_employees e max_employees que estão faltando na tabela cost_plans
ALTER TABLE public.cost_plans 
ADD COLUMN IF NOT EXISTS min_employees integer DEFAULT 0 CHECK (min_employees >= 0);

ALTER TABLE public.cost_plans 
ADD COLUMN IF NOT EXISTS max_employees integer DEFAULT NULL CHECK (max_employees IS NULL OR max_employees >= 0);

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN public.cost_plans.min_employees IS 'Número mínimo de funcionários para este plano de custo';
COMMENT ON COLUMN public.cost_plans.max_employees IS 'Número máximo de funcionários para este plano de custo (NULL = ilimitado)';