-- Adicionar campo de data de reativação
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS reactivation_date TEXT DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.contracts.reactivation_date IS 'Data de reativação do contrato após encerramento';