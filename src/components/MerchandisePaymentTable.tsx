import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Calculator } from "lucide-react";
import { useCosts } from "@/hooks/useCosts";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";

// Categorias de pagamento de mercadoria baseadas na imagem de referência
const merchandisePaymentCategories = {
  equipment: {
    label: "Equipamentos",
    color: "bg-emerald-600/10 text-emerald-900"
  },
  supplies: {
    label: "Insumos",
    color: "bg-teal-600/10 text-teal-900"
  },
  raw_material: {
    label: "Matéria-Prima",
    color: "bg-green-600/10 text-green-900"
  },
  merchandise_payment: {
    label: "Pag Mercadoria",
    color: "bg-lime-600/10 text-lime-900"
  },
  rhid: {
    label: "RHiD",
    color: "bg-cyan-600/10 text-cyan-900"
  }
};
const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
interface MerchandisePaymentTableProps {
  selectedYear?: number;
}
const MerchandisePaymentTable: React.FC<MerchandisePaymentTableProps> = ({
  selectedYear = new Date().getFullYear()
}) => {
  const [viewType, setViewType] = useState<"summary" | "detailed">("summary");
  const {
    companyCosts
  } = useCosts();

  // Filtrar apenas custos de pagamento de mercadoria
  const merchandiseCosts = useMemo(() => {
    if (!companyCosts) return [];
    return companyCosts.filter(cost => cost.is_active && cost.category === 'merchandise');
  }, [companyCosts]);

  // Agrupar custos de mercadoria por descrição (mapeando para os tipos)
  const groupedMerchandiseExpenses = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    // Inicializar todas as categorias de mercadoria
    Object.keys(merchandisePaymentCategories).forEach(expenseKey => {
      grouped[expenseKey] = [];
    });
    merchandiseCosts.forEach(cost => {
      // Mapear a descrição do custo para o tipo de mercadoria
      const description = cost.description.toLowerCase();
      let expenseType = 'merchandise_payment';
      if (description.includes('equipamento') || description.includes('equipment')) expenseType = 'equipment';else if (description.includes('insumo') || description.includes('supplies')) expenseType = 'supplies';else if (description.includes('matéria') || description.includes('prima') || description.includes('raw material')) expenseType = 'raw_material';else if (description.includes('rhid')) expenseType = 'rhid';else if (description.includes('mercadoria') || description.includes('merchandise')) expenseType = 'merchandise_payment';
      if (grouped[expenseType]) {
        grouped[expenseType].push(cost);
      }
    });
    return grouped;
  }, [merchandiseCosts]);

  // Calcular totais mensais por tipo de pagamento de mercadoria
  const monthlyMerchandiseTotals = useMemo(() => {
    const totals: Record<string, Record<number, number>> = {};
    Object.keys(merchandisePaymentCategories).forEach(expenseKey => {
      const costs = groupedMerchandiseExpenses[expenseKey] || [];
      totals[expenseKey] = {};

      // Para cada mês
      for (let month = 0; month < 12; month++) {
        totals[expenseKey][month] = costs.reduce((sum, cost) => {
          return sum + (cost.monthly_cost || 0);
        }, 0);
      }
    });
    return totals;
  }, [groupedMerchandiseExpenses]);

  // Calcular totais gerais de mercadoria
  const grandMerchandiseTotals = useMemo(() => {
    const totals = {
      monthly: new Array(12).fill(0),
      annual: 0
    };
    Object.values(monthlyMerchandiseTotals).forEach(expenseTotals => {
      Object.entries(expenseTotals).forEach(([month, value]) => {
        totals.monthly[parseInt(month)] += value;
        totals.annual += value;
      });
    });
    return totals;
  }, [monthlyMerchandiseTotals]);

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-800 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl font-bold">PAGAMENTO DE MERCADORIA</CardTitle>
              <p className="text-green-100 text-sm">Custos de Produtos e Materiais</p>
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
              {Object.entries(merchandisePaymentCategories).map(([key, category]) => {
                const monthlyTotals = monthlyMerchandiseTotals[key] || {};
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
                    <span>TOTAL PAGAMENTO MERCADORIA</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono">
                  {formatMonetaryValue(grandMerchandiseTotals.annual / 12)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {formatMonetaryValue(grandMerchandiseTotals.annual)}
                </TableCell>
                {grandMerchandiseTotals.monthly.map((total: number, index: number) => (
                  <TableCell key={index} className="text-center font-mono">
                    {formatMonetaryValue(total)}
                  </TableCell>
                ))}
                <TableCell className="text-center font-mono font-bold">
                  {formatMonetaryValue(grandMerchandiseTotals.annual)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
export default MerchandisePaymentTable;