import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, ExternalLink, CheckCircle2, Award } from 'lucide-react';
import { useAutentique } from '@/hooks/useAutentique';
import ThankYouMessage from './ThankYouMessage';
import { Confetti } from '@/components/ui/confetti';

interface AutentiqueSignatureProps {
  contractData: any;
  contractorData: any;
  onSignatureComplete: (signatureData: string) => void;
  onCancel: () => void;
}

const AutentiqueSignature: React.FC<AutentiqueSignatureProps> = ({
  contractData,
  contractorData,
  onSignatureComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const { loading, sendContractForSigning } = useAutentique();
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [signatureProcessed, setSignatureProcessed] = useState(false);
  const [autentiqueData, setAutentiqueData] = useState<any>(null);

  const handleSignatureSuccess = (autentiqueResult: any) => {
    console.log('🎉 Assinatura Autentique iniciada, finalizando processo...');
    
    // Armazenar os dados da Autentique
    setAutentiqueData(autentiqueResult);
    setSignatureProcessed(true);
    
    // Mostrar confetes
    setShowConfetti(true);
    
    // Mostrar mensagem de agradecimento após um pequeno delay
    setTimeout(() => {
      setShowThankYou(true);
    }, 500);

    // Criar dados da assinatura para compatibilidade
    const signatureData = JSON.stringify({
      type: 'autentique',
      documentId: autentiqueResult.documentId,
      publicId: autentiqueResult.publicId,
      signingUrl: autentiqueResult.signingUrl,
      signer: autentiqueResult.signer,
      timestamp: autentiqueResult.createdAt,
      contractId: contractData.id,
      contractorName: contractorData?.name || 'Contratante'
    });

    // Aguardar a exibição da mensagem antes de chamar o callback
    setTimeout(() => {
      console.log('✅ Chamando callback de conclusão da assinatura Autentique...');
      onSignatureComplete(signatureData);
    }, 4000);
  };

  const handleContinueAfterThankYou = () => {
    console.log('👋 Usuário confirmou no ThankYou Autentique, finalizando processo...');
    setShowThankYou(false);
    setShowConfetti(false);
    // O callback já foi chamado em handleSignatureSuccess
  };

  const handleSendToAutentique = async () => {
    if (!contractorData?.email) {
      toast({
        title: "Email obrigatório",
        description: "O email do contratante é obrigatório para enviar via Autentique.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Iniciando processo de assinatura via Autentique...");
      
      const result = await sendContractForSigning(contractData, contractorData);
      
      console.log("Documento enviado para Autentique:", result);
      
      handleSignatureSuccess(result);
    } catch (error: any) {
      console.error("Erro na assinatura Autentique:", error);
      // O toast de erro já é mostrado pelo hook
    }
  };

  // Se o processo foi iniciado, mostrar apenas os elementos de conclusão
  if (signatureProcessed) {
    return (
      <>
        {/* Confetti Effect */}
        <Confetti trigger={showConfetti} />
        
        {/* Preview da assinatura antes do ThankYou */}
        {autentiqueData && !showThankYou && (
          <div className="text-center space-y-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Award className="h-8 w-8 text-green-600" />
                <h2 className="text-2xl font-bold text-green-600">Enviado para Autentique!</h2>
              </div>
              
              <div className="bg-white border rounded-lg p-4 text-left mb-4">
                <h3 className="font-bold text-gray-800 mb-3">Detalhes do Envio:</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Documento:</strong> {autentiqueData.documentName}</p>
                  <p><strong>Assinante:</strong> {autentiqueData.signer.name}</p>
                  <p><strong>Email:</strong> {autentiqueData.signer.email}</p>
                  <p><strong>ID do Documento:</strong> {autentiqueData.publicId}</p>
                  <p><strong>Status:</strong> {autentiqueData.status}</p>
                </div>
              </div>

              {autentiqueData.signingUrl && (
                <Button 
                  onClick={() => window.open(autentiqueData.signingUrl, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white mb-4"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Link de Assinatura
                </Button>
              )}
              
              <p className="text-sm text-green-700">
                O contrato foi enviado para {autentiqueData.signer.email} via Autentique e está aguardando assinatura.
              </p>
            </div>
          </div>
        )}
        
        {/* Thank You Message */}
        <ThankYouMessage 
          isVisible={showThankYou}
          contractorName={contractorData?.responsible_name || contractorData?.name}
          onContinue={handleContinueAfterThankYou}
        />
      </>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Assinatura via Autentique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            O contrato será enviado para <strong>{contractorData?.email}</strong> através da plataforma Autentique 
            para assinatura digital com validade jurídica.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-700">Assinatura digital com validade jurídica</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-700">Notificação automática por email</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-700">Rastreamento do status de assinatura</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-700">Certificado de autenticidade</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            Documento a ser Enviado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Contrato #{contractData.contract_number} - {contractData.company?.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Será gerado um PDF do contrato e enviado para {contractorData?.email} via Autentique.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleSendToAutentique}
          disabled={loading || !contractorData?.email}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando via Autentique...
            </>
          ) : (
            <>
              <Award className="h-4 w-4 mr-2" />
              Enviar via Autentique
            </>
          )}
        </Button>
        
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Assinatura digital via plataforma Autentique</p>
        <p>• Validade jurídica conforme MP 2.200-2/2001</p>
        <p>• Certificado de autenticidade incluso</p>
        <p>• Notificação automática por email</p>
      </div>
    </div>
  );
};

export default AutentiqueSignature;