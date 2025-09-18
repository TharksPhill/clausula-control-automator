
-- Criar tabela para configurações da Google Routes API
CREATE TABLE public.google_routes_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.google_routes_configurations ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can create their own Google Routes config"
ON public.google_routes_configurations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own Google Routes config"
ON public.google_routes_configurations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Routes config"
ON public.google_routes_configurations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Routes config"
ON public.google_routes_configurations
FOR DELETE
USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_google_routes_configurations_updated_at
BEFORE UPDATE ON public.google_routes_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índice para performance
CREATE INDEX idx_google_routes_configurations_user_active 
ON public.google_routes_configurations(user_id, is_active);

-- Criar função para salvar configuração da Google Routes
CREATE OR REPLACE FUNCTION public.save_google_routes_config(p_api_key text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate existing configurations for this user
  UPDATE public.google_routes_configurations
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Insert new configuration
  INSERT INTO public.google_routes_configurations (user_id, api_key, is_active)
  VALUES (p_user_id, p_api_key, true);
END;
$$;

-- Criar função para obter configuração da Google Routes
CREATE OR REPLACE FUNCTION public.get_google_routes_config()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  api_key text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    grc.id,
    grc.user_id,
    grc.api_key,
    grc.is_active,
    grc.created_at,
    grc.updated_at
  FROM public.google_routes_configurations grc
  WHERE grc.user_id = auth.uid() AND grc.is_active = true
  ORDER BY grc.created_at DESC
  LIMIT 1;
END;
$$;
