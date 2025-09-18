
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Heart, Handshake, ArrowRight } from 'lucide-react';

interface ThankYouMessageProps {
  isVisible: boolean;
  contractorName?: string;
  onContinue: () => void;
}

const ThankYouMessage: React.FC<ThankYouMessageProps> = ({
  isVisible,
  contractorName,
  onContinue
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <Card className="w-full max-w-md mx-4 border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">🎉 Parabéns!</h2>
            <p className="text-green-100 text-lg">Contrato assinado com sucesso!</p>
          </div>

          {/* Conteúdo da mensagem */}
          <div className="p-8 text-center space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-2xl">
                <Heart className="h-6 w-6 text-red-500 animate-pulse" />
                <span>Obrigado por iniciar essa parceria com a gente!</span>
                <Heart className="h-6 w-6 text-red-500 animate-pulse" />
              </div>
              
              {contractorName && (
                <p className="text-lg text-gray-700">
                  Seja muito bem-vindo(a), <strong>{contractorName}</strong>!
                </p>
              )}
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Handshake className="h-6 w-6 text-blue-600" />
                  <span className="font-semibold text-gray-800">Estamos felizes em tê-lo conosco!</span>
                </div>
                <p className="text-gray-600">
                  Conte sempre com o nosso time para oferecer o melhor suporte e atendimento.
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>✅ Seu contrato foi processado e está ativo</p>
                <p>✅ Nossa equipe será notificada sobre a nova parceria</p>
                <p>✅ Em breve você receberá as instruções de acesso</p>
              </div>
            </div>

            <Button 
              onClick={onContinue}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-semibold shadow-lg"
            >
              <span>Continuar</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThankYouMessage;
