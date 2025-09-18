
-- Adicionar campo de projeção de quantidade aos planos de custo
ALTER TABLE public.cost_plans 
ADD COLUMN projected_quantity integer DEFAULT 0;

-- Comentário explicativo para o campo
COMMENT ON COLUMN public.cost_plans.projected_quantity IS 'Quantidade projetada de contratos para este plano de custo';
