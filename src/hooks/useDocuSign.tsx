
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface DocuSignEnvelope {
  envelopeId: string;
  status: string;
  signingUrl?: string;
  documentId?: string;
  createdDateTime?: string;
  completedDateTime?: string;
  recipients?: Array<{
    name: string;
    email: string;
    status: string;
    signedDateTime?: string;
  }>;
}

export const useDocuSign = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEnvelope = useCallback(async (
    contractData: any,
    contractorData: any,
    options?: {
      emailSubject?: string;
      emailMessage?: string;
      redirectUrl?: string;
    }
  ): Promise<DocuSignEnvelope | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Criando envelope DocuSign para contrato:', contractData?.contract_number);
      
      // Preparar dados do documento
      const documentData = {
        contractId: contractData?.id,
        contractNumber: contractData?.contract_number,
        contractorName: contractorData?.name,
        responsibleName: contractorData?.responsible_name,
        responsibleEmail: contractorData?.email,
        monthlyValue: contractData?.monthly_value,
        planType: contractData?.plan_type,
        startDate: contractData?.start_date,
        renewalDate: contractData?.renewal_date
      };

      // Preparar dados do signatário
      const signerData = {
        name: contractorData?.responsible_name || contractorData?.name,
        email: contractorData?.email,
        clientUserId: contractorData?.id
      };

      // Simular chamada para API do DocuSign
      const envelope = await simulateDocuSignAPI(documentData, signerData, options);
      
      console.log('✅ Envelope criado com sucesso:', envelope.envelopeId);
      
      toast({
        title: "Envelope criado",
        description: `Documento enviado para assinatura via DocuSign`,
      });

      return envelope;

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar envelope no DocuSign';
      setError(errorMessage);
      
      console.error('❌ Erro DocuSign:', err);
      
      toast({
        title: "Erro DocuSign",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getEnvelopeStatus = useCallback(async (envelopeId: string): Promise<DocuSignEnvelope | null> => {
    try {
      console.log('🔍 Verificando status do envelope:', envelopeId);
      
      // Simular consulta de status
      const envelope = await simulateStatusQuery(envelopeId);
      
      console.log('📊 Status atual:', envelope.status);
      
      return envelope;
    } catch (err: any) {
      console.error('❌ Erro ao consultar status:', err);
      setError(err.message);
      return null;
    }
  }, []);

  const getSigningUrl = useCallback(async (
    envelopeId: string,
    recipientEmail: string,
    returnUrl?: string
  ): Promise<string | null> => {
    try {
      console.log('🔗 Gerando URL de assinatura para:', recipientEmail);
      
      // Simular geração de URL
      const signingUrl = await simulateSigningUrlGeneration(envelopeId, recipientEmail, returnUrl);
      
      console.log('✅ URL de assinatura gerada');
      
      return signingUrl;
    } catch (err: any) {
      console.error('❌ Erro ao gerar URL:', err);
      setError(err.message);
      return null;
    }
  }, []);

  const downloadCompletedDocument = useCallback(async (envelopeId: string): Promise<Blob | null> => {
    try {
      console.log('📁 Baixando documento assinado:', envelopeId);
      
      // Simular download do documento
      const documentBlob = await simulateDocumentDownload(envelopeId);
      
      console.log('✅ Documento baixado com sucesso');
      
      return documentBlob;
    } catch (err: any) {
      console.error('❌ Erro ao baixar documento:', err);
      setError(err.message);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    createEnvelope,
    getEnvelopeStatus,
    getSigningUrl,
    downloadCompletedDocument,
    clearError: () => setError(null)
  };
};

// Funções de simulação - em produção seriam chamadas reais para a API do DocuSign
const simulateDocuSignAPI = async (
  documentData: any,
  signerData: any,
  options?: any
): Promise<DocuSignEnvelope> => {
  // Simular tempo de processamento
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const envelopeId = `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const signingUrl = `https://demo.docusign.net/signing/${envelopeId}`;
  
  return {
    envelopeId,
    status: 'sent',
    signingUrl,
    documentId: `doc_${Date.now()}`,
    createdDateTime: new Date().toISOString(),
    recipients: [{
      name: signerData.name,
      email: signerData.email,
      status: 'sent'
    }]
  };
};

const simulateStatusQuery = async (envelopeId: string): Promise<DocuSignEnvelope> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simular diferentes status baseado no tempo
  const statuses = ['sent', 'delivered', 'completed', 'declined', 'voided'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    envelopeId,
    status: randomStatus,
    createdDateTime: new Date(Date.now() - 60000).toISOString(),
    completedDateTime: randomStatus === 'completed' ? new Date().toISOString() : undefined,
    recipients: [{
      name: 'Signatário Teste',
      email: 'teste@exemplo.com',
      status: randomStatus,
      signedDateTime: randomStatus === 'completed' ? new Date().toISOString() : undefined
    }]
  };
};

const simulateSigningUrlGeneration = async (
  envelopeId: string,
  recipientEmail: string,
  returnUrl?: string
): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const baseUrl = 'https://demo.docusign.net/signing';
  const params = new URLSearchParams({
    envelopeId,
    email: recipientEmail,
    returnUrl: returnUrl || window.location.origin
  });
  
  return `${baseUrl}?${params.toString()}`;
};

const simulateDocumentDownload = async (envelopeId: string): Promise<Blob> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simular documento PDF
  const pdfContent = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, // PDF header
    // ... resto do conteúdo simulado
  ]);
  
  return new Blob([pdfContent], { type: 'application/pdf' });
};

export default useDocuSign;
