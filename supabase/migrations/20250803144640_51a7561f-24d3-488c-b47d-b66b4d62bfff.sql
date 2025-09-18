-- Limpar projeções órfãs (que referenciam custos que não existem mais)
DELETE FROM company_cost_projections 
WHERE company_cost_id NOT IN (
    SELECT id FROM company_costs WHERE is_active = true
);

-- Criar função para limpar projeções órfãs automaticamente quando um custo for deletado
CREATE OR REPLACE FUNCTION cleanup_orphaned_projections()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Se o custo foi desativado ou deletado, remover suas projeções
    IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active = true) THEN
        DELETE FROM company_cost_projections 
        WHERE company_cost_id = COALESCE(OLD.id, NEW.id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar trigger para limpar projeções quando um custo for deletado ou desativado
DROP TRIGGER IF EXISTS trigger_cleanup_orphaned_projections ON company_costs;
CREATE TRIGGER trigger_cleanup_orphaned_projections
    AFTER UPDATE OR DELETE ON company_costs
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_orphaned_projections();

-- Atualizar a função getMonthlyCostSummary para considerar apenas custos ativos
CREATE OR REPLACE FUNCTION get_monthly_cost_summary(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    projected NUMERIC,
    actual NUMERIC,
    variance NUMERIC,
    has_actual_data BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(cp.projected_cost), 0) as projected,
        COALESCE(SUM(cp.actual_cost), 0) as actual,
        COALESCE(SUM(cp.actual_cost), 0) - COALESCE(SUM(cp.projected_cost), 0) as variance,
        COUNT(cp.actual_cost) > 0 as has_actual_data
    FROM company_cost_projections cp
    JOIN company_costs cc ON cp.company_cost_id = cc.id
    WHERE cp.user_id = p_user_id 
    AND cp.year = p_year 
    AND cp.month = p_month
    AND cc.is_active = true; -- Apenas custos ativos
END;
$$;