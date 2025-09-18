import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Key } from "lucide-react";
import { useContractMonthlyLicenseCosts } from "@/hooks/useContractLicenseCosts";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";

const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

interface CustoLicencaRHIDAnalysisViewProps {
  selectedYear: number;
}

const CustoLicencaRHIDAnalysisView = ({ selectedYear }: CustoLicencaRHIDAnalysisViewProps) => {
  // Usar o hook que já calcula corretamente os custos de licença com base no encerramento
  const { data: monthlyLicenseCosts = [] } = useContractMonthlyLicenseCosts(selectedYear);

  // Calcular totais mensais agregados
  const licenseCosts = React.useMemo(() => {
    const monthlyValues = Array.from({ length: 12 }, (_, monthIndex) => {
      return monthlyLicenseCosts.reduce((sum, contract) => {
        return sum + (contract.monthlyBreakdown[monthIndex] || 0);
      }, 0);
    });

    const totalValue = monthlyValues.reduce((sum, value) => sum + value, 0);
    
    return {
      monthlyValues,
      totalValue,
      monthlyAverage: totalValue > 0 ? totalValue / 12 : 0
    };
  }, [monthlyLicenseCosts]);

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
            <Key className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl text-purple-900">CUSTO DA LICENÇA RHID</CardTitle>
            <p className="text-sm text-purple-600">Custos com licenças de software - {selectedYear}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-purple-800 hover:bg-purple-800">
                <TableHead className="text-purple-100 font-semibold w-40 sticky left-0 bg-purple-800">
                  LICENÇAS
                </TableHead>
                <TableHead className="text-purple-100 font-semibold text-center w-24">MENSAL</TableHead>
                <TableHead className="text-purple-100 font-semibold text-center w-24">ANUAL</TableHead>
                {monthNames.map(month => (
                  <TableHead key={month} className="text-purple-100 font-semibold text-center w-20">
                    {month}
                  </TableHead>
                ))}
                <TableHead className="text-purple-100 font-semibold text-center w-24">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b hover:bg-purple-50/50">
                <TableCell className="font-semibold sticky left-0 bg-white">
                  Custo de Licenças
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {formatMonetaryValue(licenseCosts.monthlyAverage)}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {formatMonetaryValue(licenseCosts.totalValue)}
                </TableCell>
                {licenseCosts.monthlyValues.map((value, index) => (
                  <TableCell key={index} className="text-center font-mono text-sm">
                    {value > 0 ? formatMonetaryValue(value).replace('R$ ', '') : '-'}
                  </TableCell>
                ))}
                <TableCell className="text-center font-mono text-sm font-semibold">
                  {formatMonetaryValue(licenseCosts.totalValue)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustoLicencaRHIDAnalysisView;