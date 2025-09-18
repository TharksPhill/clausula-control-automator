-- Limpar dados órfãos e duplicados das tabelas financeiras

-- 1. Remover custos mensais órfãos (que não têm categoria correspondente)
DELETE FROM public.monthly_financial_costs 
WHERE category_id NOT IN (
  SELECT id FROM public.financial_categories WHERE is_active = true
);

-- 2. Remover categorias órfãs (que não têm seção correspondente)
DELETE FROM public.financial_categories 
WHERE section_id IS NOT NULL 
AND section_id NOT IN (
  SELECT id FROM public.financial_sections WHERE is_active = true
);

-- 3. Marcar como inativas seções duplicadas (manter apenas a mais recente de cada nome por usuário)
UPDATE public.financial_sections 
SET is_active = false 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, name) id 
  FROM public.financial_sections 
  WHERE is_active = true 
  ORDER BY user_id, name, created_at DESC
);

-- 4. Marcar como inativas categorias duplicadas (manter apenas a mais recente de cada nome por usuário)
UPDATE public.financial_categories 
SET is_active = false 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, name, type) id 
  FROM public.financial_categories 
  WHERE is_active = true 
  ORDER BY user_id, name, type, created_at DESC
);

-- 5. Remover custos mensais de categorias inativas
DELETE FROM public.monthly_financial_costs 
WHERE category_id IN (
  SELECT id FROM public.financial_categories WHERE is_active = false
);