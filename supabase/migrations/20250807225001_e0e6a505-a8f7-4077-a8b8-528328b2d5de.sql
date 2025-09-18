-- Primeiro, atualizar os dados existentes para usar os novos tipos
UPDATE financial_categories SET type = 'renda' WHERE type = 'receita';
UPDATE financial_categories SET type = 'despesas' WHERE type = 'despesa';

-- Remover o constraint antigo e adicionar o novo
ALTER TABLE financial_categories 
DROP CONSTRAINT IF EXISTS financial_categories_type_check;

ALTER TABLE financial_categories 
ADD CONSTRAINT financial_categories_type_check 
CHECK (type = ANY (ARRAY['renda'::text, 'impostos'::text, 'despesas'::text]));

-- Inserir categorias padrão de impostos para usuários existentes
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Buscar todos os usuários únicos das tabelas existentes
    FOR user_record IN 
        SELECT DISTINCT user_id FROM contracts 
        UNION 
        SELECT DISTINCT user_id FROM companies
        LIMIT 10  -- Limitar para evitar operações muito grandes
    LOOP
        -- Inserir categorias padrão de impostos se não existirem
        INSERT INTO financial_categories (user_id, name, type, is_active, display_order)
        VALUES 
            (user_record.user_id, 'Imposto de Renda Pessoa Jurídica (IRPJ)', 'impostos', true, 1),
            (user_record.user_id, 'Contribuição Social sobre Lucro Líquido (CSLL)', 'impostos', true, 2),
            (user_record.user_id, 'PIS/PASEP', 'impostos', true, 3),
            (user_record.user_id, 'COFINS', 'impostos', true, 4)
        ON CONFLICT DO NOTHING; -- Evitar duplicatas se já existirem
    END LOOP;
END $$;