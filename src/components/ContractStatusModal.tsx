import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContractStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
  mode: "activate" | "deactivate";
  contractNumber?: string;
}

const ContractStatusModal = ({ isOpen, onClose, onConfirm, mode, contractNumber }: ContractStatusModalProps) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleConfirm = () => {
    onConfirm(selectedDate);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {mode === "activate" ? "Ativar Contrato" : "Encerrar Contrato"}
          </DialogTitle>
          <DialogDescription>
            {mode === "activate" 
              ? `O contrato ${contractNumber || ''} será reativado ao seu status ativo.`
              : `O contrato ${contractNumber || ''} será encerrado e voltará ao status inativo.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">
              {mode === "activate" ? "Data de Ativação" : "Data de Encerramento"} *
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              {mode === "activate" 
                ? "A partir desta data, o contrato voltará a gerar receitas"
                : "A partir desta data, o contrato não gerará mais receitas"
              }
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} variant={mode === "deactivate" ? "destructive" : "default"}>
            {mode === "activate" ? "Confirmar Ativação" : "Confirmar Encerramento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractStatusModal;