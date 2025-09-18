
-- Criar tabela para configurações do Google Maps
CREATE TABLE public.google_maps_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.google_maps_configurations ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can manage their own Google Maps configurations"
ON public.google_maps_configurations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_google_maps_configurations_updated_at
BEFORE UPDATE ON public.google_maps_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índice para performance
CREATE INDEX idx_google_maps_configurations_user_active 
ON public.google_maps_configurations(user_id, is_active);
