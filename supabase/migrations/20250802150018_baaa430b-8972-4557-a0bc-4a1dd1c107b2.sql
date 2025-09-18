-- Corrigir a função get_company_costs_by_period
CREATE OR REPLACE FUNCTION get_company_costs_by_period(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    id UUID,
    category TEXT,
    description TEXT,
    monthly_cost NUMERIC,
    cost_type TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.category,
        cc.description,
        cc.monthly_cost,
        cc.cost_type
    FROM company_costs cc
    WHERE cc.user_id = p_user_id 
    AND cc.is_active = true
    AND (
        -- Custo não tem datas específicas (aplica sempre)
        (cc.projection_start_date IS NULL AND cc.projection_end_date IS NULL)
        OR
        -- Custo tem datas e o período solicitado está dentro do range
        (cc.projection_start_date IS NOT NULL AND cc.projection_end_date IS NOT NULL
         AND DATE_TRUNC('month', cc.projection_start_date) <= MAKE_DATE(p_year, p_month, 1)
         AND DATE_TRUNC('month', cc.projection_end_date) >= MAKE_DATE(p_year, p_month, 1))
    );
END;
$$;