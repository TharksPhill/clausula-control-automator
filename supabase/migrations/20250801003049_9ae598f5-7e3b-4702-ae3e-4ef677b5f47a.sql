-- Add projection date columns to company_costs table
ALTER TABLE public.company_costs 
ADD COLUMN projection_start_date DATE,
ADD COLUMN projection_end_date DATE;

-- Add index for better performance on date range queries
CREATE INDEX idx_company_costs_projection_dates ON public.company_costs(projection_start_date, projection_end_date);

-- Update the generate_company_cost_projections function to handle date ranges
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
    v_current_date := p_start_date;
    
    WHILE v_current_date <= p_end_date LOOP
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
        v_current_date := DATE_TRUNC('month', v_current_date);
    END LOOP;
END;
$function$;