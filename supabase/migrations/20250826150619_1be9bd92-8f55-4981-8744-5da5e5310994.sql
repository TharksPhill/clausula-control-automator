-- Adicionar campo de meses de isenção de licença na tabela plans
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS license_exemption_months INTEGER DEFAULT 0;

-- Comentário explicativo
COMMENT ON COLUMN public.plans.license_exemption_months IS 'Número de meses de isenção do custo de licença para este plano';