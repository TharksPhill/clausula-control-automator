import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, FileText, Map, Calculator } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { useMemo } from "react";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { useProfitAnalysis } from "@/hooks/useProfitAnalysis";
import { useRHIDRevenue } from "@/hooks/useRHIDRevenue";
import { useEffect } from "react";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";

const DashboardStats = () => {
  const { contracts, loading } = useContracts();
  const currentYear = new Date().getFullYear();
  const { data: financialData, isLoading: financialLoading } = useFinancialSummary(currentYear);
  const { profitMetrics, contractProfitDetails, loading: profitLoading } = useProfitAnalysis();
  const { data: rhidData, isLoading: rhidLoading, refetch: refetchRHID } = useRHIDRevenue();
  
  // Forçar refetch do RHID quando o componente montar
  useEffect(() => {
    refetchRHID();
  }, []);
  
  
  // Debug para verificar os dados
  useEffect(() => {
    if (financialData) {
      console.log('=== DashboardStats Debug ===');
      console.log('Financial Data:', financialData);
      console.log('Operational sections:', financialData.operational);
    }
    if (rhidData) {
      console.log('=== RHID Data Debug ===');
      console.log('RHID Revenue Data:', rhidData);
      console.log('Total Monthly:', rhidData.totalMonthly);
    }
  }, [financialData, rhidData]);

  const stats = useMemo(() => {
    // Contratos ativos
    const activeContracts = contracts?.filter(c => c.status === 'Ativo') || [];
    const activeContractsCount = activeContracts.length;

    // Calcular lucro operacional usando a mesma lógica da FinancialSummaryView
    let monthlyOperationalProfit = 0;
    let monthlyOperationalExpenses = 0;
    
    if (financialData?.operational && financialData.operational.length > 0) {
      // Calcular totais anuais de receita e despesa operacional
      let annualRevenue = 0;
      let annualExpense = 0;
      
      financialData.operational.forEach(section => {
        // Usar o total anual da seção diretamente (já calculado no hook)
        if (section.sectionType === 'revenue') {
          annualRevenue += section.total;
        } else if (section.sectionType === 'expense') {
          annualExpense += Math.abs(section.total);
        }
      });
      
      // Calcular lucro operacional anual
      const annualOperationalProfit = annualRevenue - annualExpense;
      
      // Calcular média mensal (dividir por 12) - Exatamente como na FinancialSummaryView
      monthlyOperationalProfit = annualOperationalProfit / 12;
      monthlyOperationalExpenses = annualExpense / 12;
    }

    // Despesas operacionais mensais
    const monthlyExpenseAverage = monthlyOperationalExpenses;

    // Estado com mais contratos
    const stateCount: { [key: string]: number } = {};
    contracts?.forEach(contract => {
      if (contract.contractors && contract.contractors.length > 0) {
        contract.contractors.forEach(contractor => {
          const state = contractor.state || 'N/A';
          stateCount[state] = (stateCount[state] || 0) + 1;
        });
      }
    });

    const stateWithMostContracts = Object.keys(stateCount).length > 0 
      ? Object.keys(stateCount).reduce((a, b) => stateCount[a] > stateCount[b] ? a : b)
      : 'N/A';
    
    const stateContractsCount = stateCount[stateWithMostContracts] || 0;

  // Faturamento RHID - usar a mesma lógica do BrazilMap
  let monthlyRHIDRevenue = 0;
  let rhidContractsCount = 0;
  
  if (financialData?.operational) {
    // Procurar pela seção FATURAMENTO RHID
    const rhidSection = financialData.operational.find(section => 
      section.sectionName && 
      section.sectionName.toUpperCase().includes('FATURAMENTO') && 
      section.sectionName.toUpperCase().includes('RHID')
    );
    
    if (rhidSection) {
      // O total anual está em rhidSection.total
      const annualTotal = rhidSection.total || 0;
      // O total mensal é a média anual dividida por 12
      monthlyRHIDRevenue = annualTotal / 12;
      // Contar contratos das categorias (cada categoria representa um contrato)
      rhidContractsCount = rhidSection.categories?.length || 0;
    }
  }
  
  console.log('💰 Valor final RHID:', monthlyRHIDRevenue);

    return {
      activeContracts: activeContractsCount,
      operationalProfit: monthlyOperationalProfit,
      monthlyAverage: monthlyExpenseAverage,
      stateWithMostContracts: stateWithMostContracts,
      stateContractsCount: stateContractsCount,
      monthlyRHIDRevenue: monthlyRHIDRevenue,
      rhidContractsCount: rhidContractsCount
    };
  }, [contracts, profitMetrics, contractProfitDetails, financialData, rhidData]);

  const statsCards = [
    {
      title: "Contratos Ativos",
      value: stats.activeContracts,
      subtitle: `Total de contratos em operação`,
      change: `+${Math.round((stats.activeContracts / Math.max(contracts?.length || 1, 1)) * 100)}%`,
      icon: FileText,
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-card",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500"
    },
    {
      title: "Lucro Operacional",
      value: `R$ ${stats.operationalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Média de lucro operacional/mês",
      change: stats.operationalProfit > 0 ? `+${((stats.operationalProfit / Math.max(stats.monthlyAverage, 1)) * 100).toFixed(0)}%` : '0%',
      icon: DollarSign,
      gradient: "from-purple-500 to-pink-500",
      bgColor: "bg-card",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500"
    },
    {
      title: "Despesas Operacionais",
      value: `-R$ ${stats.monthlyAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Média de despesas operacionais/mês",
      change: `-8%`,
      icon: Calculator,
      gradient: "from-red-500 to-red-600",
      bgColor: "bg-card",
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
      valueColor: "text-red-600 dark:text-red-400"
    },
    {
      title: "Estado com Mais Contratos",
      value: stats.stateWithMostContracts,
      subtitle: `${stats.stateContractsCount} contratos`,
      change: `${stats.stateContractsCount}`,
      icon: Map,
      gradient: "from-orange-500 to-red-500",
      bgColor: "bg-card",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500"
    },
    {
      title: "Faturamento RHID",
      value: formatMonetaryValue(stats.monthlyRHIDRevenue),
      subtitle: `${stats.rhidContractsCount} contratos com RHID`,
      change: `+12.5%`,
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-500",
      bgColor: "bg-card",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500"
    }
  ];

  if (loading || financialLoading || profitLoading || rhidLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse bg-card border-border">
            <CardContent className="p-6">
              <div className="h-24 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statsCards.map((stat, index) => {
        const IconComponent = stat.icon;
        const isPositive = !stat.change.includes('-');
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index} className={`${stat.bgColor} border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-full ${stat.iconBg}`}>
                  <IconComponent className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                {index !== 3 && (
                  <Badge 
                    variant="secondary" 
                    className={`bg-gradient-to-r ${stat.gradient} text-white border-0 shadow-sm`}
                  >
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {stat.change}
                  </Badge>
                )}
                {index === 3 && (
                  <Badge 
                    variant="secondary" 
                    className={`bg-gradient-to-r ${stat.gradient} text-white border-0 shadow-sm`}
                  >
                    {stat.change}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.valueColor || 'text-foreground'}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;