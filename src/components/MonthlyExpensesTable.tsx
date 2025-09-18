import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Calculator } from "lucide-react";
import { useCosts } from "@/hooks/useCosts";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";

// Categorias baseadas na imagem de referência
const expenseCategories = {
  administrative: {
    label: "Administrativo",
    color: "bg-blue-600/10 text-blue-900",
    items: [
      { key: "water", label: "Água" },
      { key: "rent", label: "Aluguel" },
      { key: "condo", label: "Condomínio" },
      { key: "accounting", label: "Contabilidade" },
      { key: "internet", label: "Internet" },
      { key: "iptu", label: "IPTU" },
      { key: "cleaning", label: "Limpeza" },
      { key: "electricity", label: "Luz" },
      { key: "payment_machine", label: "Máquina Pagamento" },
      { key: "marketing", label: "Publicidade" },
      { key: "phone", label: "Telefone" },
      { key: "systems", label: "Sistemas" }
    ]
  },
  taxes: {
    label: "Impostos",
    color: "bg-red-600/10 text-red-900",
    items: [
      { key: "cofins", label: "COFINS" },
      { key: "fgts", label: "FGTS" },
      { key: "icms", label: "ICMS" },
      { key: "inss", label: "INSS" },
      { key: "ipi", label: "IPI" },
      { key: "iss", label: "ISS" },
      { key: "mei", label: "MEI" },
      { key: "pis", label: "PIS" }
    ]
  }
};

const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

interface MonthlyExpensesTableProps {
  selectedYear?: number;
}

const MonthlyExpensesTable: React.FC<MonthlyExpensesTableProps> = ({ selectedYear = new Date().getFullYear() }) => {
  const [viewType, setViewType] = useState<"summary" | "detailed">("summary");
  const { companyCosts } = useCosts();

  // Agrupar custos por categoria
  const groupedCosts = useMemo(() => {
    if (!companyCosts) return {};
    
    const grouped: Record<string, any[]> = {};
    
    companyCosts.filter(cost => cost.is_active).forEach(cost => {
      const category = cost.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(cost);
    });
    
    return grouped;
  }, [companyCosts]);

  // Calcular totais mensais por categoria
  const monthlyTotals = useMemo(() => {
    const totals: Record<string, Record<number, number>> = {};
    
    Object.entries(expenseCategories).forEach(([categoryKey, category]) => {
      const costs = groupedCosts[categoryKey] || [];
      totals[categoryKey] = {};
      
      // Para cada mês
      for (let month = 0; month < 12; month++) {
        totals[categoryKey][month] = costs.reduce((sum, cost) => {
          return sum + (cost.monthly_cost || 0);
        }, 0);
      }
    });
    
    return totals;
  }, [groupedCosts]);

  // Calcular totais gerais
  const grandTotals = useMemo(() => {
    const totals = {
      monthly: new Array(12).fill(0),
      annual: 0
    };

    Object.values(monthlyTotals).forEach(categoryTotals => {
      Object.entries(categoryTotals).forEach(([month, value]) => {
        totals.monthly[parseInt(month)] += value;
        totals.annual += value;
      });
    });

    return totals;
  }, [monthlyTotals]);

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">DESPESA</CardTitle>
              <p className="text-sm text-slate-600">Análise mensal por categoria - {selectedYear}</p>
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
              <TableRow className="bg-slate-800 hover:bg-slate-800">
                <TableHead className="text-slate-200 font-semibold w-40 sticky left-0 bg-slate-800">
                  VER RESUMO
                </TableHead>
                <TableHead className="text-slate-200 font-semibold text-center w-24">MENSAL</TableHead>
                <TableHead className="text-slate-200 font-semibold text-center w-24">ANUAL</TableHead>
                {monthNames.map(month => (
                  <TableHead key={month} className="text-slate-200 font-semibold text-center w-20">
                    {month}
                  </TableHead>
                ))}
                <TableHead className="text-slate-200 font-semibold text-center w-24">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(expenseCategories).map(([categoryKey, category]) => {
                const categoryMonthlyTotals = monthlyTotals[categoryKey] || {};
                const categoryAnnualTotal = Object.values(categoryMonthlyTotals).reduce((sum: number, value: number) => sum + value, 0);
                const categoryMonthlyAvg = categoryAnnualTotal / 12;

                return (
                  <TableRow key={categoryKey} className="border-b hover:bg-slate-50/50">
                    <TableCell className={`font-semibold sticky left-0 bg-white ${category.color}`}>
                      {category.label}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {formatMonetaryValue(categoryMonthlyAvg)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {formatMonetaryValue(categoryAnnualTotal)}
                    </TableCell>
                    {monthNames.map((_, monthIndex) => {
                      const monthValue = categoryMonthlyTotals[monthIndex] || 0;
                      return (
                        <TableCell key={monthIndex} className="text-center font-mono text-sm">
                          {monthValue > 0 ? formatMonetaryValue(monthValue).replace('R$ ', '') : '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-mono text-sm font-semibold">
                      {formatMonetaryValue(categoryAnnualTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Linha de Total */}
              <TableRow className="bg-slate-100 font-bold hover:bg-slate-100">
                <TableCell className="font-bold sticky left-0 bg-slate-100">
                  TOTAL DESPESAS
                </TableCell>
                <TableCell className="text-center font-mono font-bold">
                  {formatMonetaryValue(grandTotals.annual / 12)}
                </TableCell>
                <TableCell className="text-center font-mono font-bold">
                  {formatMonetaryValue(grandTotals.annual)}
                </TableCell>
                {grandTotals.monthly.map((monthTotal, index) => (
                  <TableCell key={index} className="text-center font-mono font-bold">
                    {monthTotal > 0 ? formatMonetaryValue(monthTotal).replace('R$ ', '') : '-'}
                  </TableCell>
                ))}
                <TableCell className="text-center font-mono font-bold">
                  {formatMonetaryValue(grandTotals.annual)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Resumo dos totais */}
        <div className="p-4 bg-slate-50 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-slate-600">Total Mensal Médio</div>
              <div className="text-lg font-bold text-slate-900">
                {formatMonetaryValue(grandTotals.annual / 12)}
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-slate-600">Total Anual</div>
              <div className="text-lg font-bold text-slate-900">
                {formatMonetaryValue(grandTotals.annual)}
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-slate-600">Categorias Ativas</div>
              <div className="text-lg font-bold text-slate-900">
                {Object.keys(expenseCategories).length}
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-slate-600">Total de Itens</div>
              <div className="text-lg font-bold text-slate-900">
                {Object.values(groupedCosts).reduce((total, costs) => total + costs.length, 0)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyExpensesTable;