-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can upload attachments to their contracts" ON contract_attachments;
DROP POLICY IF EXISTS "Users can view their own contract attachments" ON contract_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON contract_attachments;

-- Criar políticas RLS corretas para contract_attachments
CREATE POLICY "Users can upload attachments to their contracts" 
ON contract_attachments 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  contract_id IN (
    SELECT id FROM contracts 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own contract attachments" 
ON contract_attachments 
FOR SELECT 
USING (
  contract_id IN (
    SELECT id FROM contracts 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own attachments" 
ON contract_attachments 
FOR DELETE 
USING (
  contract_id IN (
    SELECT id FROM contracts 
    WHERE user_id = auth.uid()
  )
);