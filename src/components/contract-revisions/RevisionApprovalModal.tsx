
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface RevisionApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  revisionData: any;
  loading?: boolean;
}

const RevisionApprovalModal = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  revisionData,
  loading = false
}: RevisionApprovalModalProps) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    onReject(rejectionReason);
    setRejectionReason("");
    setShowRejectForm(false);
    onClose();
  };

  const handleApprove = () => {
    onApprove();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisar Proposta de Alteração</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Alterações Propostas:</h4>
            <div className="space-y-2 text-sm">
              {revisionData?.contractNumber && (
                <div>
                  <strong>Número do Contrato:</strong> {revisionData.contractNumber}
                </div>
              )}
              {revisionData?.monthlyValue && (
                <div>
                  <strong>Valor Mensal:</strong> R$ {revisionData.monthlyValue}
                </div>
              )}
              {revisionData?.employeeCount && (
                <div>
                  <strong>Quantidade de Funcionários:</strong> {revisionData.employeeCount}
                </div>
              )}
              {revisionData?.planType && (
                <div>
                  <strong>Tipo de Plano:</strong> {revisionData.planType}
                </div>
              )}
            </div>
          </div>

          {!showRejectForm ? (
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Aprovar e Assinar
              </Button>
              <Button
                onClick={() => setShowRejectForm(true)}
                variant="destructive"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Rejeitar e Editar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectionReason">Motivo da Rejeição</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Descreva o motivo da rejeição e as alterações necessárias..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleReject}
                  variant="destructive"
                  disabled={!rejectionReason.trim() || loading}
                >
                  Confirmar Rejeição
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RevisionApprovalModal;
