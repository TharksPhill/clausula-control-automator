
-- Criar tabela para configurações do Google Maps
CREATE TABLE public.google_maps_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar Row Level Security (RLS)
ALTER TABLE public.google_maps_configurations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para que usuários só vejam suas próprias configurações
CREATE POLICY "Users can view their own Google Maps config" 
  ON public.google_maps_configurations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Google Maps config" 
  ON public.google_maps_configurations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Maps config" 
  ON public.google_maps_configurations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Maps config" 
  ON public.google_maps_configurations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_google_maps_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_google_maps_configurations_updated_at
  BEFORE UPDATE ON public.google_maps_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_google_maps_config_updated_at();
