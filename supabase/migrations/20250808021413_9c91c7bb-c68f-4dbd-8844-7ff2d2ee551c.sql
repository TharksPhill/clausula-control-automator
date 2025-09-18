-- Adicionar campo operation_type na tabela financial_sections para marcar como operacional ou não operacional
ALTER TABLE public.financial_sections 
ADD COLUMN operation_type text NOT NULL DEFAULT 'operational' CHECK (operation_type IN ('operational', 'non_operational'));