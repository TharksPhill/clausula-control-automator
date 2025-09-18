-- Limpar categorias financeiras órfãs que não têm seções correspondentes ativas
-- Primeiro, verificar quais categorias têm section_id mas as seções não existem ou estão inativas
UPDATE public.financial_categories 
SET is_active = false
WHERE section_id IS NOT NULL 
AND section_id NOT IN (
  SELECT id FROM public.financial_sections 
  WHERE is_active = true
);

-- Também limpar categorias que têm section_id NULL (categorias sem seção definida)
-- mas que não são categorias globais padrão do sistema
UPDATE public.financial_categories 
SET is_active = false
WHERE section_id IS NULL 
AND user_id = 'b014d2fd-b165-4719-938e-3bc01c29fae6'
AND name IN ('Água', 'Aluguel', 'Contabilidade', 'dc', 'Simples Nacional', 'Venda de Produto', 'Venda de Serviços');

-- Limpar custos mensais órfãos que referenciam categorias inativas
DELETE FROM public.monthly_financial_costs 
WHERE category_id IN (
  SELECT id FROM public.financial_categories 
  WHERE is_active = false
);