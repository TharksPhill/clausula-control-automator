
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSignWellConfig } from '@/hooks/useSignWellConfig';
import { supabase } from '@/integrations/supabase/client';

export const useSignWellIntegration = () => {
  const { toast } = useToast();
  const { isConfigured } = useSignWellConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callSignWellFunction = async (action: string, data: any, retries = 3) => {
    console.log('🚀 [HOOK] Iniciando chamada para SignWell function:', { action, data });
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 [HOOK] Tentativa ${attempt}/${retries}`);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('🔐 [HOOK] Session info:', {
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          tokenLength: session?.access_token?.length || 0
        });
        
        if (!session) {
          throw new Error('Usuário não autenticado - faça login novamente');
        }

        console.log('📡 [HOOK] Chamando edge function com:', {
          action,
          dataKeys: Object.keys(data || {}),
          hasToken: !!session.access_token
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const response = await supabase.functions.invoke('signwell-integration', {
            body: { action, data },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          clearTimeout(timeoutId);

          console.log('📥 [HOOK] Response da edge function:', {
            hasError: !!response.error,
            hasData: !!response.data,
            error: response.error,
            data: response.data
          });

          if (response.error) {
            console.error('❌ [HOOK] Erro na Edge Function:', response.error);
            
            if (attempt < retries && (
              response.error.message?.includes('network') || 
              response.error.message?.includes('timeout') ||
              response.error.message?.includes('fetch')
            )) {
              console.log(`🔄 [HOOK] Erro de rede, tentando novamente em ${attempt * 2} segundos...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 2000));
              continue;
            }
            
            throw new Error(response.error.message || 'Erro na integração SignWell');
          }

          return response.data;
          
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          
          if (fetchError.name === 'AbortError') {
            throw new Error('Timeout na requisição - tente novamente');
          }
          
          throw fetchError;
        }

      } catch (error: any) {
        console.error(`💥 [HOOK] Erro na tentativa ${attempt}:`, {
          name: error.name,
          message: error.message,
          stack: error.stack
        });

        if (attempt === retries) {
          throw error;
        }

        console.log(`⏳ [HOOK] Aguardando ${attempt * 2} segundos antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  };

  const testApiKey = async () => {
    if (!isConfigured) {
      throw new Error('SignWell não está configurado');
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🧪 [HOOK] Testando API Key...');

      const result = await callSignWellFunction('test_api_key', {});

      console.log('✅ [HOOK] Resultado do teste:', result);

      if (result?.success) {
        toast({
          title: "API Key Válida!",
          description: `Conexão com SignWell estabelecida. ${result.templatesCount || 0} templates encontrados.`,
        });
        return true;
      } else {
        console.error('❌ [HOOK] API Key inválida:', result?.error);
        const errorMessage = result?.error || 'API Key inválida';
        toast({
          title: "API Key Inválida",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }

    } catch (error: any) {
      console.error('❌ [HOOK] Erro no teste da API Key:', error);
      let errorMessage = 'Erro ao testar API Key do SignWell';
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'Timeout na conexão - verifique sua internet';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Erro de rede - verifique sua conexão';
      } else if (error.message?.includes('not configured')) {
        errorMessage = 'SignWell não configurado - configure sua API Key primeiro';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: "Erro no Teste",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createEnvelope = async (contractData: any, contractorData: any, companyData: any) => {
    if (!isConfigured) {
      throw new Error('SignWell não está configurado');
    }

    try {
      setLoading(true);
      setError(null);
      console.log('📄 [HOOK] Criando envelope SignWell...');

      const result = await callSignWellFunction('create_envelope', {
        contractData,
        contractorData,
        companyData
      });

      console.log('✅ [HOOK] Envelope criado:', result);

      if (result?.success) {
        toast({
          title: "Envelope Criado!",
          description: `Documento enviado para assinatura via SignWell.`,
        });
        return result.envelope;
      } else {
        console.error('❌ [HOOK] Erro ao criar envelope:', result?.error);
        const errorMessage = result?.error || 'Erro ao criar envelope';
        toast({
          title: "Erro ao Criar Envelope",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(errorMessage);
      }

    } catch (error: any) {
      console.error('❌ [HOOK] Erro ao criar envelope:', error);
      let errorMessage = 'Erro ao criar envelope no SignWell';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: "Erro ao Criar Envelope",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getEnvelopeStatus = async (envelopeId: string) => {
    if (!isConfigured) {
      throw new Error('SignWell não está configurado');
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 [HOOK] Verificando status do envelope:', envelopeId);

      const result = await callSignWellFunction('get_envelope_status', {
        envelopeId
      });

      console.log('✅ [HOOK] Status do envelope:', result);

      if (result?.success) {
        return result.status;
      } else {
        console.error('❌ [HOOK] Erro ao verificar status:', result?.error);
        const errorMessage = result?.error || 'Erro ao verificar status';
        throw new Error(errorMessage);
      }

    } catch (error: any) {
      console.error('❌ [HOOK] Erro ao verificar status:', error);
      let errorMessage = 'Erro ao verificar status do envelope';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendPdfForSignature = async (pdfBase64: string, contractNumber?: string) => {
    if (!isConfigured) {
      throw new Error('SignWell não está configurado');
    }

    try {
      setLoading(true);
      setError(null);
      console.log('📄 [HOOK] Enviando PDF para assinatura...', {
        pdfLength: pdfBase64?.length || 0,
        contractNumber
      });

      const result = await callSignWellFunction('send_pdf_for_signature', {
        pdfBase64,
        contractNumber
      });

      console.log('✅ [HOOK] PDF enviado:', result);

      if (result?.success) {
        toast({
          title: "PDF Enviado!",
          description: `Documento enviado para assinatura via SignWell. ID: ${result.document_id}`,
        });
        return {
          document_id: result.document_id,
          status: result.status,
          envelope_details: result.envelope_details
        };
      } else {
        console.error('❌ [HOOK] Erro ao enviar PDF:', result?.error);
        const errorMessage = result?.error || 'Erro ao enviar PDF';
        toast({
          title: "Erro ao Enviar PDF",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(errorMessage);
      }

    } catch (error: any) {
      console.error('❌ [HOOK] Erro ao enviar PDF:', error);
      let errorMessage = 'Erro ao enviar PDF para SignWell';
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'Timeout na requisição - PDF muito grande ou conexão lenta';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Erro de rede - verifique sua conexão';
      } else if (error.message?.includes('not configured')) {
        errorMessage = 'SignWell não configurado - configure sua API Key primeiro';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: "Erro ao Enviar PDF",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    testApiKey,
    createEnvelope,
    getEnvelopeStatus,
    sendPdfForSignature,
    isConfigured
  };
};
