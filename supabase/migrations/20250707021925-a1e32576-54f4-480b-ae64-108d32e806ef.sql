-- Criar tabela para custos de funcionários
CREATE TABLE public.employee_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  salary NUMERIC(10,2) NOT NULL,
  benefits NUMERIC(10,2) DEFAULT 0.00,
  taxes NUMERIC(10,2) DEFAULT 0.00,
  total_cost NUMERIC(10,2) GENERATED ALWAYS AS (salary + benefits + taxes) STORED,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para custos da empresa
CREATE TABLE public.company_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL, -- 'infrastructure', 'software', 'tax', 'marketing', 'other'
  description TEXT NOT NULL,
  monthly_cost NUMERIC(10,2) NOT NULL,
  cost_type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed' ou 'variable'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para margens de contratos
CREATE TABLE public.contract_profit_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  user_id UUID NOT NULL,
  license_cost NUMERIC(10,2) DEFAULT 0.00, -- Custo da licença para revenda
  allocated_employee_costs NUMERIC(10,2) DEFAULT 0.00, -- Custos de funcionários alocados
  allocated_company_costs NUMERIC(10,2) DEFAULT 0.00, -- Custos da empresa alocados
  total_costs NUMERIC(10,2) GENERATED ALWAYS AS (license_cost + allocated_employee_costs + allocated_company_costs) STORED,
  contract_value NUMERIC(10,2) NOT NULL, -- Valor do contrato
  gross_profit NUMERIC(10,2) GENERATED ALWAYS AS (contract_value - (license_cost + allocated_employee_costs + allocated_company_costs)) STORED,
  profit_margin NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN contract_value > 0 THEN ((contract_value - (license_cost + allocated_employee_costs + allocated_company_costs)) / contract_value) * 100
      ELSE 0
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.employee_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_profit_analysis ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para employee_costs
CREATE POLICY "Users can manage their own employee costs"
ON public.employee_costs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar políticas RLS para company_costs
CREATE POLICY "Users can manage their own company costs"
ON public.company_costs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar políticas RLS para contract_profit_analysis
CREATE POLICY "Users can manage their own contract profit analysis"
ON public.contract_profit_analysis
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_costs_updated_at
  BEFORE UPDATE ON public.employee_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_costs_updated_at
  BEFORE UPDATE ON public.company_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_profit_analysis_updated_at
  BEFORE UPDATE ON public.contract_profit_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar foreign key para contratos
ALTER TABLE public.contract_profit_analysis 
ADD CONSTRAINT fk_contract_profit_analysis_contract 
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;