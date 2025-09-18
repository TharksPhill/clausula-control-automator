
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, ArrowLeft, CheckCircle2, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import UnifiedDigitalSignature from './unified/UnifiedDigitalSignature';
import SignWellContractSignature from './SignWellContractSignature';
import AutentiqueSignature from './AutentiqueSignature';
import { Badge } from '@/components/ui/badge';
import { useSignWellConfig } from '@/hooks/useSignWellConfig';

interface AdminContractSignatureProps {
  contractData: any;
  onSignatureComplete: () => void;
  onCancel: () => void;
}

const AdminContractSignature: React.FC<AdminContractSignatureProps> = ({
  contractData,
  onSignatureComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const { isConfigured: isSignWellConfigured } = useSignWellConfig();
  const [signing, setSigning] = useState(false);
  const [step, setStep] = useState<'method' | 'digital' | 'signwell' | 'autentique'>('method');

  const handleDigitalSignatureComplete = async (signatureData: string) => {
    try {
      setSigning(true);
      console.log("Processando assinatura digital do administrador...");

      if (!contractData?.id) {
        throw new Error("ID do contrato não encontrado");
      }

      // Verificar se o contrato já foi assinado pelo administrador
      const { data: existingSignature, error: checkError } = await supabase
        .from("admin_contract_signatures" as any)
        .select("id")
        .eq("contract_id", contractData.id)
        .maybeSingle();

      if (checkError) {
        console.error("Erro ao verificar assinatura existente:", checkError);
        throw new Error("Erro ao verificar status da assinatura");
      }

      if (existingSignature) {
        toast({
          title: "Contrato já assinado",
          description: "Este contrato já foi assinado por você.",
          variant: "destructive",
        });
        return;
      }

      // Capturar conteúdo HTML para auditoria
      const htmlContent = document.documentElement.outerHTML;

      console.log("Salvando assinatura digital do administrador...");

      const { error: signError } = await supabase
        .from("admin_contract_signatures" as any)
        .insert({
          contract_id: contractData.id,
          signature_data: signatureData,
          signed_html_content: htmlContent,
          ip_address: "127.0.0.1",
          user_agent: navigator.userAgent
        });

      if (signError) {
        console.error("Erro ao salvar assinatura digital:", signError);
        throw new Error("Erro ao registrar assinatura digital. Tente novamente.");
      }

      console.log("Assinatura digital do administrador registrada com sucesso");

      toast({
        title: "Contrato assinado digitalmente!",
        description: "Sua assinatura digital foi registrada com sucesso.",
      });

      onSignatureComplete();
    } catch (error: any) {
      console.error("Erro na assinatura digital:", error);
      toast({
        title: "Erro na assinatura digital",
        description: error.message || "Erro ao registrar assinatura digital. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  const handleSignWellComplete = () => {
    console.log('🎉 Assinatura SignWell do admin concluída');
    toast({
      title: "Contrato assinado via SignWell!",
      description: "Sua assinatura foi registrada com sucesso.",
    });
    onSignatureComplete();
  };

  const handleAutentiqueComplete = (signatureData: string) => {
    console.log('🎉 Assinatura Autentique do admin concluída', signatureData);
    toast({
      title: "Contrato enviado via Autentique!",
      description: "O contrato foi enviado para assinatura via Autentique.",
    });
    onSignatureComplete();
  };

  if (step === 'digital') {
    return (
      <UnifiedDigitalSignature
        contractData={contractData}
        onSignatureComplete={handleDigitalSignatureComplete}
        onCancel={() => setStep('method')}
        isAdmin={true}
      />
    );
  }

  if (step === 'signwell') {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Button
          variant="outline"
          onClick={() => setStep('method')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar às opções
        </Button>

        <SignWellContractSignature
          contractData={contractData}
          contractorData={{
            name: contractData?.company?.name || "Empresa",
            responsible_name: contractData?.company?.responsible_name || "Administrador",
            email: contractData?.company?.email || "admin@empresa.com"
          }}
          onSignatureComplete={handleSignWellComplete}
          onCancel={() => setStep('method')}
        />
      </div>
    );
  }

  if (step === 'autentique') {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Button
          variant="outline"
          onClick={() => setStep('method')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar às opções
        </Button>

        <AutentiqueSignature
          contractData={contractData}
          contractorData={{
            name: contractData?.company?.name || "Empresa",
            responsible_name: contractData?.company?.responsible_name || "Administrador",
            email: contractData?.company?.email || "admin@empresa.com"
          }}
          onSignatureComplete={handleAutentiqueComplete}
          onCancel={() => setStep('method')}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Assinatura Digital do Administrador
          </CardTitle>
          <p className="text-center text-gray-600">
            Escolha o método de assinatura para este contrato
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SignWell */}
        <Card className={`border-2 ${
          isSignWellConfigured 
            ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-lg cursor-pointer' 
            : 'border-gray-200 bg-gray-50'
        } transition-all duration-300`}
              onClick={isSignWellConfigured ? () => setStep('signwell') : undefined}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className={`p-3 ${isSignWellConfigured ? 'bg-purple-100' : 'bg-gray-100'} rounded-lg`}>
                <Shield className={`h-8 w-8 ${isSignWellConfigured ? 'text-purple-600' : 'text-gray-400'}`} />
              </div>
              <div className="text-center">
                <h3 className={`text-xl font-semibold ${isSignWellConfigured ? 'text-purple-900' : 'text-gray-500'}`}>
                  SignWell
                </h3>
                <Badge variant="outline" className={`mt-1 ${
                  isSignWellConfigured 
                    ? 'border-purple-300 text-purple-700' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {isSignWellConfigured ? 'Configurado' : 'Não Configurado'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className={`text-sm text-center ${isSignWellConfigured ? 'text-gray-700' : 'text-gray-500'}`}>
              Assinatura digital moderna e eficiente via SignWell
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className={`h-4 w-4 ${isSignWellConfigured ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className={`text-sm ${isSignWellConfigured ? 'text-gray-700' : 'text-gray-500'}`}>
                  Interface moderna
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Award className={`h-4 w-4 ${isSignWellConfigured ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className={`text-sm ${isSignWellConfigured ? 'text-gray-700' : 'text-gray-500'}`}>
                  Processo rápido
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${isSignWellConfigured ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className={`text-sm ${isSignWellConfigured ? 'text-gray-700' : 'text-gray-500'}`}>
                  Compliance total
                </span>
              </div>
            </div>

            <Button 
              onClick={() => setStep('signwell')}
              disabled={signing || !isSignWellConfigured}
              className={`w-full ${
                isSignWellConfigured 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {signing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  {isSignWellConfigured ? 'Usar SignWell' : 'Configurar SignWell'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Autentique */}
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => setStep('autentique')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Award className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-blue-900">Autentique</h3>
                <Badge variant="outline" className="mt-1 border-blue-300 text-blue-700">
                  Plataforma Online
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-gray-700 text-sm text-center">
              Envie o contrato por email para assinatura via plataforma Autentique
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700">Envio por email</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700">Validade jurídica</span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700">Rastreamento</span>
              </div>
            </div>

            <Button 
              onClick={() => setStep('autentique')}
              disabled={signing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {signing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Usar Autentique
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Certificado Digital */}
        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => setStep('digital')}>
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
            <p className="text-gray-700 text-sm text-center">
              Assinatura com certificado digital A1/A3 para máxima segurança jurídica
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-700">Certificação ICP-Brasil</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-700">Validade jurídica total</span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-700">Máxima segurança</span>
              </div>
            </div>

            <Button 
              onClick={() => setStep('digital')}
              disabled={signing}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {signing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Usar Certificado Digital
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informações sobre os métodos */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-lg text-center">
            Métodos de Assinatura para Administradores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <p className="text-sm text-blue-800">
              Como administrador, você pode escolher entre SignWell (se configurado), 
              Autentique ou certificado digital ICP-Brasil para assinar contratos.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="text-left">
                <h4 className="font-semibold text-blue-900 mb-2">SignWell:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Interface moderna</li>
                  <li>• Processo rápido</li>
                  <li>• Notificações automáticas</li>
                  <li>• Validade jurídica</li>
                </ul>
              </div>
              
              <div className="text-left">
                <h4 className="font-semibold text-blue-900 mb-2">Autentique:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>📧 Envio por email</li>
                  <li>📋 Validade jurídica</li>
                  <li>📊 Rastreamento</li>
                  <li>🔄 Alternativa confiável</li>
                </ul>
              </div>
              
              <div className="text-left">
                <h4 className="font-semibold text-blue-900 mb-2">Certificado Digital:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>🔒 Segurança máxima</li>
                  <li>⚖️ Validade jurídica total</li>
                  <li>🏛️ Padrão ICP-Brasil</li>
                  <li>✅ Não repúdio</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="outline" onClick={onCancel} className="px-8">
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default AdminContractSignature;
