
-- Adicionar campo de valor de venda mensal aos planos de custo
ALTER TABLE public.cost_plans 
ADD COLUMN projected_plan_value numeric DEFAULT 0.00;

-- Comentário explicativo para o campo
COMMENT ON COLUMN public.cost_plans.projected_plan_value IS 'Valor de venda mensal do plano para o cliente (receita por contrato)';
