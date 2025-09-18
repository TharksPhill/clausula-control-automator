
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import ContractPreview from '@/components/ContractPreview';
import { ContractProvider } from '@/context/ContractContext';
import SignWellApiConfig from '@/components/SignWellApiConfig';
import { useSignWellIntegration } from '@/hooks/useSignWellIntegration';
import { 
  FileSignature, 
  Shield, 
  ExternalLink, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Settings,
  Send,
  RefreshCw
} from 'lucide-react';

interface SignWellIntegrationProps {
  contractData: any;
  contractorData: any;
  onSignatureComplete?: (envelopeId: string, status: string) => void;
  onCancel?: () => void;
}

interface EnvelopeData {
  id: string;
  status: string;
  signingUrl?: string;
  name?: string;
  created?: string;
  [key: string]: any;
}

const SignWellIntegration: React.FC<SignWellIntegrationProps> = ({
  contractData,
  contractorData,
  onSignatureComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const { loading, error, testApiKey, createEnvelope, getEnvelopeStatus, isConfigured } = useSignWellIntegration();
  const [envelope, setEnvelope] = useState<EnvelopeData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Normalizar contractorData - pode vir como array ou objeto único
  const contractorsArray = Array.isArray(contractorData) ? contractorData : [contractorData];
  const contractor = contractorsArray[0];
  
  // Criar objeto editingContract compatível com o ContractContext
  const editingContract = {
    id: contractData?.id,
    contractNumber: contractData?.contract_number || '',
    employeeCount: contractData?.employee_count || '',
    cnpjCount: contractData?.cnpj_count || '',
    monthlyValue: contractData?.monthly_value || '',
    trialDays: contractData?.trial_days || '',
    startDate: contractData?.start_date || '',
    renewalDate: contractData?.renewal_date || '',
    paymentStartDate: contractData?.payment_start_date || '',
    paymentDay: contractData?.payment_day || '',
    planType: contractData?.plan_type || 'mensal',
    semestralDiscount: contractData?.semestral_discount || '0',
    anualDiscount: contractData?.anual_discount || '0',
    contractors: contractorsArray.filter(contractor => contractor).map(contractor => ({
      id: contractor?.id,
      name: contractor?.name || '',
      cnpj: contractor?.cnpj || '',
      email: contractor?.email || '',
      address: contractor?.address || '',
      city: contractor?.city || '',
      state: contractor?.state || '',
      responsibleName: contractor?.responsible_name || '',
      responsibleCpf: contractor?.responsible_cpf || '',
      responsibleRg: contractor?.responsible_rg || ''
    })),
    companyData: {
      name: contractData?.company?.name || "",
      cnpj: contractData?.company?.cnpj || "",
      address: contractData?.company?.address || "", 
      city: contractData?.company?.city || "",
      state: contractData?.company?.state || "",
      responsibleName: contractData?.company?.responsible_name || "",
      phone: contractData?.company?.phone || "",
      email: contractData?.company?.email || "",
      website: contractData?.company?.website || "",
      logo: contractData?.company?.logo || ""
    }
  };

  const handleTestApiKey = async () => {
    try {
      setTestResult(null);
      console.log('🧪 [SignWellIntegration] Testando API Key...');
      
      const result = await testApiKey();
      console.log('📋 [SignWellIntegration] Resultado do teste:', result);
      
      setTestResult({
        success: result,
        timestamp: new Date()
      });
      
    } catch (error: any) {
      console.error('❌ [SignWellIntegration] Erro no teste:', error);
      setTestResult({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  };

  const handleCreateEnvelope = async () => {
    try {
      console.log('📧 [SignWellIntegration] Criando envelope...');
      
      const envelopeData = await createEnvelope(
        contractData, 
        contractor, 
        editingContract.companyData
      );
      
      if (envelopeData) {
        setEnvelope(envelopeData);
        
        toast({
          title: "Envelope Criado!",
          description: `Documento enviado para assinatura via SignWell - ID: ${envelopeData.id}`,
        });
      }
      
    } catch (error: any) {
      console.error("❌ [SignWellIntegration] Erro ao criar envelope:", error);
      // O erro já é mostrado pelo hook useSignWellIntegration
    }
  };

  const handleCheckStatus = async () => {
    if (!envelope?.id) return;
    
    try {
      setStatusLoading(true);
      console.log('🔍 [SignWellIntegration] Verificando status do envelope...');
      
      const status = await getEnvelopeStatus(envelope.id);
      
      if (status) {
        setEnvelope(prev => prev ? { ...prev, ...status } : null);
        
        if (status.status === 'completed') {
          toast({
            title: "Assinatura Concluída!",
            description: "O contrato foi assinado com sucesso!",
          });
          
          onSignatureComplete?.(envelope.id, status.status);
        } else {
          toast({
            title: "Status Atualizado",
            description: `Status atual: ${status.status}`,
          });
        }
      }
      
    } catch (error: any) {
      console.error("❌ [SignWellIntegration] Erro ao verificar status:", error);
      // O erro já é mostrado pelo hook useSignWellIntegration
    } finally {
      setStatusLoading(false);
    }
  };

  const handleOpenSigning = () => {
    if (envelope?.signingUrl) {
      const signingWindow = window.open(
        envelope.signingUrl, 
        'SignWellSigning',
        'width=1024,height=768,scrollbars=yes,resizable=yes'
      );

      if (!signingWindow) {
        toast({
          title: "Pop-up bloqueado",
          description: "Permita pop-ups para este site e tente novamente",
          variant: "destructive",
        });
      }
    }
  };

  const handleConfigComplete = () => {
    setShowConfig(false);
    toast({
      title: "Configuração concluída",
      description: "SignWell configurado! Agora você pode testar a API.",
    });
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-600" />
              Configuração Necessária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para usar a assinatura digital via SignWell, é necessário configurar sua API Key.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3 mt-4">
              <Button onClick={() => setShowConfig(true)} className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Configurar SignWell
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>

        {showConfig && (
          <SignWellApiConfig />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-purple-600" />
            Assinatura Digital via SignWell
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">Assinatura Simples e Eficiente</h4>
                <p className="text-sm text-purple-700 mt-1">
                  O SignWell oferece um processo de assinatura digital rápido e intuitivo, 
                  com validade jurídica completa e interface amigável.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Contrato</p>
              <p className="font-semibold">#{contractData?.contract_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Contratante</p>
              <p className="font-semibold">{contractor?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Responsável</p>
              <p className="font-semibold">{contractor?.responsible_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">E-mail</p>
              <p className="font-semibold">{contractor?.email || 'Não informado'}</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {testResult && (
            <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResult.success ? 'API Key Válida!' : 'Erro no Teste da API Key'}
                  </p>
                  <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.success 
                      ? 'A API Key está funcionando corretamente.' 
                      : `Erro: ${testResult.error}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Testado em: {testResult.timestamp.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </Alert>
          )}

          {envelope && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Status do Envelope</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    <Clock className="h-3 w-3 mr-1" />
                    {envelope.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCheckStatus}
                    disabled={statusLoading}
                  >
                    {statusLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>ID: {envelope.id}</div>
                {envelope.name && <div>Nome: {envelope.name}</div>}
                {envelope.created && (
                  <div>Criado: {new Date(envelope.created).toLocaleString('pt-BR')}</div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Ocultar Pré-visualização' : 'Visualizar Contrato'}
            </Button>
          </div>

          {showPreview && (
            <div className="border rounded-lg bg-white">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800">Pré-visualização do Contrato</h3>
                <p className="text-sm text-gray-600">Este é o conteúdo que será enviado para assinatura</p>
              </div>
              <div className="p-6">
                <ContractProvider editingContract={editingContract}>
                  <ContractPreview />
                </ContractProvider>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleTestApiKey}
          disabled={loading}
          variant="outline"
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-2" />
              Testar API Key
            </>
          )}
        </Button>

        {!envelope ? (
          <Button
            onClick={handleCreateEnvelope}
            disabled={loading || !contractor?.email}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando envelope...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar para Assinatura
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleOpenSigning}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir SignWell para Assinar
          </Button>
        )}
        
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• O documento será enviado via e-mail para o signatário</p>
        <p>• A assinatura pode ser feita em qualquer dispositivo</p>
        <p>• O status pode ser verificado a qualquer momento</p>
        <p>• Você receberá uma notificação quando concluído</p>
      </div>
    </div>
  );
};

export default SignWellIntegration;
