
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, FileText, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface RejectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rejection: any;
}

const RejectionDetailsModal = ({ isOpen, onClose, rejection }: RejectionDetailsModalProps) => {
  if (!rejection) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "plan_change":
        return "Mudança de Plano";
      case "contract_modification":
        return "Modificação de Contrato";
      case "cancellation":
        return "Cancelamento";
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Rejeição</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Tipo */}
          <div className="flex items-center gap-4">
            {getStatusBadge(rejection.review_status)}
            <Badge variant="outline">{getTypeLabel(rejection.rejection_type)}</Badge>
          </div>

          {/* Informações do Contrato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informações do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Número do Contrato</p>
                  <p className="text-sm text-gray-900">{rejection.contracts?.contract_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Valor Mensal</p>
                  <p className="text-sm text-gray-900">R$ {rejection.contracts?.monthly_value}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status do Contrato</p>
                  <Badge variant="outline">{rejection.contracts?.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Contratante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações do Contratante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Empresa</p>
                  <p className="text-sm text-gray-900">{rejection.contractors?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Responsável</p>
                  <p className="text-sm text-gray-900">{rejection.contractors?.responsible_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes da Rejeição */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Detalhes da Rejeição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Motivo da Rejeição</p>
                <div className="bg-gray-50 p-3 rounded-lg mt-1">
                  <p className="text-sm text-gray-900">{rejection.reason}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Data da Rejeição</p>
                  <p className="text-sm text-gray-900">
                    {new Date(rejection.rejected_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Tipo de Rejeição</p>
                  <p className="text-sm text-gray-900">{getTypeLabel(rejection.rejection_type)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Explicação do Administrador (se houver) */}
          {rejection.admin_explanation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Explicação do Administrador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-900">{rejection.admin_explanation}</p>
                </div>
                {rejection.reviewed_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Revisado em: {new Date(rejection.reviewed_at).toLocaleString("pt-BR")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RejectionDetailsModal;
