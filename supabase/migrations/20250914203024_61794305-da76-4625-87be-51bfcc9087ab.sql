-- Remover políticas antigas do bucket autentique-contracts se existirem
DROP POLICY IF EXISTS "Public access to autentique-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to autentique-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update autentique-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from autentique-contracts" ON storage.objects;

-- Criar novas políticas RLS para o bucket autentique-contracts
-- Permitir que usuários autenticados façam upload
CREATE POLICY "Authenticated users can upload to autentique-contracts" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'autentique-contracts');

-- Permitir visualização pública (já que o bucket é público)
CREATE POLICY "Public access to autentique-contracts" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'autentique-contracts');

-- Permitir que usuários autenticados atualizem seus arquivos
CREATE POLICY "Authenticated users can update autentique-contracts" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'autentique-contracts');

-- Permitir que usuários autenticados deletem seus arquivos
CREATE POLICY "Authenticated users can delete from autentique-contracts" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'autentique-contracts');