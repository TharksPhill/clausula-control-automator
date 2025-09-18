import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { useCosts } from "@/hooks/useCosts";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";

const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

interface RateioCustoFixoAnalysisViewProps {
  selectedYear: number;
}

const RateioCustoFixoAnalysisView = ({ selectedYear }: RateioCustoFixoAnalysisViewProps) => {
  const { contracts } = useContracts();
  const { companyCosts } = useCosts();

  // Helper para verificar e parsear datas
  const parseDateString = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  };

  // Calcular rateio de custos fixos baseado nos contratos ativos
  const fixedCostAllocation = useMemo(() => {
    const monthlyValues = Array.from({ length: 12 }, (_, monthIndex) => {
      if (!contracts || contracts.length === 0) return 0;
      if (!companyCosts || companyCosts.length === 0) return 0;

      // Calcular total de custos fixos mensais
      const totalFixedCosts = companyCosts
        .filter(cost => cost.is_active && cost.cost_type === 'fixed')
        .reduce((sum, cost) => sum + (cost.monthly_cost || 0), 0);

      // Contar contratos ativos no mês considerando encerramento
      const activeContracts = contracts.filter(contract => {
        // Verificar se o contrato está ativo
        if (contract.status !== 'Ativo') return false;

        // Verificar data de início
        const startDate = parseDateString(contract.start_date);
        if (startDate) {
          const startYear = startDate.getFullYear();
          const startMonth = startDate.getMonth();
          if (selectedYear < startYear || (selectedYear === startYear && monthIndex < startMonth)) {
            return false;
          }
        }

        // Verificar data de encerramento
        const termination = parseDateString(contract.termination_date);
        if (termination) {
          const termYear = termination.getFullYear();
          const termMonth = termination.getMonth();
          // Parar de ratear APÓS o mês de encerramento
          if (selectedYear > termYear || (selectedYear === termYear && monthIndex > termMonth)) {
            return false;
          }
        }

        return true;
      });

      // Ratear custos fixos entre contratos ativos
      if (activeContracts.length === 0) return 0;
      
      return totalFixedCosts / activeContracts.length;
    });

    const totalValue = monthlyValues.reduce((sum, value) => sum + value, 0);
    
    return {
      monthlyValues,
      totalValue,
      monthlyAverage: totalValue / 12
    };
  }, [contracts, companyCosts, selectedYear]);

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl text-orange-900">RATEIO DE CUSTO FIXO</CardTitle>
            <p className="text-sm text-orange-600">Rateio de custos fixos por contrato - {selectedYear}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-orange-800 hover:bg-orange-800">
                <TableHead className="text-orange-100 font-semibold w-40 sticky left-0 bg-orange-800">
                  RATEIO
                </TableHead>
                <TableHead className="text-orange-100 font-semibold text-center w-24">MENSAL</TableHead>
                <TableHead className="text-orange-100 font-semibold text-center w-24">ANUAL</TableHead>
                {monthNames.map(month => (
                  <TableHead key={month} className="text-orange-100 font-semibold text-center w-20">
                    {month}
                  </TableHead>
                ))}
                <TableHead className="text-orange-100 font-semibold text-center w-24">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b hover:bg-orange-50/50">
                <TableCell className="font-semibold sticky left-0 bg-white">
                  Custos Fixos Rateados
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {formatMonetaryValue(fixedCostAllocation.monthlyAverage)}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {formatMonetaryValue(fixedCostAllocation.totalValue)}
                </TableCell>
                {fixedCostAllocation.monthlyValues.map((value, index) => (
                  <TableCell key={index} className="text-center font-mono text-sm">
                    {value > 0 ? formatMonetaryValue(value).replace('R$ ', '') : '-'}
                  </TableCell>
                ))}
                <TableCell className="text-center font-mono text-sm font-semibold">
                  {formatMonetaryValue(fixedCostAllocation.totalValue)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RateioCustoFixoAnalysisView;