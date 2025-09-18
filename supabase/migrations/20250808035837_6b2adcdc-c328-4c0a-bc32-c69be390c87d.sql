-- Corrigir tipos de categorias que estão incorretos
-- Categorias que estão em seções de "Receita" devem ser do tipo "renda"
UPDATE public.financial_categories 
SET type = 'renda'
WHERE section_id IN (
  SELECT id FROM public.financial_sections 
  WHERE revenue_type = true
  AND is_active = true
)
AND type != 'renda';

-- Categorias que estão na seção "Impostos" devem ser do tipo "impostos"
UPDATE public.financial_categories 
SET type = 'impostos'
WHERE section_id IN (
  SELECT id FROM public.financial_sections 
  WHERE name ILIKE '%imposto%'
  AND is_active = true
)
AND type != 'impostos';