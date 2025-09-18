-- Criar apenas a nova função, já que as colunas já existem
CREATE OR REPLACE FUNCTION public.generate_company_cost_projections_with_dates(
    p_company_cost_id uuid, 
    p_user_id uuid, 
    p_start_date date, 
    p_end_date date
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_cost_record company_costs%ROWTYPE;
    v_current_date DATE;
    v_year INTEGER;
    v_month INTEGER;
BEGIN
    -- Buscar dados do custo
    SELECT * INTO v_cost_record 
    FROM company_costs 
    WHERE id = p_company_cost_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Custo não encontrado';
    END IF;
    
    -- Gerar projeções para todos os meses no intervalo de datas
    v_current_date := DATE_TRUNC('month', p_start_date);
    
    WHILE v_current_date <= DATE_TRUNC('month', p_end_date) LOOP
        v_year := EXTRACT(year FROM v_current_date);
        v_month := EXTRACT(month FROM v_current_date);
        
        INSERT INTO company_cost_projections (
            user_id,
            company_cost_id,
            year,
            month,
            projected_cost
        ) VALUES (
            p_user_id,
            p_company_cost_id,
            v_year,
            v_month,
            v_cost_record.monthly_cost
        ) ON CONFLICT (company_cost_id, year, month) 
        DO UPDATE SET 
            projected_cost = EXCLUDED.projected_cost,
            updated_at = now()
        WHERE NOT company_cost_projections.is_edited;
        
        -- Avançar para o próximo mês
        v_current_date := v_current_date + INTERVAL '1 month';
    END LOOP;
END;
$function$;

-- Função para buscar custos por período
CREATE OR REPLACE FUNCTION public.get_company_costs_by_period(
    p_user_id uuid,
    p_year integer,
    p_month integer
) RETURNS TABLE(
    cost_id uuid,
    cost_name text,
    cost_description text,
    monthly_cost numeric,
    category text
) LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.name,
        cc.description,
        cc.monthly_cost,
        cc.category
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
$function$;