import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, Calculator } from "lucide-react";
import { useCosts } from "@/hooks/useCosts";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";

// Categorias operacionais baseadas na imagem de referência
const operationalCategories = {
  fuel: {
    label: "Combustível",
    color: "bg-orange-600/10 text-orange-900"
  },
  mail: {
    label: "Correios",
    color: "bg-blue-600/10 text-blue-900"
  },
  freight: {
    label: "Frete",
    color: "bg-purple-600/10 text-purple-900"
  },
  equipment_maintenance: {
    label: "Manutenção Equipamento",
    color: "bg-red-600/10 text-red-900"
  },
  vehicle_maintenance: {
    label: "Manutenção Veículo",
    color: "bg-yellow-600/10 text-yellow-900"
  },
  toll: {
    label: "Pedágio",
    color: "bg-green-600/10 text-green-900"
  },
  transport: {
    label: "Transporte",
    color: "bg-indigo-600/10 text-indigo-900"
  },
  other: {
    label: "Outro",
    color: "bg-gray-600/10 text-gray-900"
  }
};
const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
interface OperationalExpensesTableProps {
  selectedYear?: number;
}
const OperationalExpensesTable: React.FC<OperationalExpensesTableProps> = ({
  selectedYear = new Date().getFullYear()
}) => {
  const [viewType, setViewType] = useState<"summary" | "detailed">("summary");
  const {
    companyCosts
  } = useCosts();

  // Filtrar apenas custos operacionais
  const operationalCosts = useMemo(() => {
    if (!companyCosts) return [];
    return companyCosts.filter(cost => cost.is_active && cost.category === 'operational');
  }, [companyCosts]);

  // Agrupar custos operacionais por descrição (mapeando para os tipos)
  const groupedOperationalExpenses = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    // Inicializar todas as categorias operacionais
    Object.keys(operationalCategories).forEach(expenseKey => {
      grouped[expenseKey] = [];
    });
    operationalCosts.forEach(cost => {
      // Mapear a descrição do custo para o tipo operacional
      const description = cost.description.toLowerCase();
      let expenseType = 'other';
      if (description.includes('combustível') || description.includes('fuel') || description.includes('gasolina') || description.includes('diesel')) expenseType = 'fuel';else if (description.includes('correio') || description.includes('mail') || description.includes('sedex')) expenseType = 'mail';else if (description.includes('frete') || description.includes('freight')) expenseType = 'freight';else if (description.includes('manutenção') && (description.includes('equipamento') || description.includes('equipment'))) expenseType = 'equipment_maintenance';else if (description.includes('manutenção') && (description.includes('veículo') || description.includes('veiculo') || description.includes('vehicle') || description.includes('carro'))) expenseType = 'vehicle_maintenance';else if (description.includes('pedágio') || description.includes('pedagio') || description.includes('toll')) expenseType = 'toll';else if (description.includes('transporte') || description.includes('transport')) expenseType = 'transport';
      if (grouped[expenseType]) {
        grouped[expenseType].push(cost);
      }
    });
    return grouped;
  }, [operationalCosts]);

  // Calcular totais mensais por tipo de despesa operacional
  const monthlyOperationalTotals = useMemo(() => {
    const totals: Record<string, Record<number, number>> = {};
    Object.keys(operationalCategories).forEach(expenseKey => {
      const costs = groupedOperationalExpenses[expenseKey] || [];
      totals[expenseKey] = {};

      // Para cada mês
      for (let month = 0; month < 12; month++) {
        totals[expenseKey][month] = costs.reduce((sum, cost) => {
          return sum + (cost.monthly_cost || 0);
        }, 0);
      }
    });
    return totals;
  }, [groupedOperationalExpenses]);

  // Calcular totais gerais operacionais
  const grandOperationalTotals = useMemo(() => {
    const totals = {
      monthly: new Array(12).fill(0),
      annual: 0
    };
    Object.values(monthlyOperationalTotals).forEach(expenseTotals => {
      Object.entries(expenseTotals).forEach(([month, value]) => {
        totals.monthly[parseInt(month)] += value;
        totals.annual += value;
      });
    });
    return totals;
  }, [monthlyOperationalTotals]);

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-800 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl font-bold">OPERACIONAL</CardTitle>
              <p className="text-orange-100 text-sm">Custos Operacionais e Logística</p>
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
              {Object.entries(operationalCategories).map(([key, category]) => {
                const monthlyTotals = monthlyOperationalTotals[key] || {};
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
                    <span>TOTAL OPERACIONAL</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono">
                  {formatMonetaryValue(grandOperationalTotals.annual / 12)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {formatMonetaryValue(grandOperationalTotals.annual)}
                </TableCell>
                {grandOperationalTotals.monthly.map((total: number, index: number) => (
                  <TableCell key={index} className="text-center font-mono">
                    {formatMonetaryValue(total)}
                  </TableCell>
                ))}
                <TableCell className="text-center font-mono font-bold">
                  {formatMonetaryValue(grandOperationalTotals.annual)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
export default OperationalExpensesTable;