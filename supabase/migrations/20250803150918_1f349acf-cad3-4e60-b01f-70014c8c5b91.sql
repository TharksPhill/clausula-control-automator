-- Adicionar campo de vencimento aos custos da empresa
ALTER TABLE company_costs 
ADD COLUMN due_date DATE;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN company_costs.due_date IS 'Data de vencimento do custo (dia do mês em que o custo vence)';

-- Atualizar função para gerar projeções com base em datas específicas e lógica melhorada
CREATE OR REPLACE FUNCTION generate_company_cost_projections_smart(
    p_company_cost_id UUID,
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_update_future_only BOOLEAN DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cost_record company_costs%ROWTYPE;
    v_current_date DATE;
    v_year INTEGER;
    v_month INTEGER;
    v_cutoff_date DATE;
BEGIN
    -- Buscar dados do custo
    SELECT * INTO v_cost_record 
    FROM company_costs 
    WHERE id = p_company_cost_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Custo não encontrado';
    END IF;
    
    -- Se update_future_only for true, só atualizar a partir do mês atual
    IF p_update_future_only THEN
        v_cutoff_date := DATE_TRUNC('month', CURRENT_DATE);
    ELSE
        v_cutoff_date := DATE_TRUNC('month', p_start_date);
    END IF;
    
    -- Gerar projeções para todos os meses no intervalo de datas
    v_current_date := DATE_TRUNC('month', p_start_date);
    
    WHILE v_current_date <= DATE_TRUNC('month', p_end_date) LOOP
        v_year := EXTRACT(year FROM v_current_date);
        v_month := EXTRACT(month FROM v_current_date);
        
        -- Só inserir/atualizar se a data for >= cutoff_date
        IF v_current_date >= v_cutoff_date THEN
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
            WHERE NOT company_cost_projections.is_edited; -- Só atualiza se não foi editado manualmente
        END IF;
        
        -- Avançar para o próximo mês
        v_current_date := v_current_date + INTERVAL '1 month';
    END LOOP;
END;
$$;

-- Função para atualizar projeções apenas para frente (não altera histórico)
CREATE OR REPLACE FUNCTION update_projection_forward_only(
    p_projection_id UUID,
    p_new_cost NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_projection company_cost_projections%ROWTYPE;
    v_current_date DATE;
    v_projection_date DATE;
BEGIN
    -- Buscar a projeção
    SELECT * INTO v_projection
    FROM company_cost_projections
    WHERE id = p_projection_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Projeção não encontrada';
    END IF;
    
    -- Calcular a data da projeção
    v_projection_date := MAKE_DATE(v_projection.year, v_projection.month, 1);
    v_current_date := DATE_TRUNC('month', CURRENT_DATE);
    
    -- Só permitir edição se for do mês atual para frente
    IF v_projection_date < v_current_date THEN
        RAISE EXCEPTION 'Não é possível editar projeções de meses anteriores';
    END IF;
    
    -- Atualizar a projeção
    UPDATE company_cost_projections
    SET 
        projected_cost = p_new_cost,
        notes = p_notes,
        is_edited = true,
        updated_at = now()
    WHERE id = p_projection_id;
    
    -- Atualizar todas as projeções futuras do mesmo custo que não foram editadas manualmente
    UPDATE company_cost_projections
    SET 
        projected_cost = p_new_cost,
        updated_at = now()
    WHERE company_cost_id = v_projection.company_cost_id
    AND year >= v_projection.year
    AND (year > v_projection.year OR month > v_projection.month)
    AND NOT is_edited;
    
END;
$$;

-- Função melhorada para buscar custos por período considerando vencimentos
CREATE OR REPLACE FUNCTION get_company_costs_by_period_with_due_date(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    cost_id UUID,
    category TEXT,
    description TEXT,
    monthly_cost NUMERIC,
    cost_type TEXT,
    due_date DATE,
    is_due_this_month BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id as cost_id,
        cc.category,
        cc.description,
        cc.monthly_cost,
        cc.cost_type,
        cc.due_date,
        CASE 
            WHEN cc.due_date IS NOT NULL THEN
                EXTRACT(day FROM cc.due_date) <= EXTRACT(day FROM MAKE_DATE(p_year, p_month, 1) + INTERVAL '1 month' - INTERVAL '1 day')
            ELSE 
                true
        END as is_due_this_month
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
    )
    ORDER BY cc.due_date NULLS LAST, cc.category, cc.description;
END;
$$;