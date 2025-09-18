
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

interface ReviewNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewData: any;
}

const ReviewNotificationModal = ({ isOpen, onClose, reviewData }: ReviewNotificationModalProps) => {
  if (!reviewData) return null;

  const getStatusInfo = () => {
    switch (reviewData.review_status) {
      case "approved":
        return {
          title: "Sua Rejeição Foi Aprovada!",
          description: "O administrador analisou e aprovou suas justificativas. Você pode prosseguir com a assinatura.",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
          icon: <CheckCircle className="w-6 h-6 text-green-600" />
        };
      case "rejected":
        return {
          title: "Sua Rejeição Não Foi Aprovada",
          description: "O administrador analisou mas não aprovou suas justificativas. Veja a explicação abaixo.",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          icon: <XCircle className="w-6 h-6 text-red-600" />
        };
      default:
        return {
          title: "Revisão em Andamento",
          description: "Sua rejeição está sendo analisada pelo administrador.",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800",
          icon: <Info className="w-6 h-6 text-blue-600" />
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {statusInfo.icon}
            Atualização sobre sua Rejeição
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Principal */}
          <Card className={`${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
            <CardContent className="p-6">
              <h3 className={`font-semibold text-lg mb-2 ${statusInfo.textColor}`}>
                {statusInfo.title}
              </h3>
              <p className={`${statusInfo.textColor} mb-4`}>
                {statusInfo.description}
              </p>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusInfo.textColor}>
                  {reviewData.review_status === 'approved' ? 'Aprovado' : 
                   reviewData.review_status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                </Badge>
                {reviewData.reviewed_at && (
                  <span className="text-sm text-gray-600">
                    em {new Date(reviewData.reviewed_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seu Motivo Original */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Seu Motivo de Rejeição Original
              </h4>
              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-sm text-gray-700">{reviewData.reason}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Rejeitado em: {new Date(reviewData.rejected_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </CardContent>
          </Card>

          {/* Resposta do Administrador */}
          {reviewData.admin_explanation && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Resposta do Administrador
                </h4>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-blue-900">{reviewData.admin_explanation}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Próximos Passos */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-800 mb-2">Próximos Passos</h4>
              {reviewData.review_status === 'approved' ? (
                <p className="text-sm text-gray-700">
                  ✅ Você pode agora prosseguir para assinar o contrato. Clique em "Entendi" para continuar.
                </p>
              ) : reviewData.review_status === 'rejected' ? (
                <p className="text-sm text-gray-700">
                  ❌ Sua rejeição não foi aprovada. Você pode entrar em contato com o administrador para mais esclarecimentos ou prosseguir com a assinatura se desejar.
                </p>
              ) : (
                <p className="text-sm text-gray-700">
                  ⏳ Aguarde a análise do administrador. Você será notificado quando a revisão for concluída.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button onClick={onClose} className="px-6">
              Entendi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewNotificationModal;
