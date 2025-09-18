
-- Adicionar coluna tax_percentage à tabela company_costs
ALTER TABLE public.company_costs 
ADD COLUMN tax_percentage numeric DEFAULT NULL;

-- Comentário para a nova coluna
COMMENT ON COLUMN public.company_costs.tax_percentage IS 'Percentual do imposto aplicado sobre o faturamento (apenas para categoria tax)';
