-- Criar tabela para configurações de visita técnica
CREATE TABLE public.technical_visit_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  visit_cost NUMERIC NOT NULL DEFAULT 250.00,
  km_cost NUMERIC NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT technical_visit_settings_user_id_unique UNIQUE (user_id)
);

-- Habilitar RLS
ALTER TABLE public.technical_visit_settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can manage their own technical visit settings"
ON public.technical_visit_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_technical_visit_settings_updated_at
BEFORE UPDATE ON public.technical_visit_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();