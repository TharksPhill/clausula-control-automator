import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Award,
  CheckCircle2,
  FileSignature,
  Lock,
  Star,
  Send
} from 'lucide-react';

interface SignatureMethodSelectorProps {
  onSelectMethod: (method: 'digital' | 'autentique') => void;
  onCancel: () => void;
}

const SignatureMethodSelector: React.FC<SignatureMethodSelectorProps> = ({
  onSelectMethod,
  onCancel
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Escolha o Método de Assinatura
          </CardTitle>
          <p className="text-lg text-gray-600 mt-2">
            Selecione como deseja assinar seu contrato digitalmente
          </p>
        </CardHeader>
      </Card>

      {/* Opções de Assinatura */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Certificado Digital */}
        <Card className="relative border-2 border-purple-400 bg-gradient-to-br from-purple-50 via-white to-indigo-50 hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105"
              onClick={() => onSelectMethod('digital')}>
          
          {/* Badge de destaque */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 text-sm font-semibold">
              <Star className="h-3 w-3 mr-1" />
              ICP-BRASIL
            </Badge>
          </div>

          <CardHeader className="pb-4 pt-8">
            <CardTitle className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl shadow-lg">
                  <Shield className="h-10 w-10 text-purple-600" />
                </div>
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Certificado Digital</h3>
                <Badge variant="outline" className="border-purple-400 text-purple-700 bg-purple-50 px-3 py-1">
                  A1 (.p12/.pfx)
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-gray-700 text-center leading-relaxed text-sm">
              Use seu certificado digital A1 para assinar localmente com máxima segurança.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100">
                <Shield className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">Certificação ICP-Brasil</span>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100">
                <Lock className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">Processamento Local</span>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100">
                <Award className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">Download Imediato</span>
              </div>
            </div>

            <Button 
              onClick={() => onSelectMethod('digital')}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-bold py-3 text-sm shadow-lg transform transition-all duration-200 hover:shadow-xl"
            >
              <Shield className="h-4 w-4 mr-2" />
              Usar Certificado Digital
            </Button>
          </CardContent>
        </Card>

        {/* Autentique */}
        <Card className="relative border-2 border-blue-400 bg-gradient-to-br from-blue-50 via-white to-cyan-50 hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105"
              onClick={() => onSelectMethod('autentique')}>
          
          {/* Badge de destaque */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-1 text-sm font-semibold">
              <Send className="h-3 w-3 mr-1" />
              PLATAFORMA
            </Badge>
          </div>

          <CardHeader className="pb-4 pt-8">
            <CardTitle className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl shadow-lg">
                  <Award className="h-10 w-10 text-blue-600" />
                </div>
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-blue-900 mb-2">Autentique</h3>
                <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-50 px-3 py-1">
                  Plataforma Online
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-gray-700 text-center leading-relaxed text-sm">
              Envie o contrato por email para assinatura via plataforma Autentique.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                <Send className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">Envio por Email</span>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                <FileSignature className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">Validade Jurídica</span>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">Rastreamento</span>
              </div>
            </div>

            <Button 
              onClick={() => onSelectMethod('autentique')}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-bold py-3 text-sm shadow-lg transform transition-all duration-200 hover:shadow-xl"
            >
              <Award className="h-4 w-4 mr-2" />
              Enviar via Autentique
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informações Comparativas */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 text-xl text-center flex items-center justify-center gap-2">
            <FileSignature className="h-6 w-6" />
            Comparação dos Métodos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Certificado Digital
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Processamento local e seguro</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Download imediato do PDF assinado</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Requer certificado A1 (.p12/.pfx)</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Autentique
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Não requer certificado próprio</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Notificação automática por email</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Rastreamento de status</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Cancelar */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={onCancel} className="px-8 py-2">
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default SignatureMethodSelector;