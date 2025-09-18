-- Criar tabela para histórico de status do contrato
CREATE TABLE public.contract_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Ativo', 'Inativo')),
  status_date DATE NOT NULL,
  status_type TEXT NOT NULL CHECK (status_type IN ('termination', 'reactivation')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  notes TEXT
);

-- Índices para performance
CREATE INDEX idx_contract_status_history_contract_id ON public.contract_status_history(contract_id);
CREATE INDEX idx_contract_status_history_status_date ON public.contract_status_history(status_date);

-- Enable RLS
ALTER TABLE public.contract_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their contract status history"
  ON public.contract_status_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create contract status history"
  ON public.contract_status_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their contract status history"
  ON public.contract_status_history
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their contract status history"
  ON public.contract_status_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Migrar dados existentes de termination_date e reactivation_date para o histórico
INSERT INTO public.contract_status_history (contract_id, user_id, status, status_date, status_type, notes)
SELECT 
  c.id,
  c.user_id,
  'Inativo',
  TO_DATE(c.termination_date, 'YYYY-MM-DD'),
  'termination',
  'Migrado do campo termination_date'
FROM public.contracts c
WHERE c.termination_date IS NOT NULL
  AND c.termination_date ~ '^\d{4}-\d{2}-\d{2}$';

INSERT INTO public.contract_status_history (contract_id, user_id, status, status_date, status_type, notes)
SELECT 
  c.id,
  c.user_id,
  'Ativo',
  TO_DATE(c.reactivation_date, 'YYYY-MM-DD'),
  'reactivation',
  'Migrado do campo reactivation_date'
FROM public.contracts c
WHERE c.reactivation_date IS NOT NULL
  AND c.reactivation_date ~ '^\d{4}-\d{2}-\d{2}$';