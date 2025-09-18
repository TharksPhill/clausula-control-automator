
-- Adicionar foreign key constraints para estabelecer relacionamentos adequados
ALTER TABLE autentique_documents 
ADD CONSTRAINT fk_autentique_documents_contract_id 
FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

ALTER TABLE autentique_documents 
ADD CONSTRAINT fk_autentique_documents_contractor_id 
FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

-- Atualizar as policies RLS para permitir acesso através dos relacionamentos
DROP POLICY IF EXISTS "Users can view their own autentique documents" ON autentique_documents;
DROP POLICY IF EXISTS "Users can create their own autentique documents" ON autentique_documents;
DROP POLICY IF EXISTS "Users can update their own autentique documents" ON autentique_documents;

-- Recriar as policies com acesso através dos contratos
CREATE POLICY "Users can view autentique documents for their contracts" 
ON autentique_documents 
FOR SELECT 
USING (
  contract_id IN (
    SELECT id FROM contracts WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create autentique documents for their contracts" 
ON autentique_documents 
FOR INSERT 
WITH CHECK (
  contract_id IN (
    SELECT id FROM contracts WHERE user_id = auth.uid()
  ) AND auth.uid() = created_by_user
);

CREATE POLICY "Users can update autentique documents for their contracts" 
ON autentique_documents 
FOR UPDATE 
USING (
  contract_id IN (
    SELECT id FROM contracts WHERE user_id = auth.uid()
  ) AND auth.uid() = created_by_user
);
