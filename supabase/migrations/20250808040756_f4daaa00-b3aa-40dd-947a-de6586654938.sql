-- Deletar fisicamente as categorias inativas para evitar cache
DELETE FROM public.financial_categories 
WHERE user_id = 'b014d2fd-b165-4719-938e-3bc01c29fae6' 
AND is_active = false;