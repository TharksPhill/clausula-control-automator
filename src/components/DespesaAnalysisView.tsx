import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrendingDown, Settings, Pencil } from "lucide-react";
import { useCosts } from "@/hooks/useCosts";
import { useFinancialCategories, useCreateFinancialCategory } from "@/hooks/useFinancialCategories";
import { useMonthlyFinancialCosts } from "@/hooks/useMonthlyFinancialCosts";
import { FinancialCategoryManager } from "@/components/FinancialCategoryManager";
import { MonthlyFinancialCostEditor } from "@/components/MonthlyFinancialCostEditor";
const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
interface DespesaItem {
  category: string;
  categoryId?: string;
  monthlyEstimate: number;
  annualEstimate: number;
  monthlyBreakdown: number[];
  totalValue: number;
}
interface DespesaAnalysisViewProps {
  selectedYear: number;
}
const DespesaAnalysisView = ({
  selectedYear
}: DespesaAnalysisViewProps) => {
  const [viewType, setViewType] = useState<"summary" | "detailed">("summary");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showCostEditor, setShowCostEditor] = useState(false);
  const [editingCostData, setEditingCostData] = useState<{
    categoryId: string;
    year: number;
    month: number;
    value?: number;
  } | null>(null);
  const {
    companyCosts
  } = useCosts();
  const {
    data: despesaCategories
  } = useFinancialCategories("despesas");
  const {
    data: monthlyCosts
  } = useMonthlyFinancialCosts(selectedYear);
  const createCategory = useCreateFinancialCategory();

  // Calcular dados de DESPESA baseado nas categorias financeiras
  const despesaData = useMemo((): DespesaItem[] => {
    if (!despesaCategories) return [];
    return despesaCategories.map(category => {
      // Buscar custos mensais para esta categoria
      const categoryCosts = monthlyCosts?.filter(cost => cost.category_id === category.id) || [];

      // Criar breakdown mensal
      const monthlyBreakdown = Array.from({
        length: 12
      }, (_, monthIndex) => {
        const monthlyCost = categoryCosts.find(cost => cost.month === monthIndex + 1);
        return monthlyCost?.value || 0;
      });
      const totalValue = monthlyBreakdown.reduce((sum, value) => sum + value, 0);
      const monthlyEstimate = totalValue > 0 ? parseFloat((totalValue / 12).toFixed(2)) : 0;
      const annualEstimate = totalValue;
      return {
        category: category.name,
        categoryId: category.id,
        monthlyEstimate,
        annualEstimate,
        monthlyBreakdown,
        totalValue
      };
    });
  }, [despesaCategories, monthlyCosts]);

  // Calcular totais
  const totals = useMemo(() => {
    const totalAnual = despesaData.reduce((sum, item) => sum + item.totalValue, 0);
    const totalMensal = despesaData.reduce((sum, item) => sum + item.monthlyEstimate, 0);
    return {
      totalMensal,
      totalAnual
    };
  }, [despesaData]);
  const handleCellClick = (categoryId: string, monthIndex: number) => {
    if (!categoryId) return;
    const existingCost = monthlyCosts?.find(cost => cost.category_id === categoryId && cost.month === monthIndex + 1);
    setEditingCostData({
      categoryId,
      year: selectedYear,
      month: monthIndex + 1,
      value: existingCost?.value
    });
    setShowCostEditor(true);
  };
  const handleCloseEditor = () => {
    setShowCostEditor(false);
    setEditingCostData(null);
  };
  return (
    <div className="space-y-6">
      {/* Existing content */}
    </div>
  );
};
export default DespesaAnalysisView;