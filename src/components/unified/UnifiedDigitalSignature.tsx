import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, FileText, CheckCircle, ArrowLeft } from 'lucide-react';
import ThankYouMessage from '../ThankYouMessage';
import { Confetti } from '@/components/ui/confetti';
import { useDigitalSignature } from '@/hooks/useDigitalSignature';

interface UnifiedDigitalSignatureProps {
  contractData: any;
  contractorData?: any;
  onSignatureComplete: (signatureData: string, method?: 'certificate' | 'docusign') => void;
  onCancel: () => void;
  isAdmin?: boolean;
  allowMethodSelection?: boolean;
}

const UnifiedDigitalSignature: React.FC<UnifiedDigitalSignatureProps> = ({
  contractData,
  contractorData,
  onSignatureComplete,
  onCancel,
  isAdmin = false,
  allowMethodSelection = false
}) => {
  const { toast } = useToast();
  const { loading, validateCertificate: validateCert, signPdf } = useDigitalSignature();
  
  const [selectedMethod, setSelectedMethod] = useState<'certificate' | 'docusign' | null>(
    allowMethodSelection ? null : 'certificate'
  );
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [certificateInfo, setCertificateInfo] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [signatureProcessed, setSignatureProcessed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signatureStep, setSignatureStep] = useState<'method' | 'signing' | 'complete'>('method');

  const handleCertificateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.p12') && !file.name.toLowerCase().endsWith('.pfx')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo .p12 ou .pfx",
        variant: "destructive",
      });
      return;
    }

    setCertificateFile(file);
    
    // Simular extração de informações do certificado
    const mockCertInfo = {
      subject: isAdmin 
        ? "CN=ADMINISTRADOR CERTIFICADO:12345678901, OU=Certificado Digital, O=AC CERTISIGN, C=BR"
        : `CN=${contractorData?.name || 'TITULAR CERTIFICADO'}:${Math.random().toString().substring(2, 13)}, OU=Certificado Digital, O=AC CERTISIGN, C=BR`,
      issuer: "AC CERTISIGN",
      validFrom: new Date().toLocaleDateString('pt-BR'),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      serialNumber: Math.random().toString(36).substr(2, 9).toUpperCase()
    };
    
    setCertificateInfo(mockCertInfo);
    
    toast({
      title: "Certificado carregado",
      description: "Informações extraídas com sucesso",
    });
  };

  const generateDigitalSignature = async () => {
    if (!certificateFile || !password) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um certificado e digite a senha",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setSignatureStep('signing');

    try {
      // Simular processo de assinatura
      await new Promise(resolve => setTimeout(resolve, 2000));

      const digitalSignature = {
        certificate: certificateInfo,
        contractId: contractData.id,
        contractNumber: contractData.contract_number,
        signerName: isAdmin ? 'Administrador' : (contractorData?.name || 'Contratante'),
        signerCpf: isAdmin ? '12345678901' : (contractorData?.cpf || ''),
        timestamp: new Date().toISOString(),
        algorithm: 'SHA256withRSA',
        signedBy: isAdmin ? 'admin' : 'contractor'
      };

      const signatureData = JSON.stringify(digitalSignature);
      
      // Mostrar confetes e mensagem de sucesso
      setShowConfetti(true);
      setSignatureProcessed(true);
      setSignatureStep('complete');
      
      setTimeout(() => {
        setShowThankYou(true);
        setTimeout(() => {
          onSignatureComplete(signatureData, 'certificate');
        }, 1500);
      }, 500);

      toast({
        title: "Assinatura realizada com sucesso!",
        description: "O contrato foi assinado digitalmente",
      });

    } catch (error) {
      console.error('Erro na assinatura:', error);
      toast({
        title: "Erro na assinatura",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (showThankYou) {
    return <ThankYouMessage isVisible={true} onContinue={() => onSignatureComplete('', 'certificate')} />;
  }

  if (allowMethodSelection && !selectedMethod) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Selecione o Método de Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2"
              onClick={() => setSelectedMethod('certificate')}
            >
              <Shield className="h-8 w-8" />
              <span className="font-medium">Certificado Digital</span>
              <span className="text-sm text-muted-foreground">Assinatura com certificado A1/A3</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2"
              onClick={() => setSelectedMethod('docusign')}
            >
              <FileText className="h-8 w-8" />
              <span className="font-medium">DocuSign</span>
              <span className="text-sm text-muted-foreground">Assinatura eletrônica</span>
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti trigger={showConfetti} />}
      
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {isAdmin ? 'Assinatura Digital - Administrador' : 'Assinatura Digital'}
          </CardTitle>
          {contractData && (
            <Badge variant="outline">
              Contrato: {contractData.contract_number}
            </Badge>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {signatureStep === 'signing' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Processando assinatura digital. Aguarde...
              </AlertDescription>
            </Alert>
          )}

          {signatureStep === 'complete' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Assinatura digital realizada com sucesso!
              </AlertDescription>
            </Alert>
          )}

          {!signatureProcessed && (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="certificate">Certificado Digital (.p12 ou .pfx)</Label>
                  <Input
                    id="certificate"
                    type="file"
                    accept=".p12,.pfx"
                    onChange={handleCertificateUpload}
                    disabled={isProcessing}
                  />
                </div>

                {certificateInfo && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Certificado carregado:</strong><br />
                      Titular: {certificateInfo.subject.split(',')[0].replace('CN=', '')}<br />
                      Válido até: {certificateInfo.validTo}
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="password">Senha do Certificado</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha do certificado"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                
                <Button 
                  onClick={generateDigitalSignature} 
                  disabled={!certificateFile || !password || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assinando...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Assinar Digitalmente
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedDigitalSignature;