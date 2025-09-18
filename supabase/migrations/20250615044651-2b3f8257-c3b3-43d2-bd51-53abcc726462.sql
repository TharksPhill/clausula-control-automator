
-- Adicionar coluna email à tabela contractors
ALTER TABLE public.contractors 
ADD COLUMN email text;

-- Adicionar índice para melhor performance nas consultas por email
CREATE INDEX IF NOT EXISTS idx_contractors_email 
ON public.contractors (email);
