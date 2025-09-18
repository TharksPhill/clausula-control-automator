import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";

const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

interface BoletosRHIDAnalysisViewProps {
  selectedYear: number;
}

const BoletosRHIDAnalysisView = ({ selectedYear }: BoletosRHIDAnalysisViewProps) => {
  const { contracts } = useContracts();

  // Helper para verificar e parsear datas
  const parseDateString = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  };

  // Calcular custo de boletos baseado nos contratos ativos
  const boletosCosts = useMemo(() => {
    const monthlyValues = Array.from({ length: 12 }, (_, monthIndex) => {
      if (!contracts || contracts.length === 0) return 0;

      // Taxa de boleto padrão (pode ser configurada)
      const boletoTax = 3.50;
      
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
          // Parar de cobrar boleto APÓS o mês de encerramento
          if (selectedYear > termYear || (selectedYear === termYear && monthIndex > termMonth)) {
            return false;
          }
        }

        return true;
      });

      return activeContracts.length * boletoTax;
    });

    const totalValue = monthlyValues.reduce((sum, value) => sum + value, 0);
    
    return {
      monthlyValues,
      totalValue,
      monthlyAverage: totalValue / 12
    };
  }, [contracts, selectedYear]);

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl text-blue-900">BOLETOS RHID</CardTitle>
            <p className="text-sm text-blue-600">Custos com emissão de boletos - {selectedYear}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-800 hover:bg-blue-800">
                <TableHead className="text-blue-100 font-semibold w-40 sticky left-0 bg-blue-800">
                  BOLETOS
                </TableHead>
                <TableHead className="text-blue-100 font-semibold text-center w-24">MENSAL</TableHead>
                <TableHead className="text-blue-100 font-semibold text-center w-24">ANUAL</TableHead>
                {monthNames.map(month => (
                  <TableHead key={month} className="text-blue-100 font-semibold text-center w-20">
                    {month}
                  </TableHead>
                ))}
                <TableHead className="text-blue-100 font-semibold text-center w-24">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b hover:bg-blue-50/50">
                <TableCell className="font-semibold sticky left-0 bg-white">
                  Taxa de Boletos
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {formatMonetaryValue(boletosCosts.monthlyAverage)}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {formatMonetaryValue(boletosCosts.totalValue)}
                </TableCell>
                {boletosCosts.monthlyValues.map((value, index) => (
                  <TableCell key={index} className="text-center font-mono text-sm">
                    {value > 0 ? formatMonetaryValue(value).replace('R$ ', '') : '-'}
                  </TableCell>
                ))}
                <TableCell className="text-center font-mono text-sm font-semibold">
                  {formatMonetaryValue(boletosCosts.totalValue)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BoletosRHIDAnalysisView;