
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface DocuSignEnvelope {
  envelopeId: string;
  status: string;
  signingUrl?: string;
  documentId?: string;
  createdDateTime?: string;
  recipients?: Array<{
    name: string;
    email: string;
    status: string;
  }>;
}

export const useDocuSignSimple = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEnvelope = async (
    contractData: any,
    contractorData: any
  ): Promise<DocuSignEnvelope | null> => {
    console.log('Iniciando criação de envelope DocuSign...');
    setLoading(true);
    setError(null);

    try {
      // Normalizar dados do contratante
      const contractor = Array.isArray(contractorData) ? contractorData[0] : contractorData;
      
      console.log('Dados para envio:', {
        contractId: contractData?.id,
        contractNumber: contractData?.contract_number,
        contractorName: contractor?.name,
        contractorEmail: contractor?.email || 'Email não encontrado'
      });

      const { data: envelope, error: functionError } = await supabase.functions.invoke(
        'create-docusign-envelope',
        {
          body: {
            contractData,
            contractorData: contractor
          },
        }
      );

      console.log('Resposta da função:', { envelope, functionError });

      if (functionError) {
        throw new Error(`Erro na função: ${functionError.message}`);
      }

      if (!envelope) {
        throw new Error('Nenhum envelope retornado');
      }

      console.log('Envelope criado com sucesso:', envelope);

      toast({
        title: "Envelope DocuSign Criado!",
        description: `Envelope ${envelope.envelopeId} criado e enviado`,
      });

      return envelope as DocuSignEnvelope;

    } catch (err: any) {
      const errorMessage = err.message || 'Erro desconhecido';
      console.error('Erro ao criar envelope:', err);
      
      setError(errorMessage);
      toast({
        title: "Erro no DocuSign",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getEnvelopeStatus = async (envelopeId: string) => {
    try {
      const { data, error } = await supabase
        .from('contract_docusign_envelopes')
        .select('*')
        .eq('envelope_id', envelopeId)
        .single();
      
      if (error) {
        console.error('Erro ao buscar status:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return null;
    }
  };

  return {
    loading,
    error,
    createEnvelope,
    getEnvelopeStatus,
    clearError: () => setError(null),
  };
};
