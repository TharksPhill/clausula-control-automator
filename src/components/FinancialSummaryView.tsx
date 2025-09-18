import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, RefreshCw } from "lucide-react";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { useQueryClient } from "@tanstack/react-query";

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface FinancialSummaryViewProps {
  selectedYear?: number;
}

const FinancialSummaryView: React.FC<FinancialSummaryViewProps> = ({ 
  selectedYear: propSelectedYear 
}) => {
  const [selectedYear, setSelectedYear] = useState(propSelectedYear || new Date().getFullYear());
  const queryClient = useQueryClient();
  const { data: summaryData, isLoading, refetch } = useFinancialSummary(selectedYear);
  
  const handleRefresh = async () => {
    // Invalidar todos os caches relacionados
    await queryClient.invalidateQueries({ queryKey: ["financial-sections"] });
    await queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
    await queryClient.invalidateQueries({ queryKey: ["monthly-financial-costs"] });
    await queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
    // Refetch data
    refetch();
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value)) return "0";
    return Math.abs(value).toLocaleString('pt-BR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatCurrencyWithSign = (value: number, forcePositive: boolean = false) => {
    if (isNaN(value)) return "0";
    const formatted = Math.abs(value).toLocaleString('pt-BR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    if (forcePositive || value >= 0) {
      return formatted;
    }
    return `-${formatted}`;
  };

  // Calcular totais operacionais
  const operationalTotals = useMemo(() => {
    if (!summaryData?.operational) return { revenue: Array(12).fill(0), expense: Array(12).fill(0) };
    
    const revenue = Array(12).fill(0);
    const expense = Array(12).fill(0);
    
    summaryData.operational.forEach(section => {
      section.monthlyTotals.forEach((value, index) => {
        if (section.sectionType === 'revenue') {
          revenue[index] += value;
        } else {
          expense[index] += value;
        }
      });
    });

    return { revenue, expense };
  }, [summaryData]);

  // Calcular totais não operacionais
  const nonOperationalTotals = useMemo(() => {
    if (!summaryData?.nonOperational) return { revenue: Array(12).fill(0), expense: Array(12).fill(0) };
    
    const revenue = Array(12).fill(0);
    const expense = Array(12).fill(0);
    
    summaryData.nonOperational.forEach(section => {
      section.monthlyTotals.forEach((value, index) => {
        if (section.sectionType === 'revenue') {
          revenue[index] += value;
        } else {
          expense[index] += value;
        }
      });
    });

    return { revenue, expense };
  }, [summaryData]);

  // Calcular lucros
  const operationalProfit = useMemo(() => {
    const monthlyTotals = operationalTotals.revenue.map((rev, index) => 
      rev - operationalTotals.expense[index]
    );
    const total = monthlyTotals.reduce((sum, value) => sum + value, 0);
    return { monthlyTotals, total };
  }, [operationalTotals]);

  const nonOperationalResult = useMemo(() => {
    const monthlyTotals = nonOperationalTotals.revenue.map((rev, index) => 
      rev - nonOperationalTotals.expense[index]
    );
    const total = monthlyTotals.reduce((sum, value) => sum + value, 0);
    return { monthlyTotals, total };
  }, [nonOperationalTotals]);

  const netProfit = useMemo(() => {
    const monthlyTotals = operationalProfit.monthlyTotals.map((op, index) => 
      op + nonOperationalResult.monthlyTotals[index]
    );
    const total = monthlyTotals.reduce((sum, value) => sum + value, 0);
    return { monthlyTotals, total };
  }, [operationalProfit, nonOperationalResult]);

  const getRowClass = (itemName: string, isNegative: boolean, isSubItem: boolean = false) => {
    if (isSubItem) {
      return "bg-muted/30 dark:bg-muted/20";
    }
    
    if (itemName === "LUCRO OPERACIONAL" || itemName === "LUCRO LÍQUIDO") {
      return isNegative ? "bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500 dark:border-l-red-400" : "bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500 dark:border-l-green-400";
    }
    
    if (itemName === "RENDA") {
      return "bg-green-50/50 dark:bg-green-900/10";
    }
    
    if (itemName === "DESPESA") {
      return "bg-red-50/50 dark:bg-red-900/10";
    }
    
    return "bg-background dark:bg-background/50";
  };

  const getTextClass = (itemName: string, isNegative: boolean, isSubItem: boolean = false) => {
    if (isSubItem) {
      return "text-muted-foreground";
    }
    
    if (itemName === "LUCRO OPERACIONAL" || itemName === "LUCRO LÍQUIDO") {
      return isNegative ? "text-red-700 dark:text-red-300 font-semibold" : "text-green-700 dark:text-green-300 font-semibold";
    }
    
    if (itemName === "RENDA") {
      return "text-green-700 dark:text-green-300 font-semibold";
    }
    
    if (itemName === "DESPESA") {
      return "text-red-700 dark:text-red-300 font-semibold";
    }
    
    return "text-foreground font-medium";
  };

  const renderTable = (title: string, sections: any[]) => {
    return (
      <Card className="w-full bg-card dark:bg-card border dark:border-border">
        <CardHeader className="pb-4 border-b dark:border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
              {title === "RESUMO" ? (
                <>
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Resumo Operacional
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Resultados Finais
                </>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Atualizar dados"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Ano:</span>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b dark:border-border bg-muted/50 dark:bg-muted/20">
                  <th className="text-left py-3 px-4 font-semibold text-foreground w-48">Categoria</th>
                  <th className="text-center py-3 px-4 font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 min-w-24">
                    Mensal
                  </th>
                  <th className="text-center py-3 px-4 font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 min-w-24">
                    Anual
                  </th>
                  {monthNames.map((month) => (
                    <th key={month} className="text-center py-3 px-2 font-semibold text-foreground min-w-20">
                      {month}
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 min-w-24">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section, sectionIndex) => (
                  <React.Fragment key={sectionIndex}>
                    {section.items.map((item: any, itemIndex: number) => (
                      <tr 
                        key={`${sectionIndex}-${itemIndex}`} 
                        className={`border-b dark:border-border/50 hover:bg-muted/20 dark:hover:bg-muted/10 transition-colors ${getRowClass(item.name, item.isNegative, item.isSubItem)}`}
                      >
                        <td className={`py-3 px-4 ${item.isSubItem ? 'pl-8 text-sm' : ''} ${getTextClass(item.name, item.isNegative, item.isSubItem)}`}>
                          {item.name}
                        </td>
                        
                        <td className={`text-center py-3 px-4 font-semibold bg-yellow-50 dark:bg-yellow-900/20 ${
                          (item.name === "LUCRO OPERACIONAL" || item.name === "LUCRO LÍQUIDO" || item.name === "NÃO OPERACIONAL") && item.data.total < 0 
                            ? "text-red-700 dark:text-red-300" 
                            : (item.name === "LUCRO OPERACIONAL" || item.name === "LUCRO LÍQUIDO" || item.name === "NÃO OPERACIONAL") && item.data.total >= 0
                            ? "text-green-700 dark:text-green-300"
                            : item.name === "DESPESA" || item.name.includes("(Despesa)")
                            ? "text-red-700 dark:text-red-300"
                            : "text-yellow-700 dark:text-yellow-300"
                        }`}>
                          {item.name === "LUCRO OPERACIONAL" || item.name === "LUCRO LÍQUIDO" || item.name === "NÃO OPERACIONAL" ? 
                            formatCurrencyWithSign(item.data.total / 12) : 
                            (item.name === "DESPESA" || item.name.includes("(Despesa)")) && item.data.total !== 0 ? '-' + formatCurrency(item.data.total / 12) : 
                            formatCurrency(item.data.total / 12)
                          }
                        </td>
                        
                        <td className={`text-center py-3 px-4 font-semibold bg-orange-50 dark:bg-orange-900/20 ${
                          (item.name === "LUCRO OPERACIONAL" || item.name === "LUCRO LÍQUIDO" || item.name === "NÃO OPERACIONAL") && item.data.total < 0 
                            ? "text-red-700 dark:text-red-300" 
                            : (item.name === "LUCRO OPERACIONAL" || item.name === "LUCRO LÍQUIDO" || item.name === "NÃO OPERACIONAL") && item.data.total >= 0
                            ? "text-green-700 dark:text-green-300"
                            : item.name === "DESPESA" || item.name.includes("(Despesa)")
                            ? "text-red-700 dark:text-red-300"
                            : "text-orange-700 dark:text-orange-300"
                        }`}>
                          {item.name === "LUCRO OPERACIONAL" || item.name === "LUCRO LÍQUIDO" || item.name === "NÃO OPERACIONAL" ? 
                            formatCurrencyWithSign(item.data.total) : 
                            (item.name === "DESPESA" || item.name.includes("(Despesa)")) && item.data.total !== 0 ? '-' + formatCurrency(item.data.total) : 
                            formatCurrency(item.data.total)
                          }
                        </td>
                        
                        {item.data.monthlyTotals.map((value: number, index: number) => (
                          <td key={index} className={`text-center py-3 px-2 font-mono text-sm bg-background dark:bg-background/50 ${
                            (item.name === "LUCRO OPERACIONAL" || item.name === "LUCRO LÍQUIDO" || item.name === "NÃO OPERACIONAL") && value < 0 
                              ? "text-red-600 dark:text-red-400" 
                              : (item.name === "LUCRO OPERACIONAL" || item.name === "LUCRO LÍQUIDO" || item.name === "NÃO OPERACIONAL") && value >= 0
                              ? "text-green-600 dark:text-green-400"
                              : item.name === "DESPESA" || item.name.includes("(Despesa)")
                              ? "text-red-600 dark:text-red-400"
                              : "text-foreground"
                          }`}>
                            {item.name === "LUCRO OPERACIONAL" || item.name === "LUCRO LÍQUIDO" || item.name === "NÃO OPERACIONAL" ? 
                              formatCurrencyWithSign(value) : 
                              (item.name === "DESPESA" || item.name.includes("(Despesa)")) && value !== 0 ? '-' + formatCurrency(value) : 
                              formatCurrency(value)
                            }
                          </td>
                        ))}
                        
                        <td className={`text-center py-3 px-4 font-semibold bg-green-50 dark:bg-green-900/20 ${
                          (item.name === "LUCRO OPERACIONAL" || item.name === "LUCRO LÍQUIDO" || item.name === "NÃO OPERACIONAL") && item.data.total < 0 
                            ? "text-red-700 dark:text-red-300" 
                            : (item.name === "LUCRO OPERACIONAL" || item.name === "LUCRO LÍQUIDO" || item.name === "NÃO OPERACIONAL") && item.data.total >= 0
                            ? "text-green-700 dark:text-green-300"
                            : item.name === "DESPESA" || item.name.includes("(Despesa)")
                            ? "text-red-700 dark:text-red-300"
                            : "text-green-700 dark:text-green-300"
                        }`}>
                          {item.name === "LUCRO OPERACIONAL" || item.name === "LUCRO LÍQUIDO" || item.name === "NÃO OPERACIONAL" ? 
                            formatCurrencyWithSign(item.data.total) : 
                            (item.name === "DESPESA" || item.name.includes("(Despesa)")) && item.data.total !== 0 ? '-' + formatCurrency(item.data.total) : 
                            formatCurrency(item.data.total)
                          }
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando dados financeiros...</div>
      </div>
    );
  }

  const revenueOperationalTotal = operationalTotals.revenue.reduce((sum, value) => sum + value, 0);
  const expenseOperationalTotal = operationalTotals.expense.reduce((sum, value) => sum + value, 0);

  const firstSection = [
    {
      items: [
        { name: "RENDA", data: { monthlyTotals: operationalTotals.revenue, total: revenueOperationalTotal }, isNegative: false },
        ...(summaryData?.operational.filter(s => s.sectionType === 'revenue').map(section => ({
          name: section.sectionName,
          data: { monthlyTotals: section.monthlyTotals, total: section.total },
          isNegative: false,
          isSubItem: true
        })) || []),
        { name: "DESPESA", data: { monthlyTotals: operationalTotals.expense, total: expenseOperationalTotal }, isNegative: false },
        ...(summaryData?.operational.filter(s => s.sectionType === 'expense').map(section => ({
          name: section.sectionName,
          data: { monthlyTotals: section.monthlyTotals, total: section.total },
          isNegative: false,
          isSubItem: true
        })) || []),
        { name: "LUCRO OPERACIONAL", data: operationalProfit, isNegative: operationalProfit.total < 0 }
      ]
    }
  ];

  const secondSection = [
    {
      items: [
        { name: "NÃO OPERACIONAL", data: nonOperationalResult, isNegative: nonOperationalResult.total < 0 },
        ...(summaryData?.nonOperational.filter(s => s.sectionType === 'revenue').map(section => ({
          name: `${section.sectionName} (Receita)`,
          data: { monthlyTotals: section.monthlyTotals, total: section.total },
          isNegative: false,
          isSubItem: true
        })) || []),
        ...(summaryData?.nonOperational.filter(s => s.sectionType === 'expense').map(section => ({
          name: `${section.sectionName} (Despesa)`,
          data: { monthlyTotals: section.monthlyTotals, total: section.total },
          isNegative: false,
          isSubItem: true
        })) || []),
        { name: "LUCRO LÍQUIDO", data: netProfit, isNegative: netProfit.total < 0 }
      ]
    }
  ];

  return (
    <div className="w-full space-y-6">
      {renderTable("RESUMO", firstSection)}
      {renderTable("", secondSection)}
    </div>
  );
};

export default FinancialSummaryView;