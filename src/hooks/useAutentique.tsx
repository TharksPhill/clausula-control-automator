import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAutentique = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendDocumentForSigning = async (
    contractData: any,
    contractorData: any,
    documentBase64?: string,
    documentUrl?: string,
    filename?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔏 [AUTENTIQUE HOOK] Enviando documento para assinatura...');

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado - faça login novamente');
      }

      const payload = {
        contractData,
        contractorData,
        documentBase64,
        documentUrl,
        filename
      };

      console.log('📡 [AUTENTIQUE HOOK] Chamando edge function...', {
        contractId: contractData.id,
        contractorEmail: contractorData.email
      });

      const { data, error: functionError } = await supabase.functions.invoke('autentique-signature', {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('📥 [AUTENTIQUE HOOK] Response da edge function:', data);

      if (functionError) {
        console.error('❌ [AUTENTIQUE HOOK] Erro na Edge Function:', functionError);
        throw new Error(functionError.message || 'Erro na comunicação com o servidor');
      }

      if (!data?.success) {
        const errorMessage = data?.error || 'Erro desconhecido na API da Autentique';
        console.error('❌ [AUTENTIQUE HOOK] Erro na resposta:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('✅ [AUTENTIQUE HOOK] Documento enviado com sucesso:', data.data);

      toast({
        title: "Documento enviado!",
        description: "O contrato foi enviado para assinatura via Autentique.",
      });

      return data.data;

    } catch (error: any) {
      console.error('💥 [AUTENTIQUE HOOK] Erro no hook:', error);
      
      let errorMessage = 'Erro ao enviar documento para Autentique';
      
      if (error.message?.includes('Token da API Autentique')) {
        errorMessage = 'Token da API Autentique não configurado ou inválido';
      } else if (error.message?.includes('email')) {
        errorMessage = 'Email do contratante é obrigatório';
      } else if (error.message?.includes('documento')) {
        errorMessage = 'Erro no documento fornecido';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: "Erro na Autentique",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateContractPdf = async (contractData: any) => {
    try {
      console.log('📄 [AUTENTIQUE HOOK] Gerando PDF do contrato...');
      
      const { data, error } = await supabase.functions.invoke('html-to-pdf', {
        body: {
          html: document.documentElement.outerHTML,
          options: {
            format: 'A4',
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
            printBackground: true
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao gerar PDF');
      }

      console.log('✅ [AUTENTIQUE HOOK] PDF gerado com sucesso');
      return data.pdf;
      
    } catch (error: any) {
      console.error('❌ [AUTENTIQUE HOOK] Erro ao gerar PDF:', error);
      throw new Error('Erro ao gerar PDF do contrato');
    }
  };

  const sendContractForSigning = async (contractData: any, contractorData: any) => {
    try {
      // Primeiro gerar o PDF
      const pdfBase64 = await generateContractPdf(contractData);
      
      // Definir nome do arquivo
      const filename = `contrato-${contractData.contract_number}-autentique.pdf`;
      
      // Enviar para Autentique
      const result = await sendDocumentForSigning(
        contractData,
        contractorData,
        pdfBase64,
        undefined,
        filename
      );
      
      return result;
    } catch (error) {
      console.error('❌ [AUTENTIQUE HOOK] Erro no processo completo:', error);
      throw error;
    }
  };

  return {
    loading,
    error,
    sendDocumentForSigning,
    sendContractForSigning,
    generateContractPdf
  };
};