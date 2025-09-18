import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Receipt, Settings, Pencil } from "lucide-react";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { useMonthlyFinancialCosts } from "@/hooks/useMonthlyFinancialCosts";
import { MonthlyFinancialCostEditor } from "@/components/MonthlyFinancialCostEditor";
import { FinancialCategoryManager } from "@/components/FinancialCategoryManager";
import { useContracts } from "@/hooks/useContracts";
const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
interface ImpostosItem {
  categoryId: string;
  categoryName: string;
  monthlyValues: number[];
  totalValue: number;
  monthlyAverage: number;
  annualTotal: number;
}
interface ImpostosAnalysisViewProps {
  selectedYear: number;
}
const ImpostosAnalysisView = ({
  selectedYear
}: ImpostosAnalysisViewProps) => {
  const [viewType, setViewType] = useState<"summary" | "detailed">("summary");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showCostEditor, setShowCostEditor] = useState(false);
  const [editingCostData, setEditingCostData] = useState<{
    categoryId: string;
    year: number;
    month: number;
    value: number;
  } | null>(null);
  const {
    data: categories
  } = useFinancialCategories("impostos");
  const {
    data: costs
  } = useMonthlyFinancialCosts(selectedYear);
  const { contracts } = useContracts();

  // Helper para verificar se o contrato está encerrado
  const parseDateString = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  };

  const isContractTerminated = (month: number): boolean => {
    if (!contracts || contracts.length === 0) return false;
    
    // Verifica se algum contrato ativo foi encerrado
    return contracts.some(contract => {
      const termination = parseDateString(contract.termination_date);
      if (!termination) return false;
      
      const termYear = termination.getFullYear();
      const termMonth = termination.getMonth();
      
      // Se o contrato foi encerrado, parar de mostrar valores APÓS o mês de encerramento
      if (selectedYear > termYear || (selectedYear === termYear && month > termMonth)) {
        return true;
      }
      return false;
    });
  };

  // Calcular dados de IMPOSTOS
  const impostosData = useMemo((): ImpostosItem[] => {
    if (!categories || !costs) return [];
    return categories.map(category => {
      const monthlyValues = Array.from({
        length: 12
      }, (_, monthIndex) => {
        // Se o contrato está encerrado, retornar 0
        if (isContractTerminated(monthIndex)) {
          return 0;
        }
        const monthCosts = costs.filter(cost => cost.category_id === category.id && cost.month === monthIndex + 1);
        return monthCosts.reduce((sum, cost) => sum + cost.value, 0);
      });
      const totalValue = monthlyValues.reduce((sum, value) => sum + value, 0);
      return {
        categoryId: category.id,
        categoryName: category.name,
        monthlyValues,
        totalValue,
        monthlyAverage: parseFloat((totalValue / 12).toFixed(2)),
        annualTotal: totalValue
      };
    });
  }, [categories, costs, selectedYear, contracts]);

  // Calcular totais
  const totals = useMemo(() => {
    const totalAnual = impostosData.reduce((sum, item) => sum + item.totalValue, 0);
    const totalMensal = parseFloat((totalAnual / 12).toFixed(2));
    return {
      totalMensal,
      totalAnual
    };
  }, [impostosData]);
  const handleEditCost = (categoryId: string, monthIndex: number, currentValue: number) => {
    setEditingCostData({
      categoryId,
      year: selectedYear,
      month: monthIndex + 1,
      value: currentValue
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
export default ImpostosAnalysisView;