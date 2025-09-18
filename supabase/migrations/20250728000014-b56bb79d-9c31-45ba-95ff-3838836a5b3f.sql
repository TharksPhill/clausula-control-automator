-- Corrigir análise de lucro para considerar apenas produtos ativos
-- Primeiro, remover análises de produtos inativos
DELETE FROM product_profit_analysis 
WHERE product_id IN (
    SELECT id FROM products WHERE is_active = false
);

-- Atualizar função para remover análise quando produto for desativado
CREATE OR REPLACE FUNCTION public.remove_product_profit_analysis()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Se o produto foi desativado, remove a análise
    IF OLD.is_active = true AND NEW.is_active = false THEN
        DELETE FROM product_profit_analysis WHERE product_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Criar trigger para remover análise quando produto for desativado
DROP TRIGGER IF EXISTS remove_product_analysis_on_deactivate ON products;
CREATE TRIGGER remove_product_analysis_on_deactivate
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION remove_product_profit_analysis();

-- Atualizar função de recálculo para considerar apenas produtos ativos
CREATE OR REPLACE FUNCTION public.recalculate_product_profit_analysis()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    product_record products;
BEGIN
    -- Limpar análises de produtos inativos primeiro
    DELETE FROM product_profit_analysis 
    WHERE product_id IN (
        SELECT id FROM products WHERE is_active = false
    );
    
    -- Recalcular apenas para produtos ativos
    FOR product_record IN 
        SELECT * FROM products WHERE is_active = true
    LOOP
        PERFORM update_product_profit_analysis_manual(product_record);
    END LOOP;
END;
$function$;

-- Executar limpeza e recálculo
SELECT recalculate_product_profit_analysis();