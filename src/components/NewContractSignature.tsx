
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDocuSignRealIntegration } from '@/hooks/useDocuSignRealIntegration';
import UnifiedDocuSignIntegration from '@/components/unified/UnifiedDocuSignIntegration';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileSignature, 
  Loader2, 
  CheckCircle, 
  Mail,
  ArrowLeft,
  Shield,
  AlertTriangle
} from 'lucide-react';

interface NewContractSignatureProps {
  contractData: any;
  contractorData: any;
  onSignatureComplete: () => void;
  onCancel: () => void;
}

const NewContractSignature: React.FC<NewContractSignatureProps> = ({
  contractData,
  contractorData,
  onSignatureComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const { loading, error, createRealEnvelope } = useDocuSignRealIntegration();
  const [envelope, setEnvelope] = useState<any>(null);
  const [step, setStep] = useState<'confirm' | 'processing' | 'completed'>('confirm');
  const [showDocuSignModal, setShowDocuSignModal] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);

  // Normalizar dados do contratante
  const contractor = Array.isArray(contractorData) ? contractorData[0] : contractorData;

  useEffect(() => {
    const prepareCompanyData = async () => {
      let companyInfo = null;

      if (contractData?.company && contractData.company.name) {
        companyInfo = contractData.company;
      } else if (contractData?.company_id) {
        console.log('Buscando dados da empresa do banco...');
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', contractData.company_id)
          .single();
        if (error) {
          console.error("Erro ao buscar dados da empresa:", error);
        } else {
          companyInfo = data;
        }
      }
      
      if (companyInfo) {
        console.log('Dados da empresa preparados:', companyInfo);
        setCompanyData(companyInfo);
      } else {
        console.error('Não foi possível carregar os dados da empresa.');
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados da empresa para a assinatura.",
          variant: "destructive"
        });
      }
    };

    if (contractData) {
      prepareCompanyData();
    }
  }, [contractData, toast]);

  const handleCreateEnvelope = async () => {
    console.log('Iniciando criação de envelope DocuSign de PRODUÇÃO...');
    
    setStep('processing');

    try {
      if (!companyData) {
          toast({
              title: "Dados da empresa ausentes",
              description: "Aguardando informações da empresa. Tente novamente em alguns instantes.",
              variant: "destructive",
          });
          setStep('confirm');
          return;
      }

      const result = await createRealEnvelope(contractData, contractor, companyData);
      
      if (result) {
        console.log('Envelope de PRODUÇÃO criado:', result);
        setEnvelope(result);
        setStep('completed');
        
        toast({
          title: "Envelope de Produção Criado!",
          description: `O envelope foi criado no ambiente de PRODUÇÃO. Este documento é legalmente válido.`,
        });
        
        setShowDocuSignModal(true);
      } else {
        setStep('confirm');
      }
    } catch (err) {
      console.error('Erro:', err);
      setStep('confirm');
    }
  };

  const handleSigningComplete = () => {
    console.log('🎉 Assinatura de PRODUÇÃO concluída no modal');
    setShowDocuSignModal(false);
    
    toast({
      title: "Assinatura de Produção Concluída!",
      description: "O contrato foi assinado com sucesso via DocuSign em ambiente de PRODUÇÃO",
    });
    
    setTimeout(() => {
      onSignatureComplete();
    }, 1000);
  };

  if (step === 'processing' || (!companyData && !error)) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <h3 className="text-xl font-semibold">
              {!companyData ? 'Carregando dados...' : 'Criando Envelope DocuSign de PRODUÇÃO...'}
            </h3>
            <p className="text-gray-600">
              {!companyData ? 'Preparando informações da empresa' : 'Preparando o contrato oficial para assinatura digital'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'completed' && envelope) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Envelope DocuSign de PRODUÇÃO Criado!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-green-200 bg-green-50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              <strong>Documento Oficial:</strong> Este envelope foi criado no ambiente de PRODUÇÃO do DocuSign. 
              Todas as assinaturas serão legalmente válidas e vinculantes.
            </AlertDescription>
          </Alert>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              {contractor?.email && contractor.email !== 'demo@example.com' ? (
                `O envelope oficial foi criado com sucesso! O contratante receberá um email oficial em ${contractor.email} com o link para assinatura digital.`
              ) : (
                'O envelope foi criado, mas não foi possível enviar email para o contratante. Verifique se o email está configurado.'
              )}
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Detalhes do Envelope Oficial:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ID do Envelope:</span>
                <span className="font-mono">{envelope.envelopeId}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-green-600 font-semibold">{envelope.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Ambiente:</span>
                <span className="text-green-600 font-semibold">
                  {envelope.environment === 'production' ? '✅ PRODUÇÃO' : '⚠️ DEMO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Contrato:</span>
                <span>#{contractData.contract_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Email do Contratante:</span>
                <span className={contractor?.email ? 'text-green-600' : 'text-red-600'}>
                  {contractor?.email || 'Não configurado'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={onSignatureComplete} className="flex-1">
              Concluir
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-blue-600" />
            Assinatura Digital DocuSign - PRODUÇÃO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert className="border-green-200 bg-green-50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              <strong>Ambiente de Produção:</strong> Você está utilizando a API real do DocuSign. 
              Este documento terá validade jurídica completa e será legalmente vinculante.
            </AlertDescription>
          </Alert>

          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              <strong>Importante:</strong> Este processo criará um documento oficial. Certifique-se de que 
              todos os dados estão corretos antes de prosseguir. Podem haver custos associados 
              por documento/assinatura na sua conta DocuSign.
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Como funciona a assinatura oficial:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Um envelope oficial será criado no DocuSign de produção</li>
              <li>2. Emails oficiais serão enviados para todos os signatários</li>
              <li>3. As assinaturas digitais terão validade jurídica completa</li>
              <li>4. O documento final será arquivado no DocuSign</li>
              <li>5. Todas as partes receberão cópias autenticadas</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold mb-2">Contrato Oficial</h5>
              <div className="text-sm space-y-1">
                <div>Número: #{contractData.contract_number}</div>
                <div>Valor: R$ {contractData.monthly_value}</div>
                <div>Plano: {contractData.plan_type}</div>
                <div className="text-green-600 font-semibold">Status: Documento Oficial</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold mb-2">Contratante</h5>
              <div className="text-sm space-y-1">
                <div>{contractor?.name}</div>
                <div>{contractor?.responsible_name}</div>
                <div className={contractor?.email ? 'text-green-600' : 'text-red-600'}>
                  {contractor?.email || 'Email não configurado'}
                </div>
                {contractor?.email && (
                  <div className="text-xs text-blue-600">
                    ✅ Receberá email oficial do DocuSign
                  </div>
                )}
              </div>
            </div>
          </div>

          {(!contractor?.email || contractor.email === 'demo@example.com') && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Atenção:</strong> O email do contratante não está configurado ou é um email de demonstração. 
                O envelope será criado mas não será possível enviar o convite oficial de assinatura por email.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button 
              onClick={handleCreateEnvelope}
              disabled={loading || !companyData}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando Documento Oficial...
                </>
              ) : (
                <>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Criar Documento Oficial DocuSign
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal do DocuSign */}
      <UnifiedDocuSignIntegration
        isModal={true}
        onClose={() => setShowDocuSignModal(false)}
        contractData={contractData}
        contractorData={contractor}
        companyData={companyData}
        onSignatureComplete={handleSigningComplete}
      />
    </>
  );
};

export default NewContractSignature;
