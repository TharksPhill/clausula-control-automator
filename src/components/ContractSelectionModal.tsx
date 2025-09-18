import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useContracts } from "@/hooks/useContracts";
import { User, CheckSquare, Square, X } from "lucide-react";

interface ContractSelectionModalProps {
  open: boolean;
  selectedIds: string[];
  onSave: (ids: string[]) => void;
  onClose: () => void;
}

const ContractSelectionModal: React.FC<ContractSelectionModalProps> = ({ open, selectedIds, onSave, onClose }) => {
  const { contracts } = useContracts();
  const [selection, setSelection] = useState<string[]>(selectedIds || []);

  useEffect(() => {
    if (open) setSelection(selectedIds || []);
  }, [open, selectedIds]);

  const allIds = useMemo(() => (contracts ? contracts.map(c => c.id) : []), [contracts]);
  const allSelected = selection.length > 0 && selection.length === allIds.length;

  const toggleAll = () => {
    setSelection(prev => (prev.length === allIds.length ? [] : allIds));
  };

  const toggleId = (id: string) => {
    setSelection(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const getContractorName = (c: any) => (c.contractors && c.contractors[0]?.name) || "Contratante";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias (Contratos)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {allSelected ? <X className="h-4 w-4 mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
              {allSelected ? "Limpar seleção" : "Selecionar todos"}
            </Button>
            <div className="text-sm text-muted-foreground">{selection.length} selecionado(s)</div>
          </div>
          <div className="border rounded-md overflow-hidden max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Contratante</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Plano</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts?.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleId(c.id)}>
                    <TableCell>
                      <Checkbox checked={selection.includes(c.id)} onCheckedChange={() => toggleId(c.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{getContractorName(c)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{c.contract_number}</TableCell>
                    <TableCell className="capitalize">{c.plan_type || 'mensal'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => { onSave(selection); onClose(); }}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractSelectionModal;
