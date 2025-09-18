
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useSignWellIntegration } from '@/hooks/useSignWellIntegration';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileSignature, 
  Loader2, 
  CheckCircle, 
  Mail,
  ArrowLeft,
  Shield,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface SignWellContractSignatureProps {
  contractData: any;
  contractorData: any;
  onSignatureComplete: () => void;
  onCancel: () => void;
}

const SignWellContractSignature: React.FC<SignWellContractSignatureProps> = ({
  contractData,
  contractorData,
  onSignatureComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const { loading, error, createEnvelope, isConfigured } = useSignWellIntegration();
  const [envelope, setEnvelope] = useState<any>(null);
  const [step, setStep] = useState<'confirm' | 'processing' | 'completed'>('confirm');
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

  if (!isConfigured) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-6 w-6" />
            SignWell Não Configurado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Para usar o SignWell, você precisa configurar sua API Key nas integrações do sistema.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCreateEnvelope = async () => {
    console.log('Iniciando criação de envelope SignWell...');
    
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

      const result = await createEnvelope(contractData, contractor, companyData);
      
      if (result) {
        console.log('Envelope SignWell criado:', result);
        setEnvelope(result);
        setStep('completed');
        
        toast({
          title: "Envelope SignWell Criado!",
          description: `O envelope foi criado com sucesso. O documento está pronto para assinatura.`,
        });
      } else {
        setStep('confirm');
      }
    } catch (err) {
      console.error('Erro:', err);
      setStep('confirm');
    }
  };

  const handleSigningComplete = () => {
    console.log('🎉 Assinatura SignWell concluída');
    
    toast({
      title: "Assinatura SignWell Concluída!",
      description: "O contrato foi assinado com sucesso via SignWell",
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
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-600" />
            <h3 className="text-xl font-semibold">
              {!companyData ? 'Carregando dados...' : 'Criando Envelope SignWell...'}
            </h3>
            <p className="text-gray-600">
              {!companyData ? 'Preparando informações da empresa' : 'Preparando o contrato para assinatura digital no SignWell'}
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
            Envelope SignWell Criado!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-green-200 bg-green-50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              <strong>Documento Criado:</strong> O envelope foi criado com sucesso no SignWell. 
              O documento está pronto para assinatura digital.
            </AlertDescription>
          </Alert>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              {contractor?.email && contractor.email !== 'demo@example.com' ? (
                `O envelope foi criado com sucesso! O contratante receberá um email em ${contractor.email} com o link para assinatura digital.`
              ) : (
                'O envelope foi criado, mas não foi possível enviar email para o contratante. Verifique se o email está configurado.'
              )}
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Detalhes do Envelope SignWell:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ID do Envelope:</span>
                <span className="font-mono">{envelope.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-green-600 font-semibold">{envelope.status}</span>
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
              {envelope.signingUrl && (
                <div className="flex justify-between">
                  <span>Link de Assinatura:</span>
                  <a 
                    href={envelope.signingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Abrir <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            {envelope.signingUrl && (
              <Button 
                onClick={() => window.open(envelope.signingUrl, '_blank')}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir SignWell para Assinar
              </Button>
            )}
            
            <Button variant="outline" onClick={onSignatureComplete} className="flex-1">
              Concluir
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-6 w-6 text-purple-600" />
          Assinatura Digital SignWell
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert className="border-purple-200 bg-purple-50">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-purple-800">
            <strong>SignWell:</strong> Você está utilizando o SignWell para assinatura digital. 
            Este documento terá validade jurídica e será processado de forma rápida e segura.
          </AlertDescription>
        </Alert>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Como funciona a assinatura SignWell:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Um envelope será criado no SignWell</li>
            <li>2. Emails serão enviados para todos os signatários</li>
            <li>3. As assinaturas digitais terão validade jurídica</li>
            <li>4. O documento final será arquivado no SignWell</li>
            <li>5. Todas as partes receberão cópias do documento</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-semibold mb-2">Contrato</h5>
            <div className="text-sm space-y-1">
              <div>Número: #{contractData.contract_number}</div>
              <div>Valor: R$ {contractData.monthly_value}</div>
              <div>Plano: {contractData.plan_type}</div>
              <div className="text-purple-600 font-semibold">Status: Documento SignWell</div>
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
                <div className="text-xs text-purple-600">
                  ✅ Receberá email do SignWell
                </div>
              )}
            </div>
          </div>
        </div>

        {(!contractor?.email || contractor.email === 'demo@example.com') && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Atenção:</strong> O email do contratante não está configurado ou é um email de demonstração. 
              O envelope será criado mas não será possível enviar o convite de assinatura por email.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button 
            onClick={handleCreateEnvelope}
            disabled={loading || !companyData}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando Envelope SignWell...
              </>
            ) : (
              <>
                <FileSignature className="h-4 w-4 mr-2" />
                Criar Envelope SignWell
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
  );
};

export default SignWellContractSignature;
