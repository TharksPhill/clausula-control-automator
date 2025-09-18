
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DocuSignConfig {
  clientId: string;
  clientSecret: string;
  accountId: string;
  baseUrl: string;
  redirectUri?: string;
}

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

export const useDocuSignRealIntegration = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Check if DocuSign is configured for the current user
  const checkConfiguration = useCallback(async () => {
    if (!user?.id) {
      setIsConfigured(false);
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('docusign_configurations')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ [CONFIG] Erro ao verificar configuração:', error);
        setIsConfigured(false);
        return false;
      }

      const configured = !!data;
      setIsConfigured(configured);
      console.log('🔍 [CONFIG] DocuSign configurado:', configured ? 'Sim' : 'Não');
      return configured;
    } catch (error) {
      console.error('💥 [CONFIG] Erro ao verificar configuração:', error);
      setIsConfigured(false);
      return false;
    }
  }, [user?.id]);

  useEffect(() => {
    checkConfiguration();
  }, [checkConfiguration]);

  const sendNotificationEmail = async (emailData: {
    user_email: string;
    type: string;
    title: string;
    message: string;
    contract_number?: string;
    company_name?: string;
    custom_subject?: string;
  }) => {
    try {
      console.log('📧 [EMAIL] Enviando email de notificação para:', emailData.user_email);
      
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: emailData
      });

      if (error) {
        console.error('❌ [EMAIL] Erro ao enviar email:', error);
        return false;
      }

      console.log('✅ [EMAIL] Email enviado com sucesso:', data);
      return true;
    } catch (error) {
      console.error('💥 [EMAIL] Erro crítico no envio de email:', error);
      return false;
    }
  };

  const saveEnvelopeToDatabase = async (envelopeId: string, contractId: string, contractorId: string): Promise<boolean> => {
    try {
      console.log('💾 [DB] Salvando envelope no banco:', { envelopeId, contractId, contractorId });
      
      const { error } = await supabase
        .from('contract_docusign_envelopes')
        .insert({
          envelope_id: envelopeId,
          contract_id: contractId,
          contractor_id: contractorId,
          status: 'sent'
        });
      
      if (error) {
        console.error('❌ [DB] Erro ao salvar envelope no banco:', error);
        return false;
      }
      
      console.log('✅ [DB] Envelope salvo no banco com sucesso');
      return true;
    } catch (error) {
      console.error('💥 [DB] Erro crítico ao salvar envelope:', error);
      return false;
    }
  };

  const createRealEnvelope = useCallback(async (
    contractData: any,
    contractorData: any,
    companyData: any,
    options?: {
      emailSubject?: string;
      emailMessage?: string;
      redirectUrl?: string;
    }
  ): Promise<DocuSignEnvelope | null> => {
    console.log('🚀 [HOOK] ===== INICIANDO CRIAÇÃO DE ENVELOPE DOCUSIGN =====');
    console.log('📋 [HOOK] Dados de entrada:', {
      contractData: {
        id: contractData?.id,
        contract_number: contractData?.contract_number,
      },
      contractorData: {
        id: contractorData?.id,
        name: contractorData?.name,
        email: contractorData?.email
      },
      companyData,
      options
    });
    
    setLoading(true);
    setError(null);

    try {
      // Check if DocuSign is configured
      const configured = await checkConfiguration();
      if (!configured) {
        throw new Error('DocuSign não está configurado. Configure a integração nas configurações do sistema.');
      }

      if (!contractData?.id) {
        throw new Error('ID do contrato não fornecido');
      }
      if (!contractorData?.id) {
        throw new Error('ID do contratante não fornecido');
      }
      if (!companyData || typeof companyData !== 'object' || !companyData.name) {
        console.error('❌ [HOOK] Dados da empresa (companyData) são inválidos ou estão ausentes.', companyData);
        throw new Error('Dados da empresa (companyData) são inválidos ou estão ausentes.');
      }

      console.log('📡 [HOOK] Chamando função Supabase: create-docusign-envelope');
      
      // Deep copy to avoid mutating original data used in the UI
      const payload = JSON.parse(JSON.stringify({
        contractData,
        contractorData,
        companyInfo: companyData,
        options,
      }));

      // Remove large logo data before sending to the function to prevent payload size issues
      if (payload.companyInfo && payload.companyInfo.logo) {
        delete payload.companyInfo.logo;
      }
      if (payload.contractData && payload.contractData.company && payload.contractData.company.logo) {
        delete payload.contractData.company.logo;
      }
      
      console.log('📤 [HOOK] Payload final que será enviado (sem logo):', JSON.stringify(payload, null, 2));

      const startTime = Date.now();
      const { data: envelope, error: functionError } = await supabase.functions.invoke(
        'create-docusign-envelope',
        { body: payload }
      );
      const endTime = Date.now();
      console.log(`⏱️ [HOOK] Função executada em ${endTime - startTime}ms`);
      console.log('📥 [HOOK] Resposta bruta da função:', {
        envelope,
        functionError,
        envelopeType: typeof envelope,
        errorType: typeof functionError
      });

      if (functionError) {
        console.error('❌ [HOOK] ERRO NA FUNÇÃO DO SUPABASE:', functionError);
        console.error('❌ [HOOK] Detalhes do erro:', JSON.stringify(functionError, null, 2));
        throw new Error(`Erro na função Supabase: ${functionError.message || JSON.stringify(functionError)}`);
      }

      if (!envelope) {
        console.error('❌ [HOOK] ENVELOPE NULO RETORNADO');
        throw new Error('A função retornou um envelope nulo');
      }

      if (!envelope.envelopeId) {
        console.error('❌ [HOOK] ENVELOPE SEM ID:', envelope);
        throw new Error('Envelope criado sem ID válido');
      }
      
      console.log('✅ [HOOK] ENVELOPE DOCUSIGN CRIADO COM SUCESSO:', {
        envelopeId: envelope.envelopeId,
        status: envelope.status,
        signingUrl: envelope.signingUrl,
        recipients: envelope.recipients?.length || 0
      });

      // Salvar no banco de dados
      console.log('💾 [HOOK] Iniciando salvamento no banco...');
      const saveSuccess = await saveEnvelopeToDatabase(envelope.envelopeId, contractData.id, contractorData.id);
      if (!saveSuccess) {
        console.warn('⚠️ [HOOK] Falha ao salvar no banco, mas envelope foi criado');
      }

      // Enviar email de notificação
      const contractorEmail = contractorData?.email;
      if (contractorEmail && contractorEmail.includes('@') && contractorEmail !== 'demo@example.com') {
        console.log('📧 [HOOK] Iniciando envio de email de notificação...');
        
        const emailSuccess = await sendNotificationEmail({
          user_email: contractorEmail,
          type: 'contract_signature_request',
          title: 'Contrato aguardando sua assinatura digital via DocuSign',
          message: `Olá ${contractorData?.responsible_name || contractorData?.name},\n\nO contrato ${contractData.contract_number} está pronto para assinatura digital.\n\nDetalhes do contrato:\n• Número: ${contractData.contract_number}\n• Valor mensal: R$ ${contractData.monthly_value}\n• Empresa: ${contractorData?.name}\n\nVocê receberá em breve um email separado do DocuSign com o link direto para assinatura. \n\nEste email é apenas uma notificação de que o processo foi iniciado.\n\nAtenciosamente,\n${companyData.name}`,
          contract_number: contractData.contract_number,
          company_name: companyData.name,
          custom_subject: `📋 DocuSign: Contrato ${contractData.contract_number} pronto para assinatura`
        });
        
        if (emailSuccess) {
          console.log('✅ [HOOK] Email de notificação enviado com sucesso');
          toast({
            title: "Email de notificação enviado!",
            description: `O contratante foi notificado em ${contractorEmail} sobre o DocuSign`,
          });
        } else {
          console.warn('⚠️ [HOOK] Falha ao enviar email de notificação');
          toast({
            title: "Envelope criado",
            description: "Envelope DocuSign criado, mas houve falha no envio da notificação por email",
            variant: "destructive",
          });
        }
      } else {
        console.warn('⚠️ [HOOK] Email do contratante inválido ou de demonstração:', contractorEmail);
        toast({
          title: "Atenção: Email inválido",
          description: "O envelope foi criado mas o email do contratante é inválido",
          variant: "destructive",
        });
      }
      
      console.log('🎉 [HOOK] ===== PROCESSO CONCLUÍDO COM SUCESSO =====');
      return envelope as DocuSignEnvelope;

    } catch (err: any) {
      const errorMessage = err.message || 'Erro desconhecido ao criar envelope DocuSign';
      console.error('❌ [HOOK] ===== ERRO CRÍTICO =====');
      console.error('❌ [HOOK] Erro:', err);
      console.error('❌ [HOOK] Mensagem:', errorMessage);
      console.error('❌ [HOOK] Stack:', err.stack);
      console.error('❌ [HOOK] ===========================');
      
      setError(errorMessage);
      toast({
        title: "Erro no DocuSign",
        description: `Erro detalhado: ${errorMessage}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
      console.log('🏁 [HOOK] Hook finalizado, loading = false');
    }
  }, [toast, checkConfiguration]);

  const checkEnvelopeStatus = useCallback(async (envelopeId: string): Promise<any> => {
    console.log('🔍 Verificando status do envelope:', envelopeId);
    
    try {
      const { data, error } = await supabase
        .from('contract_docusign_envelopes')
        .select('*')
        .eq('envelope_id', envelopeId)
        .single();
      
      if (error || !data) {
        console.log('Envelope não encontrado no banco, retornando status padrão');
        return {
          envelopeId,
          status: 'sent',
          createdDateTime: new Date().toISOString()
        };
      }
      
      return {
        envelopeId: data.envelope_id,
        status: data.status,
        createdDateTime: data.created_at,
        contractorSignedAt: data.contractor_signed_at,
        companySignedAt: data.company_signed_at
      };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return {
        envelopeId,
        status: 'sent',
        createdDateTime: new Date().toISOString()
      };
    }
  }, []);

  return {
    loading,
    error,
    createRealEnvelope,
    checkEnvelopeStatus,
    clearError: () => setError(null),
    isConfigured: () => isConfigured,
    checkConfiguration
  };
};

export default useDocuSignRealIntegration;
