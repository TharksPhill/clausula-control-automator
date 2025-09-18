import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Calculator } from "lucide-react";
import { useCosts } from "@/hooks/useCosts";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";

// Categorias não operacionais baseadas na imagem de referência
const nonOperationalCategories = {
  non_operational_revenue: {
    label: "Receita Não Operacional",
    color: "bg-slate-600/10 text-slate-900"
  },
  leisure_area_rental: {
    label: "Aluguel Area de Lazer",
    color: "bg-gray-600/10 text-gray-900"
  },
  working_capital: {
    label: "Capital De Giro",
    color: "bg-zinc-600/10 text-zinc-900"
  },
  investment_yields: {
    label: "Rendimentos Aplicações",
    color: "bg-stone-600/10 text-stone-900"
  },
  investment_redemption: {
    label: "Resgate Investimento",
    color: "bg-neutral-600/10 text-neutral-900"
  },
  other: {
    label: "Outro",
    color: "bg-gray-500/10 text-gray-800"
  }
};
const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
interface NonOperationalTableProps {
  selectedYear?: number;
}
const NonOperationalTable: React.FC<NonOperationalTableProps> = ({
  selectedYear = new Date().getFullYear()
}) => {
  const [viewType, setViewType] = useState<"summary" | "detailed">("summary");
  const {
    companyCosts
  } = useCosts();

  // Filtrar apenas custos não operacionais
  const nonOperationalCosts = useMemo(() => {
    if (!companyCosts) return [];
    return companyCosts.filter(cost => cost.is_active && cost.category === 'non_operational');
  }, [companyCosts]);

  // Agrupar custos não operacionais por descrição (mapeando para os tipos)
  const groupedNonOperationalExpenses = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    // Inicializar todas as categorias não operacionais
    Object.keys(nonOperationalCategories).forEach(expenseKey => {
      grouped[expenseKey] = [];
    });
    nonOperationalCosts.forEach(cost => {
      // Mapear a descrição do custo para o tipo não operacional
      const description = cost.description.toLowerCase();
      let expenseType = 'other';
      if (description.includes('receita') && description.includes('não') && description.includes('operacional')) expenseType = 'non_operational_revenue';else if (description.includes('aluguel') && description.includes('area') && description.includes('lazer')) expenseType = 'leisure_area_rental';else if (description.includes('capital') && description.includes('giro')) expenseType = 'working_capital';else if (description.includes('rendimento') || description.includes('aplicações') || description.includes('investment yields')) expenseType = 'investment_yields';else if (description.includes('resgate') && description.includes('investimento')) expenseType = 'investment_redemption';else if (description.includes('outro') || description.includes('other')) expenseType = 'other';
      if (grouped[expenseType]) {
        grouped[expenseType].push(cost);
      }
    });
    return grouped;
  }, [nonOperationalCosts]);

  // Calcular totais mensais por tipo de despesa não operacional
  const monthlyNonOperationalTotals = useMemo(() => {
    const totals: Record<string, Record<number, number>> = {};
    Object.keys(nonOperationalCategories).forEach(expenseKey => {
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

  // Calcular totais gerais não operacionais
  const grandNonOperationalTotals = useMemo(() => {
    const totals = {
      monthly: new Array(12).fill(0),
      annual: 0
    };
    Object.values(monthlyNonOperationalTotals).forEach(expenseTotals => {
      Object.entries(expenseTotals).forEach(([month, value]) => {
        totals.monthly[parseInt(month)] += value;
        totals.annual += value;
      });
    });
    return totals;
  }, [monthlyNonOperationalTotals]);

  return null; // Temporariamente retornando null até ser implementado
};
export default NonOperationalTable;