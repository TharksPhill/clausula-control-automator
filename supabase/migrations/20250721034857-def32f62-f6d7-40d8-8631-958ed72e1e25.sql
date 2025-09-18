
-- Criar tabela para controle de bloqueio de reajustes
CREATE TABLE public.contract_adjustment_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  renewal_year INTEGER NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_by TEXT NOT NULL,
  unlock_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Garantir que só existe um registro por contrato/ano
  UNIQUE(contract_id, renewal_year)
);

-- Adicionar RLS
ALTER TABLE public.contract_adjustment_locks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para que usuários vejam apenas os bloqueios de seus próprios contratos
CREATE POLICY "Users can view locks for their own contracts"
  ON public.contract_adjustment_locks
  FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM public.contracts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create locks for their own contracts"
  ON public.contract_adjustment_locks
  FOR INSERT
  WITH CHECK (
    contract_id IN (
      SELECT id FROM public.contracts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update locks for their own contracts"
  ON public.contract_adjustment_locks
  FOR UPDATE
  USING (
    contract_id IN (
      SELECT id FROM public.contracts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete locks for their own contracts"
  ON public.contract_adjustment_locks
  FOR DELETE
  USING (
    contract_id IN (
      SELECT id FROM public.contracts WHERE user_id = auth.uid()
    )
  );

-- Função para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION public.update_contract_adjustment_locks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_contract_adjustment_locks_updated_at
  BEFORE UPDATE ON public.contract_adjustment_locks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contract_adjustment_locks_updated_at();

-- Índices para melhorar performance
CREATE INDEX idx_contract_adjustment_locks_contract_id ON public.contract_adjustment_locks(contract_id);
CREATE INDEX idx_contract_adjustment_locks_renewal_year ON public.contract_adjustment_locks(renewal_year);
CREATE INDEX idx_contract_adjustment_locks_is_locked ON public.contract_adjustment_locks(is_locked);
