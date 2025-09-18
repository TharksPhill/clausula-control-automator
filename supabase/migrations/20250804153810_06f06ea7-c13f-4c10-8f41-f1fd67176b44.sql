-- Função corrigida para atualizar projeções apenas dos meses específicos para frente
CREATE OR REPLACE FUNCTION public.update_projection_forward_only(
    p_projection_id uuid, 
    p_new_cost numeric, 
    p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    
    -- Atualizar a projeção específica
    UPDATE company_cost_projections
    SET 
        projected_cost = p_new_cost,
        notes = p_notes,
        is_edited = true,
        updated_at = now()
    WHERE id = p_projection_id;
    
    -- Atualizar apenas as projeções futuras que são posteriores ao mês/ano específico
    -- e que não foram editadas manualmente
    UPDATE company_cost_projections
    SET 
        projected_cost = p_new_cost,
        updated_at = now()
    WHERE company_cost_id = v_projection.company_cost_id
    AND (
        year > v_projection.year OR 
        (year = v_projection.year AND month > v_projection.month)
    )
    AND NOT is_edited;
    
END;
$function$;