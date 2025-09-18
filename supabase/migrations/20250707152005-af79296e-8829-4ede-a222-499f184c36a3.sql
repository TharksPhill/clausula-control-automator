-- Criar tabela para configurações de veículos
CREATE TABLE public.vehicle_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT,
  vehicle_type TEXT DEFAULT 'Passeio',
  fuel_type TEXT DEFAULT 'Gasolina',
  purchase_value NUMERIC(10,2) DEFAULT 0.00,
  current_estimated_value NUMERIC(10,2) DEFAULT 0.00,
  annual_ipva NUMERIC(10,2) DEFAULT 0.00,
  annual_insurance NUMERIC(10,2) DEFAULT 0.00,
  annual_maintenance NUMERIC(10,2) DEFAULT 0.00,
  fuel_consumption NUMERIC(5,2) DEFAULT 12.0, -- km/L
  annual_mileage NUMERIC(10,2) DEFAULT 15000,
  depreciation_rate NUMERIC(5,2) DEFAULT 10.0, -- %
  toll_per_km NUMERIC(10,4) DEFAULT 0.00, -- R$ por km
  fuel_price NUMERIC(10,4) DEFAULT 5.50, -- R$ por litro
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vehicle_settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can manage their own vehicle settings"
ON public.vehicle_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_vehicle_settings_updated_at
BEFORE UPDATE ON public.vehicle_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();