-- Create table for Autentique documents
CREATE TABLE public.autentique_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL,
  public_id TEXT NOT NULL,
  contract_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  signer_email TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  document_name TEXT NOT NULL,
  created_by_user UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  autentique_data JSONB,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.autentique_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own autentique documents" 
ON public.autentique_documents 
FOR SELECT 
USING (auth.uid() = created_by_user);

CREATE POLICY "Users can create their own autentique documents" 
ON public.autentique_documents 
FOR INSERT 
WITH CHECK (auth.uid() = created_by_user);

CREATE POLICY "Users can update their own autentique documents" 
ON public.autentique_documents 
FOR UPDATE 
USING (auth.uid() = created_by_user);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_autentique_documents_updated_at
BEFORE UPDATE ON public.autentique_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_autentique_documents_contract_id ON public.autentique_documents(contract_id);
CREATE INDEX idx_autentique_documents_contractor_id ON public.autentique_documents(contractor_id);
CREATE INDEX idx_autentique_documents_status ON public.autentique_documents(status);
CREATE INDEX idx_autentique_documents_created_by_user ON public.autentique_documents(created_by_user);