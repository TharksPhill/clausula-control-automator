import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useContracts } from "@/hooks/useContracts";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";

interface ContractMonthlyRevenueModalProps {
  open: boolean;
  onClose: () => void;
  contractId: string | null;
  year: number;
}

const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

const ContractMonthlyRevenueModal: React.FC<ContractMonthlyRevenueModalProps> = ({ open, onClose, contractId, year }) => {
  const { contracts } = useContracts();
  const { getEffectiveValueForContract } = useContractAdjustments();

  const contract = useMemo(() => contracts?.find(c => c.id === contractId), [contracts, contractId]);

  const computeRevenueForDate = (date: Date): number => {
    if (!contract) return 0;
    const baseValue = parseFloat(contract.monthly_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
    const adjustedBase = getEffectiveValueForContract(contract.id, baseValue, date);

    // Trial period handling
    const trialDays = parseInt(contract.trial_days || '30');
    let startDate: Date;
    try {
      if (contract.start_date?.includes('/')) {
        const [d, m, y] = contract.start_date.split('/');
        startDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      } else if (contract.start_date?.includes('-')) {
        startDate = new Date(contract.start_date);
      } else {
        startDate = new Date(contract.created_at);
      }
    } catch {
      startDate = new Date(contract.created_at);
    }

    const billingStart = new Date(startDate);
    billingStart.setDate(billingStart.getDate() + trialDays);

    const planType = (contract.plan_type || 'mensal').toLowerCase();

    const analysisYear = date.getFullYear();
    const analysisMonth = date.getMonth();
    const billingYear = billingStart.getFullYear();
    const billingMonth = billingStart.getMonth();

    const isBeingBilled = analysisYear > billingYear || (analysisYear === billingYear && analysisMonth >= billingMonth);
    if (!isBeingBilled) return 0;

    if (planType === 'anual') {
      // Para contratos anuais, cobrar apenas uma vez por ano
      const monthsSinceBilling = (analysisYear - billingYear) * 12 + (analysisMonth - billingMonth);
      const isAnnualBillingMonth = monthsSinceBilling >= 0 && monthsSinceBilling % 12 === 0;
      return isAnnualBillingMonth ? adjustedBase : 0;
    }
    if (planType === 'semestral') {
      // Para contratos semestrais, cobrar a cada 6 meses
      const monthsSinceBilling = (analysisYear - billingYear) * 12 + (analysisMonth - billingMonth);
      const isSemestralBillingMonth = monthsSinceBilling >= 0 && monthsSinceBilling % 6 === 0;
      return isSemestralBillingMonth ? adjustedBase : 0;
    }
    // mensal
    return adjustedBase;
  };

  const monthlyValues = useMemo(() => {
    return monthNames.map((_, idx) => computeRevenueForDate(new Date(year, idx, 1)));
  }, [year, contract]);

  if (!contractId || !contract) return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Faturamento Mensal</DialogTitle>
        </DialogHeader>
        <div>Nenhum contrato selecionado.</div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Faturamento mês a mês • Contrato {contract.contract_number} • {year}</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {monthNames.map((m) => (
                  <TableHead key={m} className="text-center">{m}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {monthlyValues.map((v, i) => (
                  <TableCell key={i} className="text-center font-mono">
                    {v > 0 ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractMonthlyRevenueModal;
