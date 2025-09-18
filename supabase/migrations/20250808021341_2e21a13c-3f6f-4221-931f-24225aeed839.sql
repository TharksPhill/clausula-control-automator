-- Adicionar campo operation_type na tabela financial_sections para marcar como operacional ou não operacional
ALTER TABLE public.financial_sections 
ADD COLUMN operation_type text NOT NULL DEFAULT 'operational' CHECK (operation_type IN ('operational', 'non_operational'));

-- Criar tabela para custos financeiros mensais se não existir
CREATE TABLE IF NOT EXISTS public.monthly_financial_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  category_id UUID NOT NULL REFERENCES financial_categories(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  value NUMERIC NOT NULL DEFAULT 0.00,
  is_projection BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, year, month)
);

-- Enable RLS
ALTER TABLE public.monthly_financial_costs ENABLE ROW LEVEL SECURITY;

-- Create policies for monthly_financial_costs
CREATE POLICY "Users can manage their own monthly financial costs" 
ON public.monthly_financial_costs 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monthly_financial_costs_updated_at
BEFORE UPDATE ON public.monthly_financial_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();