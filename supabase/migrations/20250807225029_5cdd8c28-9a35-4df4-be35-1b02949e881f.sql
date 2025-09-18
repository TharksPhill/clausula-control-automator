-- Remover o constraint que está causando problemas
ALTER TABLE financial_categories DROP CONSTRAINT IF EXISTS financial_categories_type_check;