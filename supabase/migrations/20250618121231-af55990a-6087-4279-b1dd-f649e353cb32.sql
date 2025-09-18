
-- Remover a restrição de chave estrangeira que está causando o problema
ALTER TABLE public.administrators DROP CONSTRAINT IF EXISTS administrators_created_by_fkey;

-- A coluna created_by ainda existirá, mas não terá mais a restrição de chave estrangeira
-- Isso permite criar o primeiro administrador com created_by = NULL
-- E administradores subsequentes podem ter created_by definido como o ID de outro admin
