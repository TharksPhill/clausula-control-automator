import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Filter, Download, RefreshCw, Target, Calendar, Eye, EyeOff, Trophy, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { useMonthlyFinancialCosts } from "@/hooks/useMonthlyFinancialCosts";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useContracts } from "@/hooks/useContracts";

interface FinancialDashboardProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  selectedYear,
  onYearChange,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState<"overview" | "detailed" | "trends">("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "renda" | "despesas" | "impostos">("all");
  const [annualGoal, setAnnualGoal] = useState<number>(0);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [tempGoal, setTempGoal] = useState<string>("");
  const [summaryViewMode, setSummaryViewMode] = useState<"monthly" | "annual">("monthly");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sectionPages, setSectionPages] = useState<Record<string, number>>({});
  
  const queryClient = useQueryClient();
  
  // Get contracts data for tooltips
  const { contracts = [] } = useContracts();

  const { data: rendaCategories = [] } = useFinancialCategories("renda");
  const { data: despesaCategories = [] } = useFinancialCategories("despesas");
  const { data: impostosCategories = [] } = useFinancialCategories("impostos");
  const { data: monthlyCosts = [] } = useMonthlyFinancialCosts(selectedYear);
  const { data: financialSummaryData } = useFinancialSummary(selectedYear);

  const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

  // Carregar meta salva do localStorage
  useEffect(() => {
    const savedGoal = localStorage.getItem(`financialGoal_${selectedYear}`);
    if (savedGoal) {
      setAnnualGoal(parseFloat(savedGoal));
    } else {
      setAnnualGoal(0);
    }
  }, [selectedYear]);

  // Formatar valor para exibição
  const formatInputValue = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    // Converte para número e divide por 100 para considerar centavos
    const amount = parseFloat(numbers) / 100;
    
    // Formata como moeda brasileira
    if (isNaN(amount)) return '';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Handle input change com formatação
  const handleGoalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatInputValue(value);
    setTempGoal(formatted);
  };

  // Salvar meta no localStorage
  const handleSaveGoal = () => {
    // Remove o símbolo de moeda e espaços, substitui vírgula por ponto
    const cleanValue = tempGoal
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    const goalValue = parseFloat(cleanValue);
    
    if (!isNaN(goalValue) && goalValue > 0) {
      setAnnualGoal(goalValue);
      localStorage.setItem(`financialGoal_${selectedYear}`, goalValue.toString());
      setShowGoalDialog(false);
      setTempGoal("");
      toast.success("Meta anual salva com sucesso!");
    } else {
      toast.error("Por favor, insira um valor válido");
    }
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular dados do dashboard usando a mesma fonte do Resumo Operacional
  const dashboardData = useMemo(() => {
    if (!financialSummaryData?.operational) {
      return {
        rendaMensal: 0,
        rendaAnual: 0,
        despesaMensal: 0,
        despesaAnual: 0,
        impostosMensal: 0,
        impostosAnual: 0,
        saldoMensal: 0,
        saldoAnual: 0,
        dadosMensais: Array(12).fill({ mes: '', receita: 0, despesa: 0, imposto: 0, saldo: 0 })
      };
    }

    // Buscar receitas operacionais (mesmo cálculo do Resumo Operacional)
    const operationalRevenueSections = financialSummaryData.operational.filter(section => section.sectionType === 'revenue');
    const operationalExpenseSections = financialSummaryData.operational.filter(section => section.sectionType === 'expense');
    
    // Para impostos, usar dados não operacionais
    const nonOperationalRevenueSections = financialSummaryData.nonOperational?.filter(section => section.sectionType === 'revenue') || [];
    const nonOperationalExpenseSections = financialSummaryData.nonOperational?.filter(section => section.sectionType === 'expense') || [];

    // Aplicar filtro de categoria
    let filteredRevenueSections = operationalRevenueSections;
    let filteredExpenseSections = operationalExpenseSections;
    let filteredNonOpRevenueSections = nonOperationalRevenueSections;
    let filteredNonOpExpenseSections = nonOperationalExpenseSections;
    
    if (selectedCategory === 'renda') {
      filteredExpenseSections = [];
      filteredNonOpExpenseSections = [];
    } else if (selectedCategory === 'despesas') {
      filteredRevenueSections = [];
      filteredNonOpRevenueSections = [];
    } else if (selectedCategory === 'impostos') {
      filteredRevenueSections = [];
      filteredExpenseSections = [];
      filteredNonOpRevenueSections = [];
    }

    // Calcular valores baseado no viewMode
    let rendaOperacionalMensal = 0;
    let rendaOperacionalAnual = 0;
    let despesaOperacionalMensal = 0;
    let despesaOperacionalAnual = 0;
    let rendaNaoOperacionalMensal = 0;
    let rendaNaoOperacionalAnual = 0;
    let despesaNaoOperacionalMensal = 0;
    let despesaNaoOperacionalAnual = 0;
    
    if (viewMode === 'trends') {
      // Modo tendências: calcular médias dos últimos 3 meses e projetar
      const lastThreeMonths = [selectedMonth - 3, selectedMonth - 2, selectedMonth - 1].map(m => m >= 0 ? m : m + 12);
      
      const avgReceitaOp = lastThreeMonths.reduce((sum, month) => {
        return sum + filteredRevenueSections.reduce((s, section) => s + (section.monthlyTotals[month] || 0), 0);
      }, 0) / 3;
      
      const avgDespesaOp = lastThreeMonths.reduce((sum, month) => {
        return sum + filteredExpenseSections.reduce((s, section) => s + (section.monthlyTotals[month] || 0), 0);
      }, 0) / 3;
      
      const avgReceitaNaoOp = lastThreeMonths.reduce((sum, month) => {
        return sum + filteredNonOpRevenueSections.reduce((s, section) => s + (section.monthlyTotals[month] || 0), 0);
      }, 0) / 3;
      
      const avgDespesaNaoOp = lastThreeMonths.reduce((sum, month) => {
        return sum + filteredNonOpExpenseSections.reduce((s, section) => s + (section.monthlyTotals[month] || 0), 0);
      }, 0) / 3;
      
      rendaOperacionalMensal = avgReceitaOp;
      despesaOperacionalMensal = avgDespesaOp;
      rendaNaoOperacionalMensal = avgReceitaNaoOp;
      despesaNaoOperacionalMensal = avgDespesaNaoOp;
      rendaOperacionalAnual = avgReceitaOp * 12;
      despesaOperacionalAnual = avgDespesaOp * 12;
      rendaNaoOperacionalAnual = avgReceitaNaoOp * 12;
      despesaNaoOperacionalAnual = avgDespesaNaoOp * 12;
    } else {
      // Modo overview ou detailed: valores reais
      rendaOperacionalMensal = filteredRevenueSections.reduce((sum, section) => {
        return sum + (section.monthlyTotals[selectedMonth - 1] || 0);
      }, 0);

      rendaOperacionalAnual = filteredRevenueSections.reduce((sum, section) => {
        return sum + section.total;
      }, 0);

      despesaOperacionalMensal = filteredExpenseSections.reduce((sum, section) => {
        return sum + (section.monthlyTotals[selectedMonth - 1] || 0);
      }, 0);

      despesaOperacionalAnual = filteredExpenseSections.reduce((sum, section) => {
        return sum + section.total;
      }, 0);
      
      rendaNaoOperacionalMensal = filteredNonOpRevenueSections.reduce((sum, section) => {
        return sum + (section.monthlyTotals[selectedMonth - 1] || 0);
      }, 0);

      rendaNaoOperacionalAnual = filteredNonOpRevenueSections.reduce((sum, section) => {
        return sum + section.total;
      }, 0);
      
      despesaNaoOperacionalMensal = filteredNonOpExpenseSections.reduce((sum, section) => {
        return sum + (section.monthlyTotals[selectedMonth - 1] || 0);
      }, 0);

      despesaNaoOperacionalAnual = filteredNonOpExpenseSections.reduce((sum, section) => {
        return sum + section.total;
      }, 0);
    }
    
    // Calcular totais combinados para compatibilidade
    const rendaMensal = rendaOperacionalMensal;
    const rendaAnual = rendaOperacionalAnual;
    const despesaMensal = despesaOperacionalMensal;
    const despesaAnual = despesaOperacionalAnual;
    const impostosMensal = despesaNaoOperacionalMensal;
    const impostosAnual = despesaNaoOperacionalAnual;

    // Calcular lucro operacional e lucro líquido corretamente
    const lucroOperacionalMensal = rendaOperacionalMensal - despesaOperacionalMensal;
    const lucroOperacionalAnual = rendaOperacionalAnual - despesaOperacionalAnual;
    
    // Resultado não operacional
    const resultadoNaoOperacionalMensal = rendaNaoOperacionalMensal - despesaNaoOperacionalMensal;
    const resultadoNaoOperacionalAnual = rendaNaoOperacionalAnual - despesaNaoOperacionalAnual;
    
    // Lucro líquido = Lucro Operacional + Resultado Não Operacional
    const saldoMensal = lucroOperacionalMensal + resultadoNaoOperacionalMensal;
    const saldoAnual = lucroOperacionalAnual + resultadoNaoOperacionalAnual;
    
    // Log detalhado do cálculo do lucro líquido
    console.log('💰 CÁLCULO DO LUCRO LÍQUIDO (Idêntico ao Resumo Operacional):', {
      mes: monthNames[selectedMonth - 1],
      receita_operacional: rendaOperacionalMensal,
      despesa_operacional: despesaOperacionalMensal,
      lucro_operacional: lucroOperacionalMensal,
      receita_nao_operacional: rendaNaoOperacionalMensal,
      despesa_nao_operacional: despesaNaoOperacionalMensal,
      resultado_nao_operacional: resultadoNaoOperacionalMensal,
      lucro_liquido_calculado: saldoMensal,
      formula: `(${rendaOperacionalMensal} - ${despesaOperacionalMensal}) + (${rendaNaoOperacionalMensal} - ${despesaNaoOperacionalMensal}) = ${saldoMensal}`
    });

    // Dados mensais para gráfico de barras
    const dadosMensais = Array.from({ length: 12 }, (_, monthIndex) => {
      const receita = filteredRevenueSections.reduce((sum, section) => {
        return sum + (section.monthlyTotals[monthIndex] || 0);
      }, 0);
      
      const despesa = filteredExpenseSections.reduce((sum, section) => {
        return sum + (section.monthlyTotals[monthIndex] || 0);
      }, 0);

      const imposto = filteredNonOpExpenseSections.reduce((sum, section) => {
        return sum + (section.monthlyTotals[monthIndex] || 0);
      }, 0);

      return {
        mes: monthNames[monthIndex],
        receita,
        despesa,
        imposto,
        saldo: receita - despesa - imposto
      };
    });

    console.log('📊 DASHBOARD DATA CALCULADO:', {
      mes_selecionado: selectedMonth,
      categoria_filtro: selectedCategory,
      view_mode: viewMode,
      renda_mensal: rendaMensal,
      despesa_mensal: despesaMensal,
      impostos_mensal: impostosMensal,
      saldo_mensal: saldoMensal
    });

    return {
      rendaMensal,
      rendaAnual,
      despesaMensal,
      despesaAnual,
      impostosMensal,
      impostosAnual,
      saldoMensal,
      saldoAnual,
      dadosMensais
    };
  }, [selectedMonth, selectedYear, financialSummaryData, selectedCategory, viewMode]);

  // Calcular percentuais para gráficos circulares
  const percentuais = useMemo(() => {
    const totalReceita = dashboardData.rendaAnual;
    const totalDespesa = dashboardData.despesaAnual + dashboardData.impostosAnual;
    
    if (totalReceita === 0) return { receita: 0, despesa: 0, impostos: 0 };

    return {
      receita: Math.round((dashboardData.rendaAnual / totalReceita) * 100),
      despesa: Math.round((dashboardData.despesaAnual / totalReceita) * 100),
      impostos: Math.round((dashboardData.impostosAnual / totalReceita) * 100)
    };
  }, [dashboardData]);

  // Dados para gráfico de pizza - médias mensais de todas as seções
  const pieChartData = useMemo(() => {
    const sections = [];
    
    // Cores pré-definidas para cada tipo de seção
    const colorMap = {
      revenue: ['#10b981', '#22c55e', '#34d399', '#4ade80', '#6ee7b7'],
      expense: ['#ef4444', '#f87171', '#fca5a5', '#fbbf24', '#fb923c'],
      nonOperational: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7']
    };
    
    // Adicionar seções de receita operacional
    if (financialSummaryData?.operational) {
      const revenueSections = financialSummaryData.operational.filter(s => s.sectionType === 'revenue');
      revenueSections.forEach((section, index) => {
        const monthlyAvg = section.total / 12;
        if (monthlyAvg > 0) {
          sections.push({
            name: section.sectionName,
            value: monthlyAvg,
            color: colorMap.revenue[index % colorMap.revenue.length],
            type: 'revenue'
          });
        }
      });
      
      // Adicionar seções de despesa operacional
      const expenseSections = financialSummaryData.operational.filter(s => s.sectionType === 'expense');
      expenseSections.forEach((section, index) => {
        const monthlyAvg = section.total / 12;
        if (monthlyAvg > 0) {
          sections.push({
            name: section.sectionName,
            value: monthlyAvg,
            color: colorMap.expense[index % colorMap.expense.length],
            type: 'expense'
          });
        }
      });
    }
    
    // Adicionar seções não operacionais
    if (financialSummaryData?.nonOperational) {
      financialSummaryData.nonOperational.forEach((section, index) => {
        const monthlyAvg = section.total / 12;
        if (monthlyAvg > 0) {
          sections.push({
            name: section.sectionName,
            value: monthlyAvg,
            color: colorMap.nonOperational[index % colorMap.nonOperational.length],
            type: 'nonOperational'
          });
        }
      });
    }
    
    return sections;
  }, [financialSummaryData]);

  // Dados para gráfico de barras comparativo
  const barChartData = useMemo(() => 
    dashboardData.dadosMensais.map(dados => ({
      mes: dados.mes,
      receita: dados.receita,
      despesa: dados.despesa,
      impostos: dados.imposto,
      saldo: dados.saldo
    })), [dashboardData]);

  // Cores dinâmicas baseadas no desempenho
  const getPerformanceColor = (value: number) => {
    if (value > 0) return "text-green-600 dark:text-green-400";
    if (value < 0) return "text-red-600 dark:text-red-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  const getPerformanceBg = (value: number) => {
    if (value > 0) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    if (value < 0) return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
  };

  // Função para atualizar dados
  const handleRefreshData = async () => {
    try {
      await queryClient.invalidateQueries();
      toast.success("Dados atualizados com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar dados");
    }
  };

  // Função para exportar dados
  const handleExportData = () => {
    try {
      const dataToExport = {
        ano: selectedYear,
        mes: monthNames[selectedMonth - 1],
        resumo: {
          receitaMensal: dashboardData.rendaMensal,
          receitaAnual: dashboardData.rendaAnual,
          despesaMensal: dashboardData.despesaMensal,
          despesaAnual: dashboardData.despesaAnual,
          impostosMensal: dashboardData.impostosMensal,
          impostosAnual: dashboardData.impostosAnual,
          saldoMensal: dashboardData.saldoMensal,
          saldoAnual: dashboardData.saldoAnual
        },
        dadosMensais: dashboardData.dadosMensais
      };

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-financeiro-${selectedYear}-${selectedMonth}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar relatório");
    }
  };

  // Toggle expanded state for sections
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Aprimorado com Filtros e Ações */}
      <Card className="border-border animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                Painel de Desempenho Financeiro
              </CardTitle>
              <p className="text-muted-foreground mt-1">Visão completa das suas finanças empresariais</p>
            </div>
            
            {/* Controles e Filtros */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                {showFilters ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                Filtros
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleRefreshData}
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>

              <Dialog open={showGoalDialog} onOpenChange={(open) => {
                setShowGoalDialog(open);
                if (open && annualGoal > 0) {
                  // Formatar o valor existente quando abrir o diálogo
                  setTempGoal(formatCurrency(annualGoal));
                } else if (!open) {
                  setTempGoal("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                  >
                    <Trophy className="h-4 w-4" />
                    Meta
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Definir Meta Anual para {selectedYear}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="goal" className="text-sm font-medium">
                        Valor da Meta (R$)
                      </label>
                      <Input
                        id="goal"
                        type="text"
                        placeholder="R$ 1.000.000,00"
                        value={tempGoal}
                        onChange={handleGoalInputChange}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Insira o valor que deseja alcançar de receita anual
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowGoalDialog(false);
                          setTempGoal("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveGoal}>
                        Salvar Meta
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filtros Expandidos */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border animate-fade-in">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Visualizar:</span>
              </div>
              <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  <SelectItem value="renda">Apenas receitas</SelectItem>
                  <SelectItem value="despesas">Apenas despesas</SelectItem>
                  <SelectItem value="impostos">Apenas impostos</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                {["overview", "detailed", "trends"].map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode(mode as any)}
                    className="capitalize"
                  >
                    {mode === "overview" && <Eye className="h-4 w-4 mr-1" />}
                    {mode === "detailed" && <Target className="h-4 w-4 mr-1" />}
                    {mode === "trends" && <TrendingUp className="h-4 w-4 mr-1" />}
                    {mode === "overview" ? "Visão Geral" : mode === "detailed" ? "Detalhado" : "Tendências"}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Meta Anual Progress Card */}
      <Card className="border-border animate-fade-in bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Meta Anual {selectedYear}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {annualGoal > 0 ? 'Progresso da meta de receita' : 'Configure sua meta de receita anual'}
                </p>
              </div>
            </div>
            <Button
              variant={annualGoal > 0 ? "ghost" : "default"}
              size="sm"
              onClick={() => {
                if (annualGoal > 0) {
                  setTempGoal(formatCurrency(annualGoal));
                }
                setShowGoalDialog(true);
              }}
              className={annualGoal > 0 ? "text-xs" : "text-xs"}
            >
              {annualGoal > 0 ? 'Editar' : 'Definir Meta'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {annualGoal > 0 ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receita Atual</span>
                  <span className="font-semibold text-primary">{formatCurrency(dashboardData.rendaAnual)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Meta Anual</span>
                  <span className="font-semibold">{formatCurrency(annualGoal)}</span>
                </div>
              </div>

              {/* Progress Bar Thermometer Style */}
              <div className="relative">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>0%</span>
                  <span className="font-bold text-primary text-base">
                    {Math.min(Math.round((dashboardData.rendaAnual / annualGoal) * 100), 100)}%
                  </span>
                  <span>100%</span>
                </div>
                <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                    style={{ 
                      width: `${Math.min((dashboardData.rendaAnual / annualGoal) * 100, 100)}%`,
                      minWidth: dashboardData.rendaAnual > 0 ? '40px' : '0'
                    }}
                  >
                    {dashboardData.rendaAnual / annualGoal > 0.1 && (
                      <div className="text-xs text-primary-foreground font-bold">
                        {Math.min(Math.round((dashboardData.rendaAnual / annualGoal) * 100), 100)}%
                      </div>
                    )}
                  </div>
                  {/* Milestone markers */}
                  <div className="absolute inset-0 flex">
                    <div className="w-1/4 border-r border-border/50"></div>
                    <div className="w-1/4 border-r border-border/50"></div>
                    <div className="w-1/4 border-r border-border/50"></div>
                    <div className="w-1/4"></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                </div>
              </div>

              {/* Status and Remaining */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Falta para a meta</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(Math.max(annualGoal - dashboardData.rendaAnual, 0))}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-lg font-bold">
                    {dashboardData.rendaAnual >= annualGoal ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        Meta Atingida!
                      </span>
                    ) : dashboardData.rendaAnual / annualGoal >= 0.75 ? (
                      <span className="text-blue-500">Quase lá!</span>
                    ) : dashboardData.rendaAnual / annualGoal >= 0.5 ? (
                      <span className="text-yellow-500">No caminho</span>
                    ) : (
                      <span className="text-muted-foreground">Em progresso</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Monthly projection to reach goal */}
              {dashboardData.rendaAnual < annualGoal && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Média mensal necessária</span>
                    <span className="font-semibold text-primary">
                      {formatCurrency((annualGoal - dashboardData.rendaAnual) / (12 - selectedMonth + 1))}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Defina uma meta anual para acompanhar seu progresso
                </p>
                <p className="text-xs text-muted-foreground">
                  Visualize quanto falta para alcançar seus objetivos financeiros
                </p>
              </div>
              <Button
                onClick={() => setShowGoalDialog(true)}
                size="sm"
                className="w-full"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Configurar Meta Anual
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards de KPI Aprimorados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Card className={`border-2 transition-all duration-300 hover:scale-105 animate-scale-in ${getPerformanceBg(dashboardData.rendaMensal)}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">vs mês anterior</p>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">+12.5%</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Receita Mensal</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                R$ {dashboardData.rendaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">
                Anual: R$ {(dashboardData.rendaAnual / 1000).toFixed(0)}k
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 transition-all duration-300 hover:scale-105 animate-scale-in ${getPerformanceBg(-dashboardData.despesaMensal)}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">vs mês anterior</p>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">+8.3%</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Despesas Operacionais</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                R$ {dashboardData.despesaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">
                Anual: R$ {(dashboardData.despesaAnual / 1000).toFixed(0)}k
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 transition-all duration-300 hover:scale-105 animate-scale-in ${getPerformanceBg(-dashboardData.impostosMensal)}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <PieChart className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">% da receita</p>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  {dashboardData.rendaMensal > 0 ? `${((dashboardData.impostosMensal / dashboardData.rendaMensal) * 100).toFixed(1)}%` : "0%"}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Despesas Não Operacionais</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                R$ {dashboardData.impostosMensal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">
                Anual: R$ {(dashboardData.impostosAnual / 1000).toFixed(0)}k
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 transition-all duration-300 hover:scale-105 animate-scale-in ${getPerformanceBg(dashboardData.rendaMensal - dashboardData.despesaMensal)}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Target className={`h-6 w-6 ${getPerformanceColor(dashboardData.rendaMensal - dashboardData.despesaMensal)}`} />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">margem operacional</p>
                <p className={`text-sm font-medium ${getPerformanceColor(dashboardData.rendaMensal - dashboardData.despesaMensal)}`}>
                  {dashboardData.rendaMensal > 0 ? (((dashboardData.rendaMensal - dashboardData.despesaMensal) / dashboardData.rendaMensal) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Lucro Operacional</p>
              <p className={`text-3xl font-bold ${getPerformanceColor(dashboardData.rendaMensal - dashboardData.despesaMensal)}`}>
                R$ {(dashboardData.rendaMensal - dashboardData.despesaMensal).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">
                Anual: R$ {((dashboardData.rendaAnual - dashboardData.despesaAnual) / 1000).toFixed(0)}k
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 transition-all duration-300 hover:scale-105 animate-scale-in ${getPerformanceBg(dashboardData.saldoMensal)}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <DollarSign className={`h-6 w-6 ${getPerformanceColor(dashboardData.saldoMensal)}`} />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">margem líquida</p>
                <p className={`text-sm font-medium ${getPerformanceColor(dashboardData.saldoMensal)}`}>
                  {dashboardData.rendaMensal > 0 ? ((dashboardData.saldoMensal / dashboardData.rendaMensal) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
              <p className={`text-3xl font-bold ${getPerformanceColor(dashboardData.saldoMensal)}`}>
                R$ {dashboardData.saldoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">
                Anual: R$ {(dashboardData.saldoAnual / 1000).toFixed(0)}k
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Gráficos Interativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras Horizontais - Distribuição Financeira */}
        <Card className="border-border animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Distribuição Financeira - Médias Mensais
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Média mensal de todas as seções do ano {selectedYear}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pieChartData.sort((a, b) => b.value - a.value).map((section, index) => {
                const maxValue = Math.max(...pieChartData.map(s => s.value));
                const percentage = (section.value / maxValue) * 100;
                
                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {section.name}
                      </span>
                      <span className="text-sm font-bold" style={{ color: section.color }}>
                        R$ {section.value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-muted/30 rounded-full h-7 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-700 ease-out hover:opacity-90 flex items-center justify-end pr-2"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: section.color,
                            animation: 'slideIn 1s ease-out'
                          }}
                        >
                          <span className="text-xs font-medium text-white drop-shadow-md">
                            {((section.value / pieChartData.reduce((sum, s) => sum + s.value, 0)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Totais */}
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total Receitas</p>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">
                    R$ {pieChartData.filter(s => s.type === 'revenue').reduce((sum, s) => sum + s.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Despesas</p>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">
                    R$ {pieChartData.filter(s => s.type === 'expense').reduce((sum, s) => sum + s.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resultado</p>
                  <p className={`text-sm font-bold ${
                    pieChartData.filter(s => s.type === 'revenue').reduce((sum, s) => sum + s.value, 0) - 
                    pieChartData.filter(s => s.type === 'expense').reduce((sum, s) => sum + s.value, 0) >= 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    R$ {(
                      pieChartData.filter(s => s.type === 'revenue').reduce((sum, s) => sum + s.value, 0) - 
                      pieChartData.filter(s => s.type === 'expense').reduce((sum, s) => sum + s.value, 0)
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Executivo */}
        <Card className="border-border animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Resumo Executivo - {summaryViewMode === "monthly" ? `${monthNames[selectedMonth - 1]}/` : ""}{selectedYear}
              </div>
              <Select value={summaryViewMode} onValueChange={(value: "monthly" | "annual") => setSummaryViewMode(value)}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-1">Lucro Operacional</div>
              <div className={`text-2xl font-bold ${getPerformanceColor(summaryViewMode === "monthly" ? (dashboardData.rendaMensal - dashboardData.despesaMensal) : (dashboardData.rendaAnual - dashboardData.despesaAnual))}`}>
                R$ {(summaryViewMode === "monthly" 
                  ? (dashboardData.rendaMensal - dashboardData.despesaMensal) 
                  : (dashboardData.rendaAnual - dashboardData.despesaAnual)
                ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(summaryViewMode === "monthly" 
                  ? (dashboardData.rendaMensal - dashboardData.despesaMensal) 
                  : (dashboardData.rendaAnual - dashboardData.despesaAnual)) >= 0 
                  ? "✓ Meta atingida" 
                  : "⚠ Abaixo da meta"}
              </div>
            </div>
            
            {/* Seções Financeiras Detalhadas */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalhamento por Seção</div>
              
              {/* Receitas */}
              {financialSummaryData?.operational?.filter(section => section.sectionType === 'revenue').map((section, index) => {
                const sectionId = `revenue-${section.sectionName}-${index}`;
                const isExpanded = expandedSections.has(sectionId);
                
                return (
                  <div key={sectionId} className="space-y-2">
                    <div 
                      className="p-3 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-200/50 dark:border-green-800/50 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      onClick={() => toggleSection(sectionId)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <button className="p-0.5 hover:bg-green-200/50 dark:hover:bg-green-800/50 rounded transition-colors">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-green-600" /> : <ChevronRight className="h-4 w-4 text-green-600" />}
                          </button>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">{section.sectionName}</p>
                        </div>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          R$ {(summaryViewMode === "monthly" 
                            ? (section.monthlyTotals[selectedMonth - 1] || 0) 
                            : section.total
                          ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Categorias expandidas com paginação */}
                    {isExpanded && section.categories && section.categories.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {(() => {
                          const itemsPerPage = 10;
                          const currentPage = sectionPages[sectionId] || 1;
                          const totalPages = Math.ceil(section.categories.length / itemsPerPage);
                          const startIndex = (currentPage - 1) * itemsPerPage;
                          const endIndex = startIndex + itemsPerPage;
                          const currentCategories = section.categories.slice(startIndex, endIndex);
                          
                          return (
                            <>
                              {currentCategories.map((category: any, catIndex) => {
                                // Check if this is a contract-related category
                                const isContractCategory = ['Custo Licença', 'Imposto RHID', 'Boletos RHID', 'Faturamento RHID'].includes(section.sectionName);
                                
                                // If has contractNumber property, use it to find the contract
                                const contract = category.contractNumber ? contracts.find((c: any) => c.contract_number === category.contractNumber) : null;
                                
                                const categoryContent = (
                                  <div key={`cat-${startIndex + catIndex}`} className="p-2 bg-green-50/30 dark:bg-green-900/5 rounded border-l-2 border-green-400/50">
                                    <div className="flex justify-between items-center">
                                      <p className="text-xs text-green-600 dark:text-green-400">{category.categoryName}</p>
                                      <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                                        R$ {(summaryViewMode === "monthly" 
                                          ? (category.monthlyTotals?.[selectedMonth - 1] || 0) 
                                          : category.total || 0
                                        ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                  </div>
                                );
                                
                                // Wrap with tooltip if it's a contract category with a valid contract
                                if (isContractCategory && contract) {
                                  return (
                                    <TooltipProvider key={`cat-${startIndex + catIndex}`}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          {categoryContent}
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs text-muted-foreground">Contrato #{category.contractNumber}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                }
                                
                                return categoryContent;
                              })}
                              
                              {/* Pagination controls */}
                              {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-3 pt-2 border-t border-green-200/50">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSectionPages(prev => ({
                                        ...prev,
                                        [sectionId]: Math.max(1, currentPage - 1)
                                      }));
                                    }}
                                    disabled={currentPage === 1}
                                    className="h-7 px-2"
                                  >
                                    <ChevronLeft className="h-3 w-3" />
                                  </Button>
                                  <span className="text-xs text-muted-foreground">
                                    {currentPage} / {totalPages}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSectionPages(prev => ({
                                        ...prev,
                                        [sectionId]: Math.min(totalPages, currentPage + 1)
                                      }));
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="h-7 px-2"
                                  >
                                    <ChevronRight className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Despesas Operacionais */}
              {financialSummaryData?.operational?.filter(section => section.sectionType === 'expense').map((section, index) => {
                const sectionId = `expense-${section.sectionName}-${index}`;
                const isExpanded = expandedSections.has(sectionId);
                
                return (
                  <div key={sectionId} className="space-y-2">
                    <div 
                      className="p-3 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-200/50 dark:border-red-800/50 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      onClick={() => toggleSection(sectionId)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <button className="p-0.5 hover:bg-red-200/50 dark:hover:bg-red-800/50 rounded transition-colors">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-red-600" /> : <ChevronRight className="h-4 w-4 text-red-600" />}
                          </button>
                          <p className="text-sm font-medium text-red-700 dark:text-red-300">{section.sectionName}</p>
                        </div>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">
                          R$ {(summaryViewMode === "monthly" 
                            ? (section.monthlyTotals[selectedMonth - 1] || 0) 
                            : section.total
                          ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Categorias expandidas com paginação */}
                    {isExpanded && section.categories && section.categories.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {(() => {
                          const itemsPerPage = 10;
                          const currentPage = sectionPages[sectionId] || 1;
                          const totalPages = Math.ceil(section.categories.length / itemsPerPage);
                          const startIndex = (currentPage - 1) * itemsPerPage;
                          const endIndex = startIndex + itemsPerPage;
                          const currentCategories = section.categories.slice(startIndex, endIndex);
                          
                          return (
                            <>
                              {currentCategories.map((category: any, catIndex) => {
                                // Check if this is a contract-related category
                                const isContractCategory = ['Custo Licença', 'Imposto RHID', 'Boletos RHID', 'Faturamento RHID'].includes(section.sectionName);
                                
                                // If has contractNumber property, use it to find the contract
                                const contract = category.contractNumber ? contracts.find((c: any) => c.contract_number === category.contractNumber) : null;
                                
                                const categoryContent = (
                                  <div key={`cat-${startIndex + catIndex}`} className="p-2 bg-red-50/30 dark:bg-red-900/5 rounded border-l-2 border-red-400/50">
                                    <div className="flex justify-between items-center">
                                      <p className="text-xs text-red-600 dark:text-red-400">{category.categoryName}</p>
                                      <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                        R$ {(summaryViewMode === "monthly" 
                                          ? (category.monthlyTotals?.[selectedMonth - 1] || 0) 
                                          : category.total || 0
                                        ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                  </div>
                                );
                                
                                // Wrap with tooltip if it's a contract category with a valid contract
                                if (isContractCategory && contract) {
                                  return (
                                    <TooltipProvider key={`cat-${startIndex + catIndex}`}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          {categoryContent}
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs text-muted-foreground">Contrato #{category.contractNumber}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                }
                                
                                return categoryContent;
                              })}
                              
                              {/* Pagination controls */}
                              {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-3 pt-2 border-t border-red-200/50">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSectionPages(prev => ({
                                        ...prev,
                                        [sectionId]: Math.max(1, currentPage - 1)
                                      }));
                                    }}
                                    disabled={currentPage === 1}
                                    className="h-7 px-2"
                                  >
                                    <ChevronLeft className="h-3 w-3" />
                                  </Button>
                                  <span className="text-xs text-muted-foreground">
                                    {currentPage} / {totalPages}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSectionPages(prev => ({
                                        ...prev,
                                        [sectionId]: Math.min(totalPages, currentPage + 1)
                                      }));
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="h-7 px-2"
                                  >
                                    <ChevronRight className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Despesas Não Operacionais (Impostos, etc) */}
              {financialSummaryData?.nonOperational?.filter(section => section.sectionType === 'expense').map((section, index) => {
                const sectionId = `non-op-${section.sectionName}-${index}`;
                const isExpanded = expandedSections.has(sectionId);
                
                return (
                  <div key={sectionId} className="space-y-2">
                    <div 
                      className="p-3 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50 cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                      onClick={() => toggleSection(sectionId)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <button className="p-0.5 hover:bg-yellow-200/50 dark:hover:bg-yellow-800/50 rounded transition-colors">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-yellow-600" /> : <ChevronRight className="h-4 w-4 text-yellow-600" />}
                          </button>
                          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">{section.sectionName}</p>
                        </div>
                        <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                          R$ {(summaryViewMode === "monthly" 
                            ? (section.monthlyTotals[selectedMonth - 1] || 0) 
                            : section.total
                          ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Categorias expandidas */}
                    {isExpanded && section.categories && section.categories.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {section.categories.map((category, catIndex) => {
                          // Check if this is a contract-related category
                          const isContractCategory = ['Custo Licença', 'Imposto RHID', 'Boletos RHID', 'Faturamento RHID'].includes(section.sectionName);
                          
                          // Try to extract contract number from category name
                          const contractNumberMatch = category.categoryName.match(/^\d+/);
                          const contractNumber = contractNumberMatch ? contractNumberMatch[0] : null;
                          
                          // Find the contract by number
                          const contract = contractNumber ? contracts.find((c: any) => c.contract_number === contractNumber) : null;
                          
                          const categoryContent = (
                            <div key={`cat-${catIndex}`} className="p-2 bg-yellow-50/30 dark:bg-yellow-900/5 rounded border-l-2 border-yellow-400/50">
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-yellow-600 dark:text-yellow-400">{category.categoryName}</p>
                                <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                                  R$ {(summaryViewMode === "monthly" 
                                    ? (category.monthlyTotals?.[selectedMonth - 1] || 0) 
                                    : category.total || 0
                                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                          );
                          
                          // Wrap with tooltip if it's a contract category with a valid contract
                          if (isContractCategory && contract) {
                            return (
                              <TooltipProvider key={`cat-${catIndex}`}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    {categoryContent}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-semibold">{contract.client_name || 'Cliente não identificado'}</p>
                                    <p className="text-xs text-muted-foreground">Contrato #{contractNumber}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          }
                          
                          return categoryContent;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linhas com Animação */}
      <Card className="border-border animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary animate-pulse" />
            Evolução Mensal Comparativa - {selectedYear}
          </CardTitle>
          <p className="text-muted-foreground">
            Análise mensal de receitas vs despesas
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96 relative">
            {/* Indicadores de valores do último mês */}
            <div className="absolute top-0 right-0 z-10 bg-card/90 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {barChartData[barChartData.length - 1]?.mes || 'DEZ'}
              </div>
              <div className="space-y-2">
                {/* Receita */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Receita:</span>
                  <span className="text-xs text-green-600 dark:text-green-400 font-bold">
                    R$ {barChartData[barChartData.length - 1]?.receita?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                {/* Despesas Operacionais */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Desp. Op.:</span>
                  <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                    R$ {barChartData[barChartData.length - 1]?.despesa?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
                
                {/* Lucro Operacional */}
                <div className="flex items-center gap-2 pt-1 border-t">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Lucro Op.:</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                    R$ {((barChartData[barChartData.length - 1]?.receita || 0) - (barChartData[barChartData.length - 1]?.despesa || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                {/* Lucro Líquido */}
                <div className="flex items-center gap-2 pt-1 border-t">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Lucro Líq.:</span>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                    R$ {barChartData[barChartData.length - 1]?.saldo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={barChartData} 
                margin={{ top: 20, right: 180, left: 20, bottom: 5 }}
              >
                <defs>
                  {/* Gradientes para as linhas */}
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  
                  {/* Filtros de sombra */}
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                  </filter>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--muted-foreground))" 
                  opacity={0.2} 
                  vertical={false}
                />
                
                <XAxis 
                  dataKey="mes" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                
                <RechartsTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const receita = payload.find(p => p.dataKey === 'receita')?.value || 0;
                      const despesa = payload.find(p => p.dataKey === 'despesa')?.value || 0;
                      const saldo = payload.find(p => p.dataKey === 'saldo')?.value || 0;
                      const lucroOperacional = Number(receita) - Number(despesa);
                      
                      return (
                        <div className="bg-card/95 backdrop-blur-sm p-4 rounded-lg border shadow-xl">
                          <div className="font-semibold text-sm mb-3 text-foreground">{label}</div>
                          
                          <div className="space-y-2">
                            {/* Receita Operacional */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-xs text-muted-foreground">Receita Operacional:</span>
                              </div>
                              <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                R$ {Number(receita).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            
                            {/* Despesas Operacionais */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span className="text-xs text-muted-foreground">Despesas Operacionais:</span>
                              </div>
                              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                R$ {Number(despesa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            
                            {/* Lucro Operacional */}
                            <div className="flex items-center justify-between gap-4 pt-2 border-t">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-xs font-medium text-foreground">Lucro Operacional:</span>
                              </div>
                              <span className={`text-xs font-bold ${lucroOperacional >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                R$ {lucroOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            
                            {/* Lucro Líquido */}
                            <div className="flex items-center justify-between gap-4 pt-2 border-t">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                <span className="text-xs font-medium text-foreground">Lucro Líquido:</span>
                              </div>
                              <span className={`text-xs font-bold ${Number(saldo) >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                                R$ {Number(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                
                <Legend 
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    paddingBottom: '20px',
                  }}
                />
                
                {/* Área sob as linhas */}
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="transparent"
                  fillOpacity={1}
                  fill="url(#colorReceita)"
                  animationDuration={2000}
                  animationBegin={0}
                />
                
                <Area
                  type="monotone"
                  dataKey="despesa"
                  stroke="transparent"
                  fillOpacity={1}
                  fill="url(#colorDespesa)"
                  animationDuration={2000}
                  animationBegin={200}
                />
                
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="transparent"
                  fillOpacity={1}
                  fill="url(#colorSaldo)"
                  animationDuration={2000}
                  animationBegin={400}
                />
                
                {/* Linhas principais */}
                <Line 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Receitas"
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff', filter: 'url(#shadow)' }}
                  animationDuration={2000}
                  animationBegin={0}
                  filter="url(#shadow)"
                />
                
                <Line 
                  type="monotone" 
                  dataKey="despesa" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  name="Despesas"
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff', filter: 'url(#shadow)' }}
                  animationDuration={2000}
                  animationBegin={200}
                  filter="url(#shadow)"
                />
                
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Saldo"
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff', filter: 'url(#shadow)' }}
                  animationDuration={2000}
                  animationBegin={400}
                  filter="url(#shadow)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Card de Receita Operacional por categoria */}
          <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              RECEITA OPERACIONAL POR CATEGORIA - {selectedYear}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {financialSummaryData?.operational?.filter(section => section.sectionType === 'revenue').map((section) => (
                <div key={section.sectionName} className="space-y-1">
                  <div className="text-xs text-muted-foreground">{section.sectionName}</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    R$ {(section.total / 1000).toFixed(0)}k
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;