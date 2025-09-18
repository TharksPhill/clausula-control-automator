-- Criar tabela para cadastro de serviços
CREATE TABLE public.technical_visit_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('hourly', 'fixed')),
  fixed_price NUMERIC(10,2) NULL,
  estimated_hours NUMERIC(4,2) NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.technical_visit_services ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can manage their own services" 
ON public.technical_visit_services 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_technical_visit_services_updated_at
  BEFORE UPDATE ON public.technical_visit_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();