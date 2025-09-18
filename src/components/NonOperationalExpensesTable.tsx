import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Calculator } from "lucide-react";
import { useCosts } from "@/hooks/useCosts";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";

// Categorias de despesas não operacionais baseadas na imagem de referência
const nonOperationalExpenseCategories = {
  personal_cost: {
    label: "Custo Particular",
    color: "bg-rose-600/10 text-rose-900"
  },
  company_improvements: {
    label: "Empresa (Melhorias)",
    color: "bg-pink-600/10 text-pink-900"
  },
  loan_installment: {
    label: "Parcela Empréstimo",
    color: "bg-red-600/10 text-red-900"
  },
  equipment_installment: {
    label: "Parcela Equipamento",
    color: "bg-orange-600/10 text-orange-900"
  },
  others: {
    label: "Outros",
    color: "bg-amber-600/10 text-amber-900"
  },
  ford_ka: {
    label: "FORD KA",
    color: "bg-yellow-600/10 text-yellow-900"
  },
  bank_fee: {
    label: "Tarifa de Banco",
    color: "bg-lime-600/10 text-lime-900"
  },
  leisure_area: {
    label: "Área de Lazer",
    color: "bg-green-600/10 text-green-900"
  }
};
const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
interface NonOperationalExpensesTableProps {
  selectedYear?: number;
}
const NonOperationalExpensesTable: React.FC<NonOperationalExpensesTableProps> = ({
  selectedYear = new Date().getFullYear()
}) => {
  const [viewType, setViewType] = useState<"summary" | "detailed">("summary");
  const {
    companyCosts
  } = useCosts();

  // Filtrar apenas despesas não operacionais
  const nonOperationalExpenses = useMemo(() => {
    if (!companyCosts) return [];
    return companyCosts.filter(cost => cost.is_active && cost.category === 'non_operational_expenses');
  }, [companyCosts]);

  // Agrupar despesas não operacionais por descrição (mapeando para os tipos)
  const groupedNonOperationalExpenses = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    // Inicializar todas as categorias de despesas não operacionais
    Object.keys(nonOperationalExpenseCategories).forEach(expenseKey => {
      grouped[expenseKey] = [];
    });
    nonOperationalExpenses.forEach(cost => {
      // Mapear a descrição do custo para o tipo de despesa não operacional
      const description = cost.description.toLowerCase();
      let expenseType = 'others';
      if (description.includes('custo') && description.includes('particular')) expenseType = 'personal_cost';else if (description.includes('empresa') && description.includes('melhorias')) expenseType = 'company_improvements';else if (description.includes('parcela') && description.includes('empréstimo')) expenseType = 'loan_installment';else if (description.includes('parcela') && description.includes('equipamento')) expenseType = 'equipment_installment';else if (description.includes('ford') && description.includes('ka')) expenseType = 'ford_ka';else if (description.includes('tarifa') && description.includes('banco')) expenseType = 'bank_fee';else if (description.includes('área') && description.includes('lazer')) expenseType = 'leisure_area';else if (description.includes('outros') || description.includes('other')) expenseType = 'others';
      if (grouped[expenseType]) {
        grouped[expenseType].push(cost);
      }
    });
    return grouped;
  }, [nonOperationalExpenses]);

  // Calcular totais mensais por tipo de despesa não operacional
  const monthlyNonOperationalExpenseTotals = useMemo(() => {
    const totals: Record<string, Record<number, number>> = {};
    Object.keys(nonOperationalExpenseCategories).forEach(expenseKey => {
      const costs = groupedNonOperationalExpenses[expenseKey] || [];
      totals[expenseKey] = {};

      // Para cada mês
      for (let month = 0; month < 12; month++) {
        totals[expenseKey][month] = costs.reduce((sum, cost) => {
          return sum + (cost.monthly_cost || 0);
        }, 0);
      }
    });
    return totals;
  }, [groupedNonOperationalExpenses]);

  // Calcular totais gerais de despesas não operacionais
  const grandNonOperationalExpenseTotals = useMemo(() => {
    const totals = {
      monthly: new Array(12).fill(0),
      annual: 0
    };
    Object.values(monthlyNonOperationalExpenseTotals).forEach(expenseTotals => {
      Object.entries(expenseTotals).forEach(([month, value]) => {
        totals.monthly[parseInt(month)] += value;
        totals.annual += value;
      });
    });
    return totals;
  }, [monthlyNonOperationalExpenseTotals]);

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-800 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl font-bold">DESPESAS NÃO OPERACIONAIS</CardTitle>
              <p className="text-rose-100 text-sm">Gastos Extras e Financiamentos</p>
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
              {Object.entries(nonOperationalExpenseCategories).map(([key, category]) => {
                const monthlyTotals = monthlyNonOperationalExpenseTotals[key] || {};
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
                    <span>TOTAL NÃO OPERACIONAL</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono">
                  {formatMonetaryValue(grandNonOperationalExpenseTotals.annual / 12)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {formatMonetaryValue(grandNonOperationalExpenseTotals.annual)}
                </TableCell>
                {grandNonOperationalExpenseTotals.monthly.map((total: number, index: number) => (
                  <TableCell key={index} className="text-center font-mono">
                    {formatMonetaryValue(total)}
                  </TableCell>
                ))}
                <TableCell className="text-center font-mono font-bold">
                  {formatMonetaryValue(grandNonOperationalExpenseTotals.annual)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
export default NonOperationalExpensesTable;