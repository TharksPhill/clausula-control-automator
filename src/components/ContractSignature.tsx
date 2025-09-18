
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, ArrowLeft, CheckCircle2, Award, PenTool } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import UnifiedDigitalSignature from './unified/UnifiedDigitalSignature';
import AutentiqueSignature from './AutentiqueSignature';
import SignatureMethodSelector from './SignatureMethodSelector';
import ThankYouMessage from './ThankYouMessage';
import { Confetti } from '@/components/ui/confetti';
import { Badge } from '@/components/ui/badge';

interface ContractSignatureProps {
  contractData: any;
  contractorData: any;
  currentProfile: any;
  onSignatureComplete: () => void;
  onCancel: () => void;
}

const ContractSignature: React.FC<ContractSignatureProps> = ({
  contractData,
  contractorData,
  currentProfile,
  onSignatureComplete,
  onCancel
}) => {
  console.log('🎬 ContractSignature RENDERIZANDO com dados:', {
    contractData: contractData?.contract_number,
    contractorData: contractorData?.name,
    currentProfile: currentProfile?.email
  });

  const { toast } = useToast();
  const [signatureMethod, setSignatureMethod] = useState<'choose' | 'digital' | 'autentique'>('choose');
  const [signing, setSigning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [signatureCompleted, setSignatureCompleted] = useState(false);

  console.log('📋 Estado atual do ContractSignature:', {
    signatureMethod,
    signing,
    signatureCompleted,
    showThankYou
  });

  const handleSignatureSuccess = () => {
    setSignatureCompleted(true);
    setShowConfetti(true);
    setShowThankYou(true);
  };

  const handleContinueAfterThankYou = () => {
    setShowThankYou(false);
    setShowConfetti(false);
    onSignatureComplete();
  };

  const handleDigitalSignatureComplete = async (signatureData: string) => {
    try {
      setSigning(true);

      if (!contractData?.id) {
        throw new Error("ID do contrato não encontrado");
      }

      const { data: existingSignature, error: checkError } = await supabase
        .from("signed_contracts")
        .select("id, is_cancelled")
        .eq("contract_id", contractData.id)
        .eq("contractor_id", contractorData.id)
        .maybeSingle();

      if (checkError) {
        throw new Error("Erro ao verificar status da assinatura");
      }

      if (existingSignature && !existingSignature.is_cancelled) {
        toast({
          title: "Contrato já assinado",
          description: "Este contrato já foi assinado por você.",
          variant: "destructive",
        });
        return;
      }

      const htmlContent = document.documentElement.outerHTML;

      const token = window.location.pathname.split('/').pop();
      const { error: tokenError } = await supabase
        .from('contract_access_tokens')
        .update({ is_used: true })
        .eq('token', token);

      if (tokenError) {
        console.error("Erro ao marcar token como usado:", tokenError);
      }

      const { error: signError } = await supabase
        .from("signed_contracts")
        .insert({
          contract_id: contractData.id,
          contractor_id: contractorData.id,
          signature_data: signatureData,
          signed_html_content: htmlContent,
          ip_address: "127.0.0.1",
          user_agent: navigator.userAgent
        });

      if (signError) {
        throw new Error("Erro ao registrar assinatura digital. Tente novamente.");
      }

      toast({
        title: "Contrato assinado digitalmente!",
        description: "Sua assinatura digital foi registrada com sucesso.",
      });

      handleSignatureSuccess();
    } catch (error: any) {
      toast({
        title: "Erro na assinatura digital",
        description: error.message || "Erro ao registrar assinatura digital. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  // Se a assinatura foi concluída, mostrar apenas a mensagem de agradecimento
  if (signatureCompleted) {
    return (
      <>
        <Confetti trigger={showConfetti} />
        <ThankYouMessage 
          isVisible={showThankYou}
          contractorName={contractorData?.responsible_name || contractorData?.name}
          onContinue={handleContinueAfterThankYou}
        />
      </>
    );
  }

  // Renderizar assinatura digital com certificado
  if (signatureMethod === 'digital') {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Button
          variant="outline"
          onClick={() => setSignatureMethod('choose')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar às opções
        </Button>

        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg max-w-xl mx-auto">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-purple-900">Certificado Digital</h3>
                <Badge variant="outline" className="mt-1 border-purple-300 text-purple-700">
                  ICP-Brasil
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 text-center">
              Assine de forma segura e jurídica utilizando seu certificado digital A1 (.p12/.pfx) válido.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">Certificação ICP-Brasil</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">Validade jurídica total</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">Máxima segurança</span>
              </div>
            </div>

            <UnifiedDigitalSignature
              contractData={contractData}
              onSignatureComplete={handleDigitalSignatureComplete}
              onCancel={() => setSignatureMethod('choose')}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderizar assinatura via Autentique
  if (signatureMethod === 'autentique') {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Button
          variant="outline"
          onClick={() => setSignatureMethod('choose')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar às opções
        </Button>

        <AutentiqueSignature
          contractData={contractData}
          contractorData={contractorData}
          onSignatureComplete={handleSignatureSuccess}
          onCancel={() => setSignatureMethod('choose')}
        />
      </div>
    );
  }

  // Renderizar seletor de método de assinatura
  return (
    <div className="w-full">
      <SignatureMethodSelector
        onSelectMethod={(method) => setSignatureMethod(method)}
        onCancel={onCancel}
      />
    </div>
  );
};

export default ContractSignature;
