import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ContractPreview from '@/components/ContractPreview';
import { ContractProvider } from '@/context/ContractContext';
import DocuSignApiConfig from '@/components/DocuSignApiConfig';
import { useDocuSignRealIntegration } from '@/hooks/useDocuSignRealIntegration';
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
  ArrowLeft,
  X
} from 'lucide-react';

interface UnifiedDocuSignIntegrationProps {
  contractData: any;
  contractorData: any;
  companyData?: any;
  onSignatureComplete?: (envelopeId: string, status: string) => void;
  onCancel?: () => void;
  isModal?: boolean;
  onClose?: () => void;
}

const UnifiedDocuSignIntegration: React.FC<UnifiedDocuSignIntegrationProps> = ({
  contractData,
  contractorData,
  companyData,
  onSignatureComplete,
  onCancel,
  isModal = false,
  onClose
}) => {
  const { toast } = useToast();
  const { loading, error, createRealEnvelope, isConfigured } = useDocuSignRealIntegration();
  const [envelope, setEnvelope] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [signingCompleted, setSigningCompleted] = useState(false);
  const contractPreviewRef = useRef<HTMLDivElement>(null);

  // Normalizar contractorData - pode vir como array ou objeto único
  const contractorsArray = Array.isArray(contractorData) ? contractorData : [contractorData];
  
  // Criar objeto editingContract compatível com o ContractContext
  const editingContract = {
    id: contractData?.id,
    contractNumber: contractData?.contract_number || '',
    contractors: contractorsArray,
    contractValue: contractData?.monthly_value || 0,
    paymentMethod: contractData?.payment_method || '',
    startDate: contractData?.start_date || '',
    renewalDate: contractData?.renewal_date || '',
    planType: contractData?.plan_type || '',
    status: contractData?.status || 'Ativo'
  };

  useEffect(() => {
    if (isModal && contractData) {
      console.log('📋 Unified DocuSign Modal aberto com dados:', contractData);
    }
  }, [isModal, contractData]);

  const handleSendContract = async () => {
    if (!isConfigured) {
      setShowConfig(true);
      return;
    }

    if (contractorsArray.length === 0 || !contractorsArray[0]?.email) {
      toast({
        title: "Erro",
        description: "Email do contratante é obrigatório para envio via DocuSign",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log("📝 Enviando contrato via DocuSign:", contractData.contract_number);
      
      const result = await createRealEnvelope(
        contractData,
        contractorsArray[0],
        companyData
      );

      if (result?.envelopeId) {
        setEnvelope(result);
        setShowIframe(true);
        
        toast({
          title: "Envelope criado com sucesso!",
          description: `ID: ${result.envelopeId}`,
        });

        // Callback opcional
        onSignatureComplete?.(result.envelopeId, result.status || 'sent');
      }

    } catch (error) {
      console.error('Erro ao enviar contrato:', error);
      toast({
        title: "Erro ao enviar contrato",
        description: "Falha ao criar envelope no DocuSign",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSigning = () => {
    console.log('🚀 Iniciando processo de assinatura');
    setIsLoading(true);
    setShowIframe(true);
    
    // Simular carregamento
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleSigningComplete = () => {
    setSigningCompleted(true);
    setShowIframe(false);
    
    toast({
      title: "Assinatura concluída!",
      description: "O documento foi assinado com sucesso via DocuSign",
    });
    
    setTimeout(() => {
      onClose?.();
      onCancel?.();
    }, 2000);
  };

  const renderContent = () => (
    <div className="space-y-6">
      {!isConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Para usar a assinatura digital via DocuSign, é necessário configurar suas credenciais de API.
          </AlertDescription>
        </Alert>
      )}

      {showConfig && (
        <DocuSignApiConfig 
          onConfigured={() => {
            setShowConfig(false);
            toast({
              title: "Configuração salva!",
              description: "DocuSign configurado! Agora você pode enviar contratos para assinatura.",
            });
          }} 
        />
      )}

      {!showConfig && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileSignature className="h-5 w-5" />
                  Informações do Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Número:</span>
                  <p className="font-medium">{contractData?.contract_number}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Valor Mensal:</span>
                  <p className="font-medium">R$ {parseFloat(contractData?.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Plano:</span>
                  <Badge variant="outline">{contractData?.plan_type}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Contratante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Nome:</span>
                  <p className="font-medium">{contractorsArray[0]?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Email:</span>
                  <p className="font-medium">{contractorsArray[0]?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">CPF/CNPJ:</span>
                  <p className="font-medium">{contractorsArray[0]?.cpf || contractorsArray[0]?.cnpj || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {envelope && !showIframe && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Envelope criado com sucesso!</strong><br />
                ID: {envelope.envelopeId}<br />
                Status: {envelope.status || 'Enviado'}
              </AlertDescription>
            </Alert>
          )}

          {signingCompleted && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Assinatura concluída com sucesso!</strong><br />
                O documento foi assinado via DocuSign.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            {!envelope && (
              <>
                <Button 
                  onClick={() => setShowPreview(!showPreview)}
                  variant="outline"
                  disabled={loading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Ocultar' : 'Visualizar'} Contrato
                </Button>

                {isConfigured ? (
                  <Button 
                    onClick={handleSendContract}
                    disabled={loading || isLoading}
                  >
                    {(loading || isLoading) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar via DocuSign
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => setShowConfig(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar DocuSign
                  </Button>
                )}
              </>
            )}

            {envelope && !showIframe && (
              <Button onClick={handleStartSigning}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir para Assinatura
              </Button>
            )}
          </div>

          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Prévia do Contrato</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={contractPreviewRef}>
                  <ContractProvider editingContract={editingContract}>
                    <ContractPreview />
                  </ContractProvider>
                </div>
              </CardContent>
            </Card>
          )}

          {showIframe && envelope && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Assinatura DocuSign</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowIframe(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Carregando DocuSign...</span>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <iframe
                      src={envelope.signingUrl || '#'}
                      width="100%"
                      height="600"
                      title="DocuSign Signing"
                      onLoad={() => setIsLoading(false)}
                    />
                  </div>
                )}
                
                <div className="mt-4 flex justify-center">
                  <Button onClick={handleSigningComplete}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Concluído
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (isModal) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Assinatura DocuSign - {contractData?.contract_number}
            </DialogTitle>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Assinatura via DocuSign
        </CardTitle>
        <Badge variant="outline">
          Contrato: {contractData?.contract_number}
        </Badge>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default UnifiedDocuSignIntegration;