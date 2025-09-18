import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Calculator } from "lucide-react";
import { useCosts } from "@/hooks/useCosts";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";

// Categorias administrativas baseadas na imagem de referência
const adminExpenseCategories = {
  water: {
    label: "Água",
    color: "bg-blue-600/10 text-blue-900"
  },
  rent: {
    label: "Aluguel",
    color: "bg-purple-600/10 text-purple-900"
  },
  condo: {
    label: "Condomínio",
    color: "bg-gray-600/10 text-gray-900"
  },
  accounting: {
    label: "Contabilidade",
    color: "bg-green-600/10 text-green-900"
  },
  internet: {
    label: "Internet",
    color: "bg-orange-600/10 text-orange-900"
  },
  iptu: {
    label: "IPTU",
    color: "bg-red-600/10 text-red-900"
  },
  cleaning: {
    label: "Limpeza",
    color: "bg-teal-600/10 text-teal-900"
  },
  electricity: {
    label: "Luz",
    color: "bg-yellow-600/10 text-yellow-900"
  },
  payment_machine: {
    label: "Máquina Pagamento",
    color: "bg-indigo-600/10 text-indigo-900"
  },
  marketing: {
    label: "Publicidade",
    color: "bg-pink-600/10 text-pink-900"
  },
  phone: {
    label: "Telefone",
    color: "bg-cyan-600/10 text-cyan-900"
  },
  systems: {
    label: "Sistemas",
    color: "bg-violet-600/10 text-violet-900"
  }
};
const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
interface AdminExpensesTableProps {
  selectedYear?: number;
}
const AdminExpensesTable: React.FC<AdminExpensesTableProps> = ({
  selectedYear = new Date().getFullYear()
}) => {
  const [viewType, setViewType] = useState<"summary" | "detailed">("summary");
  const {
    companyCosts
  } = useCosts();

  // Filtrar apenas custos administrativos
  const adminCosts = useMemo(() => {
    if (!companyCosts) return [];
    return companyCosts.filter(cost => cost.is_active && cost.category === 'administrative');
  }, [companyCosts]);

  // Agrupar custos administrativos por descrição (mapeando para os tipos)
  const groupedAdminExpenses = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    // Inicializar todas as categorias administrativas
    Object.keys(adminExpenseCategories).forEach(expenseKey => {
      grouped[expenseKey] = [];
    });
    adminCosts.forEach(cost => {
      // Mapear a descrição do custo para o tipo administrativo
      const description = cost.description.toLowerCase();
      let expenseType = 'other';
      if (description.includes('água') || description.includes('water')) expenseType = 'water';else if (description.includes('aluguel') || description.includes('rent')) expenseType = 'rent';else if (description.includes('condomínio') || description.includes('condominio')) expenseType = 'condo';else if (description.includes('contabilidade') || description.includes('accounting')) expenseType = 'accounting';else if (description.includes('internet')) expenseType = 'internet';else if (description.includes('iptu')) expenseType = 'iptu';else if (description.includes('limpeza') || description.includes('cleaning')) expenseType = 'cleaning';else if (description.includes('luz') || description.includes('energia') || description.includes('electricity')) expenseType = 'electricity';else if (description.includes('máquina') || description.includes('pagamento') || description.includes('payment')) expenseType = 'payment_machine';else if (description.includes('publicidade') || description.includes('marketing')) expenseType = 'marketing';else if (description.includes('telefone') || description.includes('phone')) expenseType = 'phone';else if (description.includes('sistema') || description.includes('software') || description.includes('systems')) expenseType = 'systems';
      if (grouped[expenseType]) {
        grouped[expenseType].push(cost);
      }
    });
    return grouped;
  }, [adminCosts]);

  // Calcular totais mensais por tipo de despesa administrativa
  const monthlyAdminTotals = useMemo(() => {
    const totals: Record<string, Record<number, number>> = {};
    Object.keys(adminExpenseCategories).forEach(expenseKey => {
      const costs = groupedAdminExpenses[expenseKey] || [];
      totals[expenseKey] = {};

      // Para cada mês
      for (let month = 0; month < 12; month++) {
        totals[expenseKey][month] = costs.reduce((sum, cost) => {
          return sum + (cost.monthly_cost || 0);
        }, 0);
      }
    });
    return totals;
  }, [groupedAdminExpenses]);

  // Calcular totais gerais administrativos
  const grandAdminTotals = useMemo(() => {
    const totals = {
      monthly: new Array(12).fill(0),
      annual: 0
    };
    Object.values(monthlyAdminTotals).forEach(expenseTotals => {
      Object.entries(expenseTotals).forEach(([month, value]) => {
        totals.monthly[parseInt(month)] += value;
        totals.annual += value;
      });
    });
    return totals;
  }, [monthlyAdminTotals]);

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl font-bold">ADMINISTRATIVO</CardTitle>
              <p className="text-blue-100 text-sm">Custos Administrativos e Operacionais</p>
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
              {Object.entries(adminExpenseCategories).map(([key, category]) => {
                const monthlyTotals = monthlyAdminTotals[key] || {};
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
                    <span>TOTAL ADMINISTRATIVO</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono">
                  {formatMonetaryValue(grandAdminTotals.annual / 12)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {formatMonetaryValue(grandAdminTotals.annual)}
                </TableCell>
                {grandAdminTotals.monthly.map((total: number, index: number) => (
                  <TableCell key={index} className="text-center font-mono">
                    {formatMonetaryValue(total)}
                  </TableCell>
                ))}
                <TableCell className="text-center font-mono font-bold">
                  {formatMonetaryValue(grandAdminTotals.annual)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
export default AdminExpensesTable;