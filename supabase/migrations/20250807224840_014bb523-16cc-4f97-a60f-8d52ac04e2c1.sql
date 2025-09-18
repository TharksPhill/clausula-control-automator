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
            (user_record.user_id, 'COFINS', 'impostos', true, 4),
            (user_record.user_id, 'ICMS', 'impostos', true, 5),
            (user_record.user_id, 'ISS', 'impostos', true, 6),
            (user_record.user_id, 'IPI', 'impostos', true, 7),
            (user_record.user_id, 'IOF', 'impostos', true, 8)
        ON CONFLICT DO NOTHING; -- Evitar duplicatas se já existirem
        
        -- Inserir categorias padrão de renda se não existirem
        INSERT INTO financial_categories (user_id, name, type, is_active, display_order)
        VALUES 
            (user_record.user_id, 'Receita de Vendas', 'renda', true, 1),
            (user_record.user_id, 'Receita de Serviços', 'renda', true, 2),
            (user_record.user_id, 'Receita Financeira', 'renda', true, 3),
            (user_record.user_id, 'Outras Receitas', 'renda', true, 4)
        ON CONFLICT DO NOTHING;
        
        -- Inserir categorias padrão de despesas se não existirem
        INSERT INTO financial_categories (user_id, name, type, is_active, display_order)
        VALUES 
            (user_record.user_id, 'Salários e Encargos', 'despesas', true, 1),
            (user_record.user_id, 'Aluguel', 'despesas', true, 2),
            (user_record.user_id, 'Energia Elétrica', 'despesas', true, 3),
            (user_record.user_id, 'Telefone/Internet', 'despesas', true, 4),
            (user_record.user_id, 'Material de Escritório', 'despesas', true, 5),
            (user_record.user_id, 'Combustível', 'despesas', true, 6),
            (user_record.user_id, 'Manutenção', 'despesas', true, 7),
            (user_record.user_id, 'Marketing', 'despesas', true, 8)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;