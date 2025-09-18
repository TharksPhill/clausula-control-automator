
-- Criar tabela para rastrear envelopes DocuSign
CREATE TABLE public.contract_docusign_envelopes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  envelope_id TEXT NOT NULL UNIQUE,
  contract_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  company_signed_at TIMESTAMP WITH TIME ZONE,
  contractor_signed_at TIMESTAMP WITH TIME ZONE,
  company_signature_data TEXT,
  contractor_signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índices para performance
CREATE INDEX idx_contract_docusign_envelopes_envelope_id ON public.contract_docusign_envelopes(envelope_id);
CREATE INDEX idx_contract_docusign_envelopes_contract_id ON public.contract_docusign_envelopes(contract_id);

-- Adicionar RLS (Row Level Security)
ALTER TABLE public.contract_docusign_envelopes ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso aos dados dos contratos
CREATE POLICY "Users can view their contract envelopes" ON public.contract_docusign_envelopes
  FOR SELECT USING (
    contract_id IN (
      SELECT id FROM public.contracts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their contract envelopes" ON public.contract_docusign_envelopes
  FOR INSERT WITH CHECK (
    contract_id IN (
      SELECT id FROM public.contracts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their contract envelopes" ON public.contract_docusign_envelopes
  FOR UPDATE USING (
    contract_id IN (
      SELECT id FROM public.contracts WHERE user_id = auth.uid()
    )
  );
