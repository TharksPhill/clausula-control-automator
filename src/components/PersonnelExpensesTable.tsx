import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Calculator } from "lucide-react";
import { useCosts } from "@/hooks/useCosts";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";

// Categorias pessoais baseadas na imagem de referência
const personnelCategories = {
  medical_assistance: {
    label: "Assistência Médica",
    color: "bg-teal-600/10 text-teal-900"
  },
  salary: {
    label: "Salário",
    color: "bg-blue-600/10 text-blue-900"
  },
  external_lunch: {
    label: "Almoço Externo",
    color: "bg-green-600/10 text-green-900"
  },
  araraquara_lunch: {
    label: "Almoço Araraquara",
    color: "bg-yellow-600/10 text-yellow-900"
  },
  transport_voucher: {
    label: "Vale Transporte",
    color: "bg-orange-600/10 text-orange-900"
  },
  robson: {
    label: "Robson",
    color: "bg-red-600/10 text-red-900"
  }
};
const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
interface PersonnelExpensesTableProps {
  selectedYear?: number;
}
const PersonnelExpensesTable: React.FC<PersonnelExpensesTableProps> = ({
  selectedYear = new Date().getFullYear()
}) => {
  const [viewType, setViewType] = useState<"summary" | "detailed">("summary");
  const {
    companyCosts
  } = useCosts();

  // Filtrar apenas custos pessoais
  const personnelCosts = useMemo(() => {
    if (!companyCosts) return [];
    return companyCosts.filter(cost => cost.is_active && cost.category === 'personnel');
  }, [companyCosts]);

  // Agrupar custos pessoais por descrição (mapeando para os tipos)
  const groupedPersonnelExpenses = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    // Inicializar todas as categorias pessoais
    Object.keys(personnelCategories).forEach(expenseKey => {
      grouped[expenseKey] = [];
    });
    personnelCosts.forEach(cost => {
      // Mapear a descrição do custo para o tipo pessoal
      const description = cost.description.toLowerCase();
      let expenseType = 'salary';
      if (description.includes('assistência') && description.includes('médica')) expenseType = 'medical_assistance';else if (description.includes('salário') || description.includes('salario')) expenseType = 'salary';else if (description.includes('almoço') && description.includes('externo')) expenseType = 'external_lunch';else if (description.includes('almoço') && description.includes('araraquara')) expenseType = 'araraquara_lunch';else if (description.includes('vale') && description.includes('transporte')) expenseType = 'transport_voucher';else if (description.includes('robson')) expenseType = 'robson';
      if (grouped[expenseType]) {
        grouped[expenseType].push(cost);
      }
    });
    return grouped;
  }, [personnelCosts]);

  // Calcular totais mensais por tipo de despesa pessoal
  const monthlyPersonnelTotals = useMemo(() => {
    const totals: Record<string, Record<number, number>> = {};
    Object.keys(personnelCategories).forEach(expenseKey => {
      const costs = groupedPersonnelExpenses[expenseKey] || [];
      totals[expenseKey] = {};

      // Para cada mês
      for (let month = 0; month < 12; month++) {
        totals[expenseKey][month] = costs.reduce((sum, cost) => {
          return sum + (cost.monthly_cost || 0);
        }, 0);
      }
    });
    return totals;
  }, [groupedPersonnelExpenses]);

  // Calcular totais gerais pessoais
  const grandPersonnelTotals = useMemo(() => {
    const totals = {
      monthly: new Array(12).fill(0),
      annual: 0
    };
    Object.values(monthlyPersonnelTotals).forEach(expenseTotals => {
      Object.entries(expenseTotals).forEach(([month, value]) => {
        totals.monthly[parseInt(month)] += value;
        totals.annual += value;
      });
    });
    return totals;
  }, [monthlyPersonnelTotals]);

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl font-bold">PESSOAL</CardTitle>
              <p className="text-blue-100 text-sm">Custos com Pessoal e Benefícios</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewType} onValueChange={(value: "summary" | "detailed") => setViewType(value)}>
              <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
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
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Categoria</TableHead>
                <TableHead className="text-center font-bold">Mensal</TableHead>
                <TableHead className="text-center font-bold">Anual</TableHead>
                {monthNames.map(month => (
                  <TableHead key={month} className="text-center font-bold min-w-20">{month}</TableHead>
                ))}
                <TableHead className="text-center font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(personnelCategories).map(([key, category]) => {
                const monthlyTotals = monthlyPersonnelTotals[key] || {};
                const annualTotal = Object.values(monthlyTotals).reduce((sum: number, value: number) => sum + value, 0);
                const monthlyAverage = annualTotal / 12;

                return (
                  <TableRow key={key}>
                    <TableCell>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                        {category.label}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {formatMonetaryValue(monthlyAverage)}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {formatMonetaryValue(annualTotal)}
                    </TableCell>
                    {monthNames.map((_, monthIndex) => (
                      <TableCell key={monthIndex} className="text-center font-mono">
                        {formatMonetaryValue(monthlyTotals[monthIndex] || 0)}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-mono font-bold">
                      {formatMonetaryValue(annualTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    <span>TOTAL PESSOAL</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono">
                  {formatMonetaryValue(grandPersonnelTotals.annual / 12)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {formatMonetaryValue(grandPersonnelTotals.annual)}
                </TableCell>
                {grandPersonnelTotals.monthly.map((total: number, index: number) => (
                  <TableCell key={index} className="text-center font-mono">
                    {formatMonetaryValue(total)}
                  </TableCell>
                ))}
                <TableCell className="text-center font-mono font-bold">
                  {formatMonetaryValue(grandPersonnelTotals.annual)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
export default PersonnelExpensesTable;