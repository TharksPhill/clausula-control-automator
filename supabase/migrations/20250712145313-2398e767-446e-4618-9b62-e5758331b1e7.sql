
-- Criar tabela para planos de custo
CREATE TABLE IF NOT EXISTS public.cost_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_license_cost NUMERIC NOT NULL DEFAULT 0.00,
  billing_type TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_type IN ('monthly', 'semiannual', 'annual')),
  early_payment_discount_percentage NUMERIC DEFAULT 0.00 CHECK (early_payment_discount_percentage >= 0 AND early_payment_discount_percentage <= 100),
  exemption_period_months INTEGER DEFAULT 0 CHECK (exemption_period_months >= 0),
  min_employees INTEGER DEFAULT 0 CHECK (min_employees >= 0),
  max_employees INTEGER DEFAULT NULL CHECK (max_employees IS NULL OR max_employees >= 0),
  max_cnpjs INTEGER DEFAULT NULL CHECK (max_cnpjs IS NULL OR max_cnpjs >= 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para configurações de custos por contrato
CREATE TABLE IF NOT EXISTS public.contract_cost_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contract_id UUID NOT NULL,
  cost_plan_id UUID NOT NULL,
  tax_percentage NUMERIC DEFAULT 0.00 CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
  labor_cost_percentage NUMERIC DEFAULT 0.00 CHECK (labor_cost_percentage >= 0 AND labor_cost_percentage <= 100),
  fixed_cost_percentage NUMERIC DEFAULT 0.00 CHECK (fixed_cost_percentage >= 0 AND fixed_cost_percentage <= 100),
  client_trial_period_days INTEGER DEFAULT 0 CHECK (client_trial_period_days >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contract_id)
);

-- Tabela para histórico de mudanças de custos
CREATE TABLE IF NOT EXISTS public.cost_plan_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cost_plan_id UUID NOT NULL,
  contract_id UUID,
  changed_by_user_id UUID NOT NULL,
  previous_cost NUMERIC,
  new_cost NUMERIC NOT NULL,
  change_reason TEXT,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS policies
ALTER TABLE public.cost_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_cost_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_plan_changes ENABLE ROW LEVEL SECURITY;

-- Policies para cost_plans
CREATE POLICY "Users can manage their own cost plans" 
ON public.cost_plans 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Policies para contract_cost_configurations
CREATE POLICY "Users can manage their own contract cost configurations" 
ON public.contract_cost_configurations 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Policies para cost_plan_changes
CREATE POLICY "Users can view their own cost plan changes" 
ON public.cost_plan_changes 
FOR SELECT 
USING (cost_plan_id IN (SELECT id FROM public.cost_plans WHERE user_id = auth.uid()));

CREATE POLICY "Users can create cost plan changes" 
ON public.cost_plan_changes 
FOR INSERT 
WITH CHECK (changed_by_user_id = auth.uid());

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_cost_plans_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_contract_cost_configurations_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cost_plans_updated_at
  BEFORE UPDATE ON public.cost_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cost_plans_updated_at();

CREATE TRIGGER update_contract_cost_configurations_updated_at
  BEFORE UPDATE ON public.contract_cost_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contract_cost_configurations_updated_at();

-- Trigger para registrar mudanças de custo automaticamente
CREATE OR REPLACE FUNCTION public.track_cost_plan_changes()
RETURNS trigger AS $$
BEGIN
  -- Apenas registra mudanças no custo base
  IF OLD.base_license_cost != NEW.base_license_cost THEN
    INSERT INTO public.cost_plan_changes (
      cost_plan_id,
      changed_by_user_id,
      previous_cost,
      new_cost,
      change_reason
    ) VALUES (
      NEW.id,
      NEW.user_id,
      OLD.base_license_cost,
      NEW.base_license_cost,
      'Alteração automática do custo base'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_cost_plan_changes_trigger
  AFTER UPDATE ON public.cost_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.track_cost_plan_changes();
