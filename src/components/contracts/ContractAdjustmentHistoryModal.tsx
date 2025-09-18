import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, TrendingUp } from "lucide-react";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContractAdjustmentHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any | null;
}

const ContractAdjustmentHistoryModal: React.FC<ContractAdjustmentHistoryModalProps> = ({ open, onOpenChange, contract }) => {
  const { adjustments, getAdjustmentsForContract, isLoading } = useContractAdjustments();

  const contractAdjustments = useMemo(() => {
    if (!contract) return [];
    // Preferir hook para manter cache/react-query funcionando
    const list = getAdjustmentsForContract(contract.id);
    // Ordenar do mais recente para o mais antigo por created_at
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [contract, adjustments]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Reajustes
          </DialogTitle>
          <DialogDescription>
            {contract ? `Contrato ${contract.contract_number}` : "Selecione um contrato para visualizar o histórico."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-muted-foreground text-center">Carregando...</div>
        ) : contractAdjustments.length === 0 ? (
          <div className="py-8 text-muted-foreground text-center">
            <History className="h-10 w-10 mx-auto mb-3" />
            Nenhum reajuste encontrado para este contrato.
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aplicado em</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead className="text-right">Anterior</TableHead>
                  <TableHead className="text-right">Novo</TableHead>
                  <TableHead className="text-right">Variação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractAdjustments.map((adj) => {
                  const prev = adj.previous_value ?? 0;
                  const next = adj.new_value ?? 0;
                  const pct = prev > 0 ? ((next - prev) / prev) * 100 : 0;
                  return (
                    <TableRow key={adj.id} className="hover:bg-muted/50">
                      <TableCell>
                        {format(new Date(adj.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="w-fit">
                          {format(new Date(adj.effective_date), "dd/MM/yyyy", { locale: ptBR })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">R$ {prev.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right text-green-600">R$ {next.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">
                        <span className={pct >= 0 ? "text-green-600" : "text-red-600"}>
                          <TrendingUp className="inline h-3 w-3 mr-1" />
                          {pct.toFixed(2)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Observações */}
            <div className="mt-2 text-sm text-muted-foreground">
              Itens são carregados diretamente da tabela de reajustes e atualizam automaticamente após cada novo reajuste.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContractAdjustmentHistoryModal;
