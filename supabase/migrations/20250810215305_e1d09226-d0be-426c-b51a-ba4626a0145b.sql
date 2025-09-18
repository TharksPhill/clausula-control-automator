-- Criar tabela de configurações de veículos
CREATE TABLE public.vehicle_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT,
  vehicle_type TEXT NOT NULL DEFAULT 'Passeio',
  fuel_type TEXT NOT NULL DEFAULT 'Gasolina',
  purchase_value NUMERIC NOT NULL DEFAULT 0.00,
  current_estimated_value NUMERIC NOT NULL DEFAULT 0.00,
  annual_ipva NUMERIC NOT NULL DEFAULT 0.00,
  annual_insurance NUMERIC NOT NULL DEFAULT 0.00,
  annual_maintenance NUMERIC NOT NULL DEFAULT 0.00,
  fuel_consumption NUMERIC NOT NULL DEFAULT 0.00,
  annual_mileage NUMERIC NOT NULL DEFAULT 0.00,
  depreciation_rate NUMERIC NOT NULL DEFAULT 0.00,
  fuel_price NUMERIC NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vehicle_settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para que usuários só vejam seus próprios veículos
CREATE POLICY "Users can manage their own vehicle settings" 
ON public.vehicle_settings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_vehicle_settings_updated_at
  BEFORE UPDATE ON public.vehicle_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índice para performance
CREATE INDEX idx_vehicle_settings_user_id ON public.vehicle_settings(user_id);
CREATE INDEX idx_vehicle_settings_is_active ON public.vehicle_settings(is_active);