-- Criar tabela para armazenar contratos assinados anexados
CREATE TABLE IF NOT EXISTS public.contract_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contract_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own contract attachments" 
ON public.contract_attachments 
FOR SELECT 
USING (
  contract_id IN (
    SELECT id FROM public.contracts WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload attachments to their contracts" 
ON public.contract_attachments 
FOR INSERT 
WITH CHECK (
  contract_id IN (
    SELECT id FROM public.contracts WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own attachments" 
ON public.contract_attachments 
FOR DELETE 
USING (
  contract_id IN (
    SELECT id FROM public.contracts WHERE user_id = auth.uid()
  )
);

-- Criar índice para melhor performance
CREATE INDEX idx_contract_attachments_contract_id ON public.contract_attachments(contract_id);
CREATE INDEX idx_contract_attachments_uploaded_at ON public.contract_attachments(uploaded_at DESC);