-- Adicionar campo de funcionalidades para planos
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';

-- Adicionar campo de funcionalidades para adicionais
ALTER TABLE plan_addons ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';