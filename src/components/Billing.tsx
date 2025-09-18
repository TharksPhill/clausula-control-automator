
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useContracts } from "@/hooks/useContracts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { DollarSign, Calendar, TrendingUp, Calculator, Filter, FileText } from "lucide-react";
import { getLatestContractValue, convertToMonthlyEquivalent, formatMonetaryValue } from "@/utils/monetaryValueParser";
import { RefreshDataButton } from "@/components/RefreshDataButton";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const Billing = () => {
  const { contracts } = useContracts();
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Calcular dados de faturamento
  const billingData = useMemo(() => {
    if (!contracts) return null;

    console.log(`[BILLING] 💰 Processando ${contracts.length} contratos para faturamento`);

    const currentDate = new Date();
    let filteredContracts = contracts.filter(contract => contract.status === "Ativo");

    console.log(`[BILLING] Contratos ativos: ${filteredContracts.length}`);

    // Filtrar por data se especificado
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredContracts = filteredContracts.filter(contract => {
        const contractDate = new Date(contract.created_at);
        return contractDate >= start && contractDate <= end;
      });
      console.log(`[BILLING] Após filtro de data: ${filteredContracts.length} contratos`);
    }

    // Filtrar por tipo de plano se especificado
    if (selectedPeriod !== "all") {
      if (selectedPeriod === "monthly") {
        filteredContracts = filteredContracts.filter(contract => (contract.plan_type || "mensal") === "mensal");
      } else if (selectedPeriod === "semestral") {
        filteredContracts = filteredContracts.filter(contract => contract.plan_type === "semestral");
      } else if (selectedPeriod === "annual") {
        filteredContracts = filteredContracts.filter(contract => contract.plan_type === "anual");
      }
      console.log(`[BILLING] Após filtro de plano (${selectedPeriod}): ${filteredContracts.length} contratos`);
    }

    // Calcular receita mensal total usando o monetaryValueParser
    let totalMonthlyRevenue = 0;
    let monthlyRevenue = 0;
    let semestralRevenue = 0;
    let annualRevenue = 0;
    let contractsByPlan: { [key: string]: number } = {};

    filteredContracts.forEach(contract => {
      // Buscar o valor mais recente do contrato (incluindo mudanças de plano)
      const latestValue = getLatestContractValue(contract);
      
      // Converter para equivalente mensal
      const monthlyValue = convertToMonthlyEquivalent(latestValue, contract.plan_type || 'mensal');
      
      totalMonthlyRevenue += monthlyValue;
      
      const planType = contract.plan_type || 'mensal';
      contractsByPlan[planType] = (contractsByPlan[planType] || 0) + 1;
      
      // Separar receita por tipo de plano para estatísticas
      if (planType === 'mensal') {
        monthlyRevenue += monthlyValue;
      } else if (planType === 'semestral') {
        semestralRevenue += latestValue; // Valor semestral original
      } else if (planType === 'anual') {
        annualRevenue += latestValue; // Valor anual original
      }
      
      console.log(`[BILLING] Contrato ${contract.contract_number}: Valor mais recente: ${formatMonetaryValue(latestValue)}, Equivalente mensal: ${formatMonetaryValue(monthlyValue)}, Plano: ${planType}`);
    });

    console.log(`[BILLING] 🎯 RECEITA MENSAL TOTAL: ${formatMonetaryValue(totalMonthlyRevenue)}`);

    // Calcular receita total baseada no filtro
    let totalRevenue = 0;
    if (selectedPeriod === "monthly") {
      totalRevenue = monthlyRevenue * 12; // Projeção anual do mensal
    } else if (selectedPeriod === "semestral") {
      totalRevenue = semestralRevenue * 2; // Projeção anual do semestral
    } else if (selectedPeriod === "annual") {
      totalRevenue = annualRevenue;
    } else {
      // Para "all", somar tudo como receita anual projetada
      totalRevenue = (monthlyRevenue * 12) + (semestralRevenue * 2) + annualRevenue;
    }

    // Gerar dados mensais para gráfico
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      
      let monthContracts = contracts.filter(contract => {
        const contractDate = new Date(contract.created_at);
        return contractDate.getFullYear() === date.getFullYear() && 
               contractDate.getMonth() === date.getMonth() &&
               contract.status === "Ativo";
      });

      // Aplicar filtro de período se necessário
      if (selectedPeriod !== "all") {
        if (selectedPeriod === "monthly") {
          monthContracts = monthContracts.filter(c => (c.plan_type || "mensal") === "mensal");
        } else if (selectedPeriod === "semestral") {
          monthContracts = monthContracts.filter(c => c.plan_type === "semestral");
        } else if (selectedPeriod === "annual") {
          monthContracts = monthContracts.filter(c => c.plan_type === "anual");
        }
      }

      const monthRevenue = monthContracts.reduce((sum, contract) => {
        const latestValue = getLatestContractValue(contract);
        const monthlyValue = convertToMonthlyEquivalent(latestValue, contract.plan_type || 'mensal');
        return sum + monthlyValue;
      }, 0);

      monthlyData.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        revenue: monthRevenue,
        contracts: monthContracts.length
      });
    }

    // Dados para gráfico de pizza baseado no filtro
    let planData: Array<{ name: string; value: number; revenue: number }> = [];
    
    if (selectedPeriod === "all") {
      planData = Object.entries(contractsByPlan).map(([plan, count]) => ({
        name: plan === 'mensal' ? 'Mensal' : plan === 'semestral' ? 'Semestral' : 'Anual',
        value: count,
        revenue: plan === 'mensal' ? monthlyRevenue * 12 : 
                 plan === 'semestral' ? semestralRevenue * 2 : annualRevenue
      }));
    } else {
      // Mostrar apenas o tipo selecionado
      const planType = selectedPeriod === "monthly" ? "mensal" : 
                      selectedPeriod === "semestral" ? "semestral" : "anual";
      const count = contractsByPlan[planType] || 0;
      const revenue = selectedPeriod === "monthly" ? monthlyRevenue * 12 :
                     selectedPeriod === "semestral" ? semestralRevenue * 2 : annualRevenue;
      
      planData = [{
        name: selectedPeriod === "monthly" ? "Mensal" : 
              selectedPeriod === "semestral" ? "Semestral" : "Anual",
        value: count,
        revenue: revenue
      }];
    }

    return {
      totalRevenue,
      monthlyRevenue: totalMonthlyRevenue, // Receita mensal total corrigida
      semestralRevenue,
      annualRevenue,
      contractsByPlan,
      activeContracts: filteredContracts.length,
      monthlyData,
      planData,
      monthlyAverage: totalMonthlyRevenue / (filteredContracts.length || 1)
    };
  }, [contracts, selectedPeriod, startDate, endDate]);

  if (!billingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados de faturamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Faturamento</h1>
            <p className="text-gray-600 dark:text-gray-300">Análise completa do faturamento baseado nos contratos (valores mensais equivalentes)</p>
          </div>
        </div>
        <RefreshDataButton />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="monthly">Apenas Mensal</SelectItem>
                <SelectItem value="semestral">Apenas Semestral</SelectItem>
                <SelectItem value="annual">Apenas Anual</SelectItem>
              </SelectContent>
            </Select>
            
            <div>
              <Input
                type="date"
                placeholder="Data inicial"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <Input
                type="date"
                placeholder="Data final"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSelectedPeriod("all");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {selectedPeriod === "all" ? "Receita Total Anual (Projeção)" : 
               selectedPeriod === "monthly" ? "Receita Mensal (Projeção Anual)" :
               selectedPeriod === "semestral" ? "Receita Semestral (Projeção Anual)" :
               "Receita Anual"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMonetaryValue(billingData.totalRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Baseado em {billingData.activeContracts} contratos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Receita Mensal Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatMonetaryValue(billingData.monthlyRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Equivalente mensal de todos os contratos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Média por Contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatMonetaryValue(billingData.monthlyAverage)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Valor médio mensal por contrato
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contratos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {billingData.activeContracts}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedPeriod === "all" ? "Total de contratos" :
               selectedPeriod === "monthly" ? "Contratos mensais" :
               selectedPeriod === "semestral" ? "Contratos semestrais" :
               "Contratos anuais"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução da Receita Mensal
            </CardTitle>
            <CardDescription>
              Receita mensal equivalente dos últimos 12 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={billingData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [
                      formatMonetaryValue(Number(value)),
                      'Receita Mensal'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Tipo de Plano */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Tipo de Plano
            </CardTitle>
            <CardDescription>
              {selectedPeriod === "all" ? "Quantidade de contratos por tipo de plano" :
               `Contratos ${selectedPeriod === "monthly" ? "mensais" : 
                            selectedPeriod === "semestral" ? "semestrais" : "anuais"}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={billingData.planData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, value, percent}) => 
                      `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {billingData.planData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} contratos`, 'Quantidade']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada por Plano */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Tipo de Plano</CardTitle>
          <CardDescription>
            {selectedPeriod === "all" ? "Análise detalhada da receita por tipo de plano" :
             `Análise dos contratos ${selectedPeriod === "monthly" ? "mensais" : 
                                     selectedPeriod === "semestral" ? "semestrais" : "anuais"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingData.planData.map((plan, index) => (
              <div key={plan.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <h3 className="font-medium">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.value} contratos</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {formatMonetaryValue(plan.revenue)}
                  </div>
                  <p className="text-sm text-gray-500">
                    Média: {formatMonetaryValue(plan.value > 0 ? plan.revenue / plan.value : 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
