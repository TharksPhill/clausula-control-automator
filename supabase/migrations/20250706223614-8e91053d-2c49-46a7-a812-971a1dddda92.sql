-- Criar bucket para contratos do Autentique
INSERT INTO storage.buckets (id, name, public) 
VALUES ('autentique-contracts', 'autentique-contracts', true);

-- Criar políticas para o bucket
CREATE POLICY "Users can upload their autentique contracts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'autentique-contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their autentique contracts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'autentique-contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public access to autentique contracts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'autentique-contracts');

-- Adicionar coluna para armazenar o caminho do PDF na tabela autentique_documents
ALTER TABLE autentique_documents 
ADD COLUMN pdf_file_path TEXT;