import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrendingUp, Plus, Settings, Pencil } from "lucide-react";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { useMonthlyFinancialCosts } from "@/hooks/useMonthlyFinancialCosts";
import { FinancialCategoryManager } from "@/components/FinancialCategoryManager";
import { MonthlyFinancialCostEditor } from "@/components/MonthlyFinancialCostEditor";
const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
interface RendaItem {
  category: string;
  categoryId?: string;
  monthlyEstimate: number;
  annualEstimate: number;
  monthlyBreakdown: number[];
  totalValue: number;
}
interface RendaAnalysisViewProps {
  selectedYear: number;
}
const RendaAnalysisView = ({
  selectedYear
}: RendaAnalysisViewProps) => {
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
    data: rendaCategories
  } = useFinancialCategories("renda");
  const {
    data: monthlyCosts
  } = useMonthlyFinancialCosts(selectedYear);

  // Calcular dados de RENDA baseado nas categorias financeiras
  const rendaData = useMemo((): RendaItem[] => {
    if (!rendaCategories) return [];
    return rendaCategories.map(category => {
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
  }, [rendaCategories, monthlyCosts]);

  // Calcular totais
  const totals = useMemo(() => {
    const totalAnual = rendaData.reduce((sum, item) => sum + item.totalValue, 0);
    const totalMensal = rendaData.reduce((sum, item) => sum + item.monthlyEstimate, 0);
    return {
      totalMensal,
      totalAnual
    };
  }, [rendaData]);
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
export default RendaAnalysisView;