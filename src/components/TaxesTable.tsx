import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, TrendingUp } from "lucide-react";
import { useCosts } from "@/hooks/useCosts";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";

// Categorias de impostos baseadas na imagem de referência
const taxCategories = {
  cofins: { label: "COFINS", color: "bg-red-600/10 text-red-900" },
  fgts: { label: "FGTS", color: "bg-orange-600/10 text-orange-900" },
  icms: { label: "ICMS", color: "bg-purple-600/10 text-purple-900" },
  inss: { label: "INSS", color: "bg-blue-600/10 text-blue-900" },
  ipi: { label: "IPI", color: "bg-green-600/10 text-green-900" },
  iss: { label: "ISS", color: "bg-yellow-600/10 text-yellow-900" },
  mei: { label: "MEI", color: "bg-indigo-600/10 text-indigo-900" },
  pis: { label: "PIS", color: "bg-pink-600/10 text-pink-900" },
  simples_nacional: { label: "Simples Nacional", color: "bg-teal-600/10 text-teal-900" },
  gare: { label: "Gare", color: "bg-cyan-600/10 text-cyan-900" }
};

const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

interface TaxesTableProps {
  selectedYear?: number;
}

const TaxesTable: React.FC<TaxesTableProps> = ({ selectedYear = new Date().getFullYear() }) => {
  const [viewType, setViewType] = useState<"summary" | "detailed">("summary");
  const { companyCosts } = useCosts();

  // Filtrar apenas custos de impostos
  const taxCosts = useMemo(() => {
    if (!companyCosts) return [];
    
    return companyCosts.filter(cost => 
      cost.is_active && 
      cost.category === 'taxes'
    );
  }, [companyCosts]);

  // Agrupar custos de impostos por descrição (mapeando para os tipos de impostos)
  const groupedTaxes = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    // Inicializar todas as categorias de impostos
    Object.keys(taxCategories).forEach(taxKey => {
      grouped[taxKey] = [];
    });
    
    taxCosts.forEach(cost => {
      // Mapear a descrição do custo para o tipo de imposto
      const description = cost.description.toLowerCase();
      let taxType = 'other';
      
      if (description.includes('cofins')) taxType = 'cofins';
      else if (description.includes('fgts')) taxType = 'fgts';
      else if (description.includes('icms')) taxType = 'icms';
      else if (description.includes('inss')) taxType = 'inss';
      else if (description.includes('ipi')) taxType = 'ipi';
      else if (description.includes('iss')) taxType = 'iss';
      else if (description.includes('mei')) taxType = 'mei';
      else if (description.includes('pis')) taxType = 'pis';
      else if (description.includes('simples nacional') || description.includes('simples')) taxType = 'simples_nacional';
      else if (description.includes('gare')) taxType = 'gare';
      
      if (grouped[taxType]) {
        grouped[taxType].push(cost);
      }
    });
    
    return grouped;
  }, [taxCosts]);

  // Calcular totais mensais por tipo de imposto
  const monthlyTaxTotals = useMemo(() => {
    const totals: Record<string, Record<number, number>> = {};
    
    Object.keys(taxCategories).forEach(taxKey => {
      const costs = groupedTaxes[taxKey] || [];
      totals[taxKey] = {};
      
      // Para cada mês
      for (let month = 0; month < 12; month++) {
        totals[taxKey][month] = costs.reduce((sum, cost) => {
          return sum + (cost.monthly_cost || 0);
        }, 0);
      }
    });
    
    return totals;
  }, [groupedTaxes]);

  // Calcular totais gerais de impostos
  const grandTaxTotals = useMemo(() => {
    const totals = {
      monthly: new Array(12).fill(0),
      annual: 0
    };

    Object.values(monthlyTaxTotals).forEach(taxTotals => {
      Object.entries(taxTotals).forEach(([month, value]) => {
        totals.monthly[parseInt(month)] += value;
        totals.annual += value;
      });
    });

    return totals;
  }, [monthlyTaxTotals]);

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-red-900">IMPOSTOS</CardTitle>
              <p className="text-sm text-red-600">Análise mensal de tributos - {selectedYear}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewType} onValueChange={(value) => setViewType(value as "summary" | "detailed")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Resumo</SelectItem>
                <SelectItem value="detailed">Detalhado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-red-800 hover:bg-red-800">
                <TableHead className="text-red-100 font-semibold w-40 sticky left-0 bg-red-800">
                  IMPOSTOS
                </TableHead>
                <TableHead className="text-red-100 font-semibold text-center w-24">MENSAL</TableHead>
                <TableHead className="text-red-100 font-semibold text-center w-24">ANUAL</TableHead>
                {monthNames.map(month => (
                  <TableHead key={month} className="text-red-100 font-semibold text-center w-20">
                    {month}
                  </TableHead>
                ))}
                <TableHead className="text-red-100 font-semibold text-center w-24">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(taxCategories).map(([taxKey, tax]) => {
                const taxMonthlyTotals = monthlyTaxTotals[taxKey] || {};
                const taxAnnualTotal = Object.values(taxMonthlyTotals).reduce((sum: number, value: number) => sum + value, 0);
                const taxMonthlyAvg = taxAnnualTotal / 12;

                return (
                  <TableRow key={taxKey} className="border-b hover:bg-red-50/50">
                    <TableCell className={`font-semibold sticky left-0 bg-white ${tax.color}`}>
                      {tax.label}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {formatMonetaryValue(taxMonthlyAvg)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {formatMonetaryValue(taxAnnualTotal)}
                    </TableCell>
                    {monthNames.map((_, monthIndex) => {
                      const monthValue = taxMonthlyTotals[monthIndex] || 0;
                      return (
                        <TableCell key={monthIndex} className="text-center font-mono text-sm">
                          {monthValue > 0 ? formatMonetaryValue(monthValue).replace('R$ ', '') : '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-mono text-sm font-semibold">
                      {formatMonetaryValue(taxAnnualTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Linha de Total de Impostos */}
              <TableRow className="bg-red-100 font-bold hover:bg-red-100">
                <TableCell className="font-bold sticky left-0 bg-red-100">
                  TOTAL IMPOSTOS
                </TableCell>
                <TableCell className="text-center font-mono font-bold">
                  {formatMonetaryValue(grandTaxTotals.annual / 12)}
                </TableCell>
                <TableCell className="text-center font-mono font-bold">
                  {formatMonetaryValue(grandTaxTotals.annual)}
                </TableCell>
                {grandTaxTotals.monthly.map((monthTotal, index) => (
                  <TableCell key={index} className="text-center font-mono font-bold">
                    {monthTotal > 0 ? formatMonetaryValue(monthTotal).replace('R$ ', '') : '-'}
                  </TableCell>
                ))}
                <TableCell className="text-center font-mono font-bold">
                  {formatMonetaryValue(grandTaxTotals.annual)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Resumo dos totais de impostos */}
        <div className="p-4 bg-red-50 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-red-600">Total Mensal Médio</div>
              <div className="text-lg font-bold text-red-900">
                {formatMonetaryValue(grandTaxTotals.annual / 12)}
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-red-600">Total Anual</div>
              <div className="text-lg font-bold text-red-900">
                {formatMonetaryValue(grandTaxTotals.annual)}
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-red-600">Tipos de Impostos</div>
              <div className="text-lg font-bold text-red-900">
                {Object.keys(taxCategories).length}
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-red-600">Impostos Ativos</div>
              <div className="text-lg font-bold text-red-900">
                {Object.values(groupedTaxes).reduce((total, taxes) => total + taxes.length, 0)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaxesTable;