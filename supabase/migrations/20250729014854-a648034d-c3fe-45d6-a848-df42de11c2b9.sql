-- Adicionar campos para suporte a custos mensais na tabela company_costs
ALTER TABLE public.company_costs 
ADD COLUMN is_recurring boolean DEFAULT false,
ADD COLUMN recurrence_type text DEFAULT 'monthly',
ADD COLUMN recurrence_months integer[] DEFAULT NULL,
ADD COLUMN start_date date DEFAULT NULL,
ADD COLUMN end_date date DEFAULT NULL;

-- Criar tabela para projeções mensais dos custos
CREATE TABLE public.company_cost_projections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_cost_id UUID NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    projected_cost numeric NOT NULL DEFAULT 0.00,
    actual_cost numeric DEFAULT NULL,
    is_edited boolean DEFAULT false,
    notes text DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT company_cost_projections_month_check CHECK (month >= 1 AND month <= 12),
    CONSTRAINT company_cost_projections_year_check CHECK (year >= 2020 AND year <= 2050),
    UNIQUE(company_cost_id, year, month)
);

-- Enable RLS
ALTER TABLE public.company_cost_projections ENABLE ROW LEVEL SECURITY;

-- Create policies for company_cost_projections
CREATE POLICY "Users can manage their own cost projections" 
ON public.company_cost_projections 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_cost_projections_updated_at
BEFORE UPDATE ON public.company_cost_projections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar projeções automáticas
CREATE OR REPLACE FUNCTION public.generate_company_cost_projections(
    p_company_cost_id UUID,
    p_user_id UUID,
    p_start_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    p_end_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 1,
    p_months INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cost_record company_costs%ROWTYPE;
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
    
    -- Gerar projeções para os anos e meses especificados
    FOR v_year IN p_start_year..p_end_year LOOP
        FOREACH v_month IN ARRAY p_months LOOP
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
        END LOOP;
    END LOOP;
END;
$$;