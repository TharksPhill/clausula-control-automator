
-- Adicionar a coluna docusign_data que está faltando
ALTER TABLE contract_docusign_envelopes 
ADD COLUMN IF NOT EXISTS docusign_data JSONB;

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_contract_docusign_envelopes_docusign_data 
ON contract_docusign_envelopes USING GIN (docusign_data);
