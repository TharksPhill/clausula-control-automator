
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DocuSignConfig {
  id?: string;
  integrationKey: string;
  userId: string;
  accountId: string;
  rsaPrivateKey: string;
  baseUrl: string;
  authServer: string;
  isActive: boolean;
}

export const useDocuSignConfig = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<DocuSignConfig | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const fetchConfig = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('🔍 [CONFIG] Buscando configuração DocuSign para usuário:', user.id);

      const { data, error } = await supabase
        .from('docusign_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ [CONFIG] Erro ao buscar configuração:', error);
        throw error;
      }

      if (data) {
        console.log('✅ [CONFIG] Configuração encontrada');
        const configData: DocuSignConfig = {
          id: data.id,
          integrationKey: data.integration_key,
          userId: data.user_id_docusign,
          accountId: data.account_id,
          rsaPrivateKey: data.rsa_private_key,
          baseUrl: data.base_url,
          authServer: data.auth_server,
          isActive: data.is_active
        };
        setConfig(configData);
        setIsConfigured(true);
      } else {
        console.log('ℹ️ [CONFIG] Nenhuma configuração encontrada');
        setConfig(null);
        setIsConfigured(false);
      }
    } catch (error: any) {
      console.error('💥 [CONFIG] Erro ao carregar configuração:', error);
      toast({
        title: "Erro ao carregar configuração",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (configData: Omit<DocuSignConfig, 'id' | 'isActive'>) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);
      console.log('💾 [CONFIG] Salvando configuração DocuSign...');

      // Validar e formatar a chave privada antes de salvar
      let formattedKey = configData.rsaPrivateKey.trim();
      
      // Normalizar quebras de linha
      formattedKey = formattedKey.replace(/\\n/g, '\n');
      
      // Verificar se tem os delimitadores corretos
      if (!formattedKey.includes('-----BEGIN') || !formattedKey.includes('-----END')) {
        throw new Error('Chave privada deve conter os delimitadores BEGIN e END');
      }

      // Verificar se já existe uma configuração para este usuário
      const { data: existingConfig } = await supabase
        .from('docusign_configurations')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let savedData;

      if (existingConfig) {
        // Atualizar configuração existente
        console.log('🔄 [CONFIG] Atualizando configuração existente');
        const { data, error } = await supabase
          .from('docusign_configurations')
          .update({
            integration_key: configData.integrationKey,
            user_id_docusign: configData.userId,
            account_id: configData.accountId,
            rsa_private_key: formattedKey,
            base_url: configData.baseUrl,
            auth_server: configData.authServer,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('❌ [CONFIG] Erro ao atualizar configuração:', error);
          throw error;
        }
        savedData = data;
      } else {
        // Inserir nova configuração
        console.log('➕ [CONFIG] Inserindo nova configuração');
        const { data, error } = await supabase
          .from('docusign_configurations')
          .insert({
            user_id: user.id,
            integration_key: configData.integrationKey,
            user_id_docusign: configData.userId,
            account_id: configData.accountId,
            rsa_private_key: formattedKey,
            base_url: configData.baseUrl,
            auth_server: configData.authServer,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.error('❌ [CONFIG] Erro ao inserir configuração:', error);
          throw error;
        }
        savedData = data;
      }

      console.log('✅ [CONFIG] Configuração salva com sucesso');
      
      const savedConfig: DocuSignConfig = {
        id: savedData.id,
        integrationKey: savedData.integration_key,
        userId: savedData.user_id_docusign,
        accountId: savedData.account_id,
        rsaPrivateKey: savedData.rsa_private_key,
        baseUrl: savedData.base_url,
        authServer: savedData.auth_server,
        isActive: savedData.is_active
      };

      setConfig(savedConfig);
      setIsConfigured(true);

      toast({
        title: "Configuração salva",
        description: "DocuSign configurado com sucesso!",
      });

      return savedConfig;
    } catch (error: any) {
      console.error('💥 [CONFIG] Erro ao salvar configuração:', error);
      toast({
        title: "Erro ao salvar configuração",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (): Promise<boolean> => {
    if (!config) {
      toast({
        title: "Configuração não encontrada",
        description: "Configure o DocuSign antes de testar a conexão.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      console.log('🧪 [CONFIG] Testando conexão DocuSign...');
      console.log('🧪 [CONFIG] Enviando dados para edge function...');

      // Criar um envelope de teste simples para verificar a conexão
      const testData = {
        contractData: {
          contract_number: 'TEST-CONNECTION-' + Date.now(),
          monthly_value: '0,00',
          plan_type: 'Teste',
          employee_count: '1',
          cnpj_count: '1',
          start_date: new Date().toISOString().split('T')[0],
          renewal_date: new Date().toISOString().split('T')[0],
          trial_days: '0',
          payment_day: '1',
          payment_start_date: new Date().toISOString().split('T')[0]
        },
        contractorData: {
          name: 'Empresa Teste Ltda',
          cnpj: '00.000.000/0001-00',
          address: 'Rua de Teste, 123',
          city: 'Cidade Teste',
          state: 'SP',
          responsible_name: 'João da Silva',
          responsible_cpf: '000.000.000-00',
          email: 'teste@exemplo.com'
        },
        companyInfo: {
          name: 'Sua Empresa Teste',
          email: 'contato@suaempresa.com',
          phone: '(11) 99999-9999',
          responsibleName: 'Administrador Teste'
        },
        options: {
          emailSubject: 'TESTE - Conexão DocuSign',
          emailMessage: 'Este é um teste de conexão com DocuSign. Documento gerado automaticamente.',
          test: true
        }
      };

      console.log('🧪 [CONFIG] Dados do teste preparados:', testData);

      const { data, error } = await supabase.functions.invoke('create-docusign-envelope', {
        body: testData
      });

      console.log('🧪 [CONFIG] Resposta da edge function:', { data, error });

      if (error) {
        console.error('❌ [CONFIG] Erro detalhado da edge function:', error);
        let errorMessage = 'Erro desconhecido';
        
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'object') {
          errorMessage = JSON.stringify(error);
        }
        
        toast({
          title: "Falha no teste de conexão",
          description: `Erro: ${errorMessage}`,
          variant: "destructive",
        });
        return false;
      }

      if (data?.envelopeId && data?.isTest) {
        console.log('✅ [CONFIG] Teste de conexão bem-sucedido, envelope:', data.envelopeId);
        toast({
          title: "🎉 Conexão bem-sucedida!",
          description: `DocuSign configurado corretamente. Envelope de teste: ${data.envelopeId}`,
        });
        return true;
      } else {
        console.error('❌ [CONFIG] Resposta inválida no teste:', data);
        toast({
          title: "Falha no teste",
          description: "Resposta inválida do DocuSign.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('💥 [CONFIG] Erro no teste de conexão:', error);
      toast({
        title: "Erro no teste",
        description: error.message || "Erro interno no teste de conexão",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteConfig = async () => {
    if (!config?.id) return;

    try {
      setLoading(true);
      console.log('🗑️ [CONFIG] Removendo configuração DocuSign...');

      const { error } = await supabase
        .from('docusign_configurations')
        .update({ is_active: false })
        .eq('id', config.id);

      if (error) {
        console.error('❌ [CONFIG] Erro ao remover configuração:', error);
        throw error;
      }

      console.log('✅ [CONFIG] Configuração removida com sucesso');
      setConfig(null);
      setIsConfigured(false);

      toast({
        title: "Configuração removida",
        description: "A configuração do DocuSign foi removida.",
      });
    } catch (error: any) {
      console.error('💥 [CONFIG] Erro ao remover configuração:', error);
      toast({
        title: "Erro ao remover configuração",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchConfig();
    }
  }, [user?.id]);

  return {
    config,
    isConfigured,
    loading,
    saveConfig,
    testConnection,
    deleteConfig,
    refetch: fetchConfig
  };
};
