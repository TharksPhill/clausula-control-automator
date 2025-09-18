-- Adicionar campos CNAE na tabela contractors
ALTER TABLE public.contractors 
ADD COLUMN IF NOT EXISTS cnae_principal TEXT,
ADD COLUMN IF NOT EXISTS cnae_descricao TEXT,
ADD COLUMN IF NOT EXISTS segmento TEXT,
ADD COLUMN IF NOT EXISTS cnaes_secundarios JSONB;

-- Criar índice para otimizar buscas por segmento
CREATE INDEX IF NOT EXISTS idx_contractors_segmento ON public.contractors(segmento);
CREATE INDEX IF NOT EXISTS idx_contractors_cnae_principal ON public.contractors(cnae_principal);