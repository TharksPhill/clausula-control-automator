import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calculator, FileText } from "lucide-react";
import { useCosts } from "@/hooks/useCosts";
import { useContractRevenue } from "@/hooks/useContractRevenue";
import { useContracts } from "@/hooks/useContracts";
import { useProfitAnalysis } from "@/hooks/useProfitAnalysis";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";

const monthNames = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"
];

const categoryLabels = {
  rent: "Aluguel",
  utilities: "Utilities", 
  salaries: "Salários",
  marketing: "Marketing",
  accounting: "Contabilidade",
  fuel: "Combustível",
  maintenance: "Manutenção",
  internet_phone: "Internet + Telefone",
  office_supplies: "Material Escritório",
  tax: "Impostos",
  other: "Outros"
};

interface FinancialData {
  category: string;
  description: string;
  monthlyValue: number;
  annualValue: number;
  monthlyBreakdown: number[];
  type: 'revenue' | 'expense';
  subCategory?: string;
}

interface ContractCashFlow {
  contractNumber: string;
  planType: string;
  monthlyBreakdown: number[];
  totalValue: number;
  startDate: Date | null;
}

const FinancialAnalysisView = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { companyCosts } = useCosts();
  const { contracts } = useContracts();
  const { getEffectiveValueForContract } = useContractAdjustments();

  // Função helper para calcular receita de um contrato em um mês específico
  const getContractRevenueForMonth = (contract: any, monthIndex: number, year: number) => {
    if (!contract.start_date) return 0;
    
    const contractStartDate = new Date(contract.start_date);
    const trialDays = parseInt(contract.trial_days || '30');
    const planType = contract.plan_type || 'mensal';
    
    // Calcular quando o cliente começa a ser cobrado (após período de teste)
    const billingStartDate = new Date(contractStartDate);
    billingStartDate.setDate(billingStartDate.getDate() + trialDays);
    
    // Data do mês que estamos analisando - usar o último dia do mês para comparação
    const analysisDate = new Date(year, monthIndex, 1);
    const analysisLastDay = new Date(year, monthIndex + 1, 0);
    
    // LÓGICA CORRIGIDA - verificar período COMPLETO do mês
    if (contract.termination_date) {
      const terminationDate = new Date(contract.termination_date);
      
      // Comparar com o último dia do mês para verificar se o mês inteiro está após o encerramento
      if (analysisDate > terminationDate) {
        
        // Se NÃO tem reativação, está encerrado definitivamente
        if (!contract.reactivation_date) {
          console.log(`⛔ ${contract.contract_number} - ${monthIndex + 1}/${year}: ENCERRADO SEM REATIVAÇÃO`);
          return 0;
        }
        
        // Se TEM reativação, verificar se já foi reativado
        const reactivationDate = new Date(contract.reactivation_date);
        
        // O mês está no período inativo se está ENTRE encerramento e reativação
        if (analysisLastDay < reactivationDate) {
          console.log(`🔴 ${contract.contract_number} - ${monthIndex + 1}/${year}: PERÍODO INATIVO`);
          return 0;
        }
        
        // Se a análise é APÓS a reativação = reativado
        console.log(`✅ ${contract.contract_number} - ${monthIndex + 1}/${year}: REATIVADO`);
        // Continua para calcular o valor
        
      } else {
        // Análise é ANTES do encerramento = ativo original
        console.log(`✅ ${contract.contract_number} - ${monthIndex + 1}/${year}: ATIVO ORIGINAL`);
        // Continua para calcular o valor
      }
    } else {
      // Sem encerramento = sempre ativo
      console.log(`✅ ${contract.contract_number} - ${monthIndex + 1}/${year}: SEMPRE ATIVO`);
      // Continua para calcular o valor
    }
    
    // Verificar se está no período de teste
    const isBeingBilled = (analysisDate.getFullYear() > billingStartDate.getFullYear()) || 
                          (analysisDate.getFullYear() === billingStartDate.getFullYear() && 
                           analysisDate.getMonth() >= billingStartDate.getMonth());
    
    if (!isBeingBilled) {
      console.log(`🆓 ${contract.contract_number} - ${monthIndex + 1}/${year}: PERÍODO DE TESTE`);
      return 0;
    }
    
    // Calcular valor base do contrato
    const originalBaseValue = parseFloat(contract.monthly_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
    
    // Aplicar ajustes do contrato baseado na data de análise
    const baseValue = getEffectiveValueForContract(contract.id, originalBaseValue, analysisDate);
    
    // Aplicar frequência de pagamento
    if (planType === 'anual') {
      // Para contratos anuais, receita é distribuída mensalmente ao longo do ano
      return baseValue / 12;
    } else if (planType === 'semestral') {
      // Para contratos semestrais, receita é distribuída mensalmente ao longo de 6 meses
      return baseValue / 6;
    } else {
      // Para contratos mensais, receita é o valor integral
      return baseValue;
    }
  };

  // Função para gerar fluxo de caixa de contratos por mês
  const generateContractCashFlow = useMemo((): ContractCashFlow[] => {
    if (!contracts) return [];

    // Incluir todos os contratos (ativos e inativos com histórico)
    const relevantContracts = contracts.filter(contract => {
      // Incluir contratos ativos
      if (contract.status === 'Ativo') return true;
      
      // Incluir contratos inativos que têm dados no período
      if (contract.termination_date) {
        const terminationDate = new Date(contract.termination_date);
        
        // Se foi encerrado no ano ou depois, tem histórico relevante
        if (terminationDate.getFullYear() >= selectedYear) return true;
        
        // Se tem reativação
        if (contract.reactivation_date) {
          const reactivationDate = new Date(contract.reactivation_date);
          if (reactivationDate.getFullYear() <= selectedYear) {
            return true;
          }
        }
      }
      
      return false;
    });
    
    return relevantContracts.map(contract => {
      const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => 
        getContractRevenueForMonth(contract, monthIndex, selectedYear)
      );
      
      const totalValue = monthlyBreakdown.reduce((sum, value) => sum + value, 0);
      
      return {
        contractNumber: contract.contract_number,
        planType: contract.plan_type || 'mensal',
        monthlyBreakdown,
        totalValue,
        startDate: contract.start_date ? new Date(contract.start_date) : null
      };
    });
  }, [contracts, selectedYear]);

  // Calcular receitas por categorias baseado no fluxo de caixa real
  const revenueData = useMemo(() => {
    const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => 
      generateContractCashFlow.reduce((sum, contract) => sum + contract.monthlyBreakdown[monthIndex], 0)
    );
    
    const operationalRevenue = monthlyBreakdown.reduce((sum, value) => sum + value, 0) / 12;
    const productSales = operationalRevenue * 0.05; // Estimativa de 5% em produtos

    return [
      {
        category: "Receita Operacional",
        description: "Contratos ativos (faturamento real)",
        monthlyValue: operationalRevenue,
        annualValue: monthlyBreakdown.reduce((sum, value) => sum + value, 0),
        monthlyBreakdown,
        type: 'revenue' as const
      },
      {
        category: "Venda de Serviços",
        description: "Faturamento real dos contratos",
        monthlyValue: monthlyBreakdown.reduce((sum, value) => sum + value, 0) / 12,
        annualValue: monthlyBreakdown.reduce((sum, value) => sum + value, 0),
        monthlyBreakdown, // Usar os valores reais mensais dos contratos
        type: 'revenue' as const
      },
      {
        category: "Venda de Produtos",
        description: "Produtos e licenças adicionais",
        monthlyValue: productSales,
        annualValue: productSales * 12,
        monthlyBreakdown: Array(12).fill(productSales),
        type: 'revenue' as const
      }
    ];
  }, [generateContractCashFlow]);

  // Calcular despesas por categorias
  const expenseData = useMemo(() => {
    if (!companyCosts) return [];

    const costsByCategory = companyCosts.reduce((acc, cost) => {
      if (!cost.is_active) return acc;
      
      const category = cost.category;
      if (!acc[category]) {
        acc[category] = {
          description: categoryLabels[category as keyof typeof categoryLabels] || category,
          monthlyValue: 0,
          costs: []
        };
      }
      
      acc[category].monthlyValue += cost.monthly_cost;
      acc[category].costs.push(cost);
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(costsByCategory).map(([category, data]) => ({
      category: data.description,
      description: `${data.costs.length} item(s)`,
      monthlyValue: data.monthlyValue,
      annualValue: data.monthlyValue * 12,
      monthlyBreakdown: Array(12).fill(data.monthlyValue),
      type: 'expense' as const,
      subCategory: category
    }));
  }, [companyCosts]);

  // Calcular totais
  const totals = useMemo(() => {
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.monthlyValue, 0);
    const totalExpenses = expenseData.reduce((sum, item) => sum + item.monthlyValue, 0);
    
    return {
      totalRevenue,
      totalExpenses,
      operationalProfit: totalRevenue - totalExpenses,
      totalRevenueAnnual: totalRevenue * 12,
      totalExpensesAnnual: totalExpenses * 12,
      operationalProfitAnnual: (totalRevenue - totalExpenses) * 12
    };
  }, [revenueData, expenseData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orçamento e Fluxo de Caixa</h1>
            <p className="text-gray-600">Análise financeira consolidada</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: 7}, (_, i) => {
                const year = new Date().getFullYear() + i - 4;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              R$ {totals.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mensal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Despesa Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totals.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mensal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Lucro Operacional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.operationalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              R$ {totals.operationalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mensal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Margem Operacional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.operationalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {totals.totalRevenue > 0 ? ((totals.operationalProfit / totals.totalRevenue) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Do faturamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Análise Financeira - Ano {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-48 font-bold">Categoria</TableHead>
                  <TableHead className="text-center font-bold bg-emerald-50 border-l border-r">MENSAL</TableHead>
                  <TableHead className="text-center font-bold bg-emerald-50 border-r">ANUAL</TableHead>
                  {monthNames.map((month) => (
                    <TableHead key={month} className="text-center font-bold min-w-20">
                      {month}
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold bg-blue-50 border-l">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Seção de Receitas */}
                <TableRow className="bg-emerald-50">
                  <TableCell colSpan={15} className="font-bold text-emerald-700 py-2">
                    RECEITA
                  </TableCell>
                </TableRow>
                {revenueData.map((item, index) => (
                  <TableRow key={`revenue-${index}`} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-center bg-emerald-50 border-l border-r font-bold text-emerald-600">
                      R$ {item.monthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-center bg-emerald-50 border-r font-bold text-emerald-600">
                      R$ {item.annualValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </TableCell>
                    {item.monthlyBreakdown.map((value, monthIndex) => (
                      <TableCell key={monthIndex} className="text-center text-sm">
                        {value > 0 ? value.toLocaleString('pt-BR', { minimumFractionDigits: 0 }) : '-'}
                      </TableCell>
                    ))}
                    <TableCell className="text-center bg-blue-50 border-l font-bold text-blue-600">
                      R$ {item.annualValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Seção de Despesas */}
                <TableRow className="bg-red-50">
                  <TableCell colSpan={15} className="font-bold text-red-700 py-2">
                    DESPESA
                  </TableCell>
                </TableRow>
                {expenseData.map((item, index) => (
                  <TableRow key={`expense-${index}`} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-center bg-red-50 border-l border-r font-bold text-red-600">
                      R$ {item.monthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-center bg-red-50 border-r font-bold text-red-600">
                      R$ {item.annualValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </TableCell>
                    {item.monthlyBreakdown.map((value, monthIndex) => (
                      <TableCell key={monthIndex} className="text-center text-sm">
                        {value > 0 ? value.toLocaleString('pt-BR', { minimumFractionDigits: 0 }) : '-'}
                      </TableCell>
                    ))}
                    <TableCell className="text-center bg-blue-50 border-l font-bold text-blue-600">
                      R$ {item.annualValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Linha de Total de Receitas */}
                <TableRow className="bg-emerald-100 border-t-2 border-emerald-300">
                  <TableCell className="font-bold text-emerald-700">TOTAL RECEITAS</TableCell>
                  <TableCell className="text-center bg-emerald-100 border-l border-r font-bold text-emerald-700">
                    R$ {totals.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-center bg-emerald-100 border-r font-bold text-emerald-700">
                    R$ {totals.totalRevenueAnnual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </TableCell>
                  {revenueData.length > 0 && revenueData[0].monthlyBreakdown.map((_, monthIndex) => {
                    const monthlyTotal = revenueData.reduce((sum, item) => sum + item.monthlyBreakdown[monthIndex], 0);
                    return (
                      <TableCell key={monthIndex} className="text-center font-bold text-emerald-700">
                        {monthlyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center bg-blue-100 border-l font-bold text-blue-700">
                    R$ {totals.totalRevenueAnnual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </TableCell>
                </TableRow>

                {/* Linha de Total de Despesas */}
                <TableRow className="bg-red-100 border-t-2 border-red-300">
                  <TableCell className="font-bold text-red-700">TOTAL DESPESAS</TableCell>
                  <TableCell className="text-center bg-red-100 border-l border-r font-bold text-red-700">
                    R$ {totals.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-center bg-red-100 border-r font-bold text-red-700">
                    R$ {totals.totalExpensesAnnual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </TableCell>
                  {Array(12).fill(totals.totalExpenses).map((value, monthIndex) => (
                    <TableCell key={monthIndex} className="text-center font-bold text-red-700">
                      {value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </TableCell>
                  ))}
                  <TableCell className="text-center bg-blue-100 border-l font-bold text-blue-700">
                    R$ {totals.totalExpensesAnnual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </TableCell>
                </TableRow>

                {/* Linha de Lucro Operacional */}
                <TableRow className={`border-t-2 ${totals.operationalProfit >= 0 ? 'bg-emerald-200 border-emerald-400' : 'bg-red-200 border-red-400'}`}>
                  <TableCell className={`font-bold ${totals.operationalProfit >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                    LUCRO OPERACIONAL
                  </TableCell>
                  <TableCell className={`text-center border-l border-r font-bold ${totals.operationalProfit >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                    R$ {totals.operationalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className={`text-center border-r font-bold ${totals.operationalProfit >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                    R$ {totals.operationalProfitAnnual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </TableCell>
                  {Array(12).fill(totals.operationalProfit).map((value, monthIndex) => (
                    <TableCell key={monthIndex} className={`text-center font-bold ${value >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                      {value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </TableCell>
                  ))}
                  <TableCell className={`text-center bg-blue-200 border-l font-bold text-blue-800`}>
                    R$ {totals.operationalProfitAnnual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes por Contrato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fluxo de Caixa por Contrato - Ano {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-32 font-bold">Contrato</TableHead>
                  <TableHead className="w-20 text-center font-bold">Plano</TableHead>
                  <TableHead className="w-24 text-center font-bold">Início</TableHead>
                  {monthNames.map((month) => (
                    <TableHead key={month} className="text-center font-bold min-w-20">
                      {month}
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold bg-blue-50 border-l">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generateContractCashFlow.map((contract, index) => (
                  <TableRow key={`contract-${index}`} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={contract.planType === 'anual' ? 'default' : contract.planType === 'semestral' ? 'secondary' : 'outline'}>
                        {contract.planType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {contract.startDate ? contract.startDate.toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    {contract.monthlyBreakdown.map((value, monthIndex) => (
                      <TableCell key={monthIndex} className="text-center text-sm">
                        {value > 0 ? value.toLocaleString('pt-BR', { minimumFractionDigits: 0 }) : '-'}
                      </TableCell>
                    ))}
                    <TableCell className="text-center bg-blue-50 border-l font-bold text-blue-600">
                      R$ {contract.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Linha de Total */}
                <TableRow className="bg-emerald-100 border-t-2 border-emerald-300">
                  <TableCell colSpan={3} className="font-bold text-emerald-700">TOTAL GERAL</TableCell>
                  {Array.from({ length: 12 }, (_, monthIndex) => {
                    const monthlyTotal = generateContractCashFlow.reduce((sum, contract) => sum + contract.monthlyBreakdown[monthIndex], 0);
                    return (
                      <TableCell key={monthIndex} className="text-center font-bold text-emerald-700">
                        {monthlyTotal > 0 ? monthlyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }) : '-'}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center bg-blue-100 border-l font-bold text-blue-700">
                    R$ {generateContractCashFlow.reduce((sum, contract) => sum + contract.totalValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Análise Adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Indicadores de Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Margem Bruta:</span>
              <Badge variant={totals.operationalProfit >= 0 ? "default" : "destructive"}>
                {totals.totalRevenue > 0 ? ((totals.operationalProfit / totals.totalRevenue) * 100).toFixed(1) : 0}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Receita por Contrato:</span>
              <span className="font-medium">
                R$ {contracts && contracts.length > 0 ? (totals.totalRevenue / contracts.filter(c => c.status === 'Ativo').length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ponto de Equilíbrio:</span>
              <span className="font-medium">
                R$ {totals.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projeção Anual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Receita Anual Projetada:</span>
              <span className="font-bold text-emerald-600">
                R$ {totals.totalRevenueAnnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Despesa Anual Projetada:</span>
              <span className="font-bold text-red-600">
                R$ {totals.totalExpensesAnnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm font-medium">Lucro Anual Projetado:</span>
              <span className={`font-bold ${totals.operationalProfitAnnual >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                R$ {totals.operationalProfitAnnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialAnalysisView;