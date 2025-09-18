-- Criar tabela para configurações de boleto
CREATE TABLE public.bank_slip_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institution_name TEXT NOT NULL,
  slip_value NUMERIC NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para custos de boleto por contrato
CREATE TABLE public.contract_bank_slip_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contract_id UUID NOT NULL,
  bank_slip_config_id UUID NOT NULL,
  monthly_cost NUMERIC NOT NULL DEFAULT 0.00,
  billing_start_month INTEGER NOT NULL DEFAULT 2, -- Segundo mês sempre
  is_recurring BOOLEAN NOT NULL DEFAULT false, -- True para mensal, false para anual/semestral
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (bank_slip_config_id) REFERENCES public.bank_slip_configurations(id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE public.bank_slip_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_bank_slip_costs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para bank_slip_configurations
CREATE POLICY "Users can manage their own bank slip configurations" 
ON public.bank_slip_configurations 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para contract_bank_slip_costs
CREATE POLICY "Users can manage their own contract bank slip costs" 
ON public.contract_bank_slip_costs 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_bank_slip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bank_slip_configurations_updated_at
  BEFORE UPDATE ON public.bank_slip_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_slip_updated_at();

CREATE TRIGGER update_contract_bank_slip_costs_updated_at
  BEFORE UPDATE ON public.contract_bank_slip_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_slip_updated_at();