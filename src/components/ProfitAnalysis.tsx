import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Calculator, 
  DollarSign, 
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  Target, 
  Users, 
  Building, 
  Receipt, 
  Zap,
  BarChart3,
  PieChart,
  Activity,
  TrendingDown,
  MoreVertical,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCosts } from "@/hooks/useCosts";
import { useContracts } from "@/hooks/useContracts";
import { useProfitAnalysis } from "@/hooks/useProfitAnalysis";
import { useCostPlans } from "@/hooks/useCostPlans";
import { useBankSlipConfigurations } from "@/hooks/useBankSlipConfigurations";
import { useForm } from "react-hook-form";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";
import { format, parseISO, addDays, differenceInDays, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProfitAnalysisCard from "@/components/ProfitAnalysisCard";
import CostPlanManagement from "@/components/CostPlanManagement";
import AdvancedProfitAnalysis from "@/components/AdvancedProfitAnalysis";
import ContractAdjustmentModal from "@/components/ContractAdjustmentModal";

interface ProfitAnalysisForm {
  contract_id: string;
  license_cost: number;
  allocated_employee_costs: number;
  allocated_company_costs: number;
  contract_value: number;
  notes: string;
}

const ProfitAnalysis = () => {
  const { contracts, loading: contractsLoading } = useContracts();
  const { 
    profitAnalyses, 
    loading: costsLoading, 
    saveProfitAnalysis, 
    updateProfitAnalysis,
    deleteProfitAnalysis 
  } = useCosts();
  
  const { 
    profitMetrics, 
    contractProfitDetails, 
    activeContractsCount,
    loading: analysisLoading,
    analysisDate,
    navigateMonth
  } = useProfitAnalysis();

  const {
    costPlans,
    contractConfigurations,
    loading: costPlansLoading,
    calculateContractProfit
  } = useCostPlans();
  
  const { contractCosts: bankSlipCosts } = useBankSlipConfigurations();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedContract, setSelectedContract] = useState(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const { adjustments, getAdjustmentsForContract, isLoading: adjustmentsLoading } = useContractAdjustments();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProfitAnalysisForm>();

  const watchedValues = watch();
  const totalCosts = (watchedValues.license_cost || 0) + (watchedValues.allocated_employee_costs || 0) + (watchedValues.allocated_company_costs || 0);
  const grossProfit = (watchedValues.contract_value || 0) - totalCosts;
  const profitMargin = watchedValues.contract_value > 0 ? (grossProfit / watchedValues.contract_value) * 100 : 0;

  const activeContracts = contracts?.filter(contract => contract.status === 'Ativo') || [];

  const onSubmit = async (data: ProfitAnalysisForm) => {
    try {
      if (editingAnalysis) {
        await updateProfitAnalysis(editingAnalysis.id, data);
      } else {
        await saveProfitAnalysis(data);
      }
      setIsDialogOpen(false);
      setEditingAnalysis(null);
      reset();
    } catch (error) {
      console.error("Erro ao salvar análise:", error);
    }
  };

  const handleEdit = (analysis) => {
    setEditingAnalysis(analysis);
    setValue("contract_id", analysis.contract_id);
    setValue("license_cost", analysis.license_cost);
    setValue("allocated_employee_costs", analysis.allocated_employee_costs);
    setValue("allocated_company_costs", analysis.allocated_company_costs);
    setValue("contract_value", analysis.contract_value);
    setValue("notes", analysis.notes);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteProfitAnalysis(id);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAnalysis(null);
    reset();
  };

  const getContractName = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    return contract ? `${contract.contract_number} - R$ ${parseFloat(contract.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Contrato não encontrado';
  };

  if (contractsLoading || costsLoading || analysisLoading || costPlansLoading || adjustmentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando análise de lucro...</p>
        </div>
      </div>
    );
  }

  console.log("🔍 Debug - Estado dos ajustes:", {
    adjustments: adjustments?.length || 0,
    contracts: contracts?.length || 0,
    contractProfitDetails: contractProfitDetails?.length || 0
  });

  useEffect(() => {
    console.log('🔄 Navigation debug:', { analysisDate, navigateMonth: typeof navigateMonth });
  }, [analysisDate, navigateMonth]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Análise de Lucro Profissional</h1>
            <p className="text-muted-foreground">Análise completa baseada em {activeContractsCount} contratos ativos</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Análise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAnalysis ? "Editar Análise de Lucro" : "Nova Análise de Lucro"}
              </DialogTitle>
              <DialogDescription>
                Configure os custos e receitas para analisar a rentabilidade do contrato
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="contract_id">Contrato</Label>
                  <Select 
                    value={watchedValues.contract_id}
                    onValueChange={(value) => setValue("contract_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeContracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.contract_number} - R$ {parseFloat(contract.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.contract_id && (
                    <p className="text-sm text-red-500 mt-1">Contrato é obrigatório</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contract_value">Valor do Contrato (R$)</Label>
                  <Input
                    id="contract_value"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("contract_value", { 
                      required: "Valor do contrato é obrigatório",
                      min: { value: 0, message: "Valor deve ser positivo" }
                    })}
                    placeholder="0,00"
                  />
                  {errors.contract_value && (
                    <p className="text-sm text-red-500 mt-1">{errors.contract_value.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="license_cost">Custo de Licença (R$)</Label>
                  <Input
                    id="license_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("license_cost", { 
                      min: { value: 0, message: "Custo deve ser positivo" }
                    })}
                    placeholder="0,00"
                  />
                  {errors.license_cost && (
                    <p className="text-sm text-red-500 mt-1">{errors.license_cost.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="allocated_employee_costs">Custos de Funcionários (R$)</Label>
                  <Input
                    id="allocated_employee_costs"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("allocated_employee_costs", { 
                      min: { value: 0, message: "Custo deve ser positivo" }
                    })}
                    placeholder="0,00"
                  />
                  {errors.allocated_employee_costs && (
                    <p className="text-sm text-red-500 mt-1">{errors.allocated_employee_costs.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="allocated_company_costs">Custos da Empresa (R$)</Label>
                  <Input
                    id="allocated_company_costs"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("allocated_company_costs", { 
                      min: { value: 0, message: "Custo deve ser positivo" }
                    })}
                    placeholder="0,00"
                  />
                  {errors.allocated_company_costs && (
                    <p className="text-sm text-red-500 mt-1">{errors.allocated_company_costs.message}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Observações sobre esta análise..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Resumo Financeiro</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Custos Totais:</span>
                    <span className="font-bold text-red-600 ml-2">
                      R$ {totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Lucro Bruto:</span>
                    <span className={`font-bold ml-2 ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Margem de Lucro:</span>
                    <span className={`font-bold ml-2 ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitMargin.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAnalysis ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="revenue">Receitas</TabsTrigger>
          <TabsTrigger value="costs">Custos</TabsTrigger>
          <TabsTrigger value="contracts">Por Contrato</TabsTrigger>
          <TabsTrigger value="cost-plans">Planos de Custo</TabsTrigger>
          <TabsTrigger value="advanced">Análise Avançada</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProfitAnalysisCard
              title="Receita Mensal"
              value={profitMetrics.totalMonthlyRevenue}
              percentage={profitMetrics.totalMonthlyRevenue > 0 ? 100 : 0}
              icon={<DollarSign className="h-4 w-4" />}
              color="blue"
              subtitle={`${activeContractsCount} contratos ativos`}
              trend="up"
            />
            
            <ProfitAnalysisCard
              title="Impostos Mensais"
              value={profitMetrics.actualTaxes}
              percentage={profitMetrics.taxRatio}
              icon={<Receipt className="h-4 w-4" />}
              color="red"
              subtitle="Baseado nas configurações"
              trend="neutral"
            />

            <ProfitAnalysisCard
              title="Fração Empresa"
              value={profitMetrics.companyFractionCosts}
              percentage={profitMetrics.companyFractionPercentage}
              icon={<Building className="h-4 w-4" />}
              color="purple"
              subtitle={`${profitMetrics.companyFractionPercentage}% dos custos empresa`}
              trend="neutral"
            />
            
            <ProfitAnalysisCard
              title="Lucro Líquido"
              value={profitMetrics.netProfit}
              percentage={profitMetrics.netProfitMargin}
              icon={<TrendingUp className="h-4 w-4" />}
              color={profitMetrics.netProfit >= 0 ? "green" : "red"}
              subtitle="Após todos os custos e impostos"
              trend={profitMetrics.netProfit >= 0 ? "up" : "down"}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProfitAnalysisCard
              title="Receita por Funcionário"
              value={profitMetrics.revenuePerEmployee}
              icon={<Users className="h-4 w-4" />}
              color="indigo"
              subtitle="Produtividade individual"
            />
            
            <ProfitAnalysisCard
              title="% de Impostos"
              value={profitMetrics.taxRatio}
              format="percentage"
              icon={<Receipt className="h-4 w-4" />}
              color={profitMetrics.taxRatio <= 20 ? "green" : profitMetrics.taxRatio <= 30 ? "orange" : "red"}
              subtitle="% da receita em impostos"
              trend={profitMetrics.taxRatio <= 20 ? "up" : "down"}
            />
            
            <ProfitAnalysisCard
              title="Projeção Anual"
              value={profitMetrics.totalAnnualRevenue}
              icon={<Activity className="h-4 w-4" />}
              color="yellow"
              subtitle="Receita projetada anual"
            />
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProfitAnalysisCard
              title="Receita Mensal Total"
              value={profitMetrics.totalMonthlyRevenue}
              icon={<DollarSign className="h-4 w-4" />}
              color="blue"
              subtitle={`De ${activeContractsCount} contratos`}
            />
            
            <ProfitAnalysisCard
              title="Receita Anual Projetada"
              value={profitMetrics.totalAnnualRevenue}
              icon={<TrendingUp className="h-4 w-4" />}
              color="green"
              subtitle="Com descontos aplicados"
            />
            
            <ProfitAnalysisCard
              title="Ticket Médio"
              value={profitMetrics.averageContractValue}
              icon={<BarChart3 className="h-4 w-4" />}
              color="purple"
              subtitle="Valor médio mensal"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Receitas por Contrato</CardTitle>
              <CardDescription>Análise individual da receita de cada contrato ativo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Tipo de Plano</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Valor Anual</TableHead>
                    <TableHead>Contratante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractProfitDetails.map((detail) => (
                    <TableRow key={detail.contractId}>
                      <TableCell className="font-medium">{detail.contractNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {contracts?.find(c => c.id === detail.contractId)?.plan_type || 'mensal'}
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {detail.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>R$ {(detail.monthlyRevenue * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{detail.contractor?.name || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <ProfitAnalysisCard
              title="Custos de Pessoal"
              value={profitMetrics.totalEmployeeCosts}
              percentage={(profitMetrics.totalEmployeeCosts / profitMetrics.totalMonthlyRevenue) * 100}
              icon={<Users className="h-4 w-4" />}
              color="orange"
              subtitle="Salários + encargos"
            />
            
            <ProfitAnalysisCard
              title="Custos Operacionais"
              value={profitMetrics.totalCompanyCosts}
              percentage={(profitMetrics.totalCompanyCosts / profitMetrics.totalMonthlyRevenue) * 100}
              icon={<Building className="h-4 w-4" />}
              color="purple"
              subtitle="Infraestrutura + software"
            />

            <ProfitAnalysisCard
              title="Fração Empresa"
              value={profitMetrics.companyFractionCosts}
              percentage={profitMetrics.companyFractionPercentage}
              icon={<Building className="h-4 w-4" />}
              color="indigo"
              subtitle={`${profitMetrics.companyFractionPercentage}% dos custos`}
            />
            
            <ProfitAnalysisCard
              title="Impostos Reais"
              value={profitMetrics.actualTaxes}
              percentage={profitMetrics.taxRatio}
              icon={<Receipt className="h-4 w-4" />}
              color="red"
              subtitle="Configurado na empresa"
            />
            
            <ProfitAnalysisCard
              title="Custos Específicos"
              value={profitMetrics.totalOperationalCosts}
              percentage={(profitMetrics.totalOperationalCosts / profitMetrics.totalMonthlyRevenue) * 100}
              icon={<Zap className="h-4 w-4" />}
              color="yellow"
              subtitle="Licenças + alocações"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumo de Custos Totais</CardTitle>
              <CardDescription>Distribuição completa dos custos mensais incluindo fração da empresa e impostos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                  <span className="font-medium">Total de Custos Mensais (com impostos e fração empresa):</span>
                  <span className="text-xl font-bold text-orange-600">
                    R$ {(profitMetrics.totalEmployeeCosts + profitMetrics.totalCompanyCosts + profitMetrics.totalOperationalCosts + profitMetrics.companyFractionCosts + profitMetrics.actualTaxes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Percentual da Receita:</span>
                    <span className="font-bold">{profitMetrics.costRatio.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fração Empresa ({profitMetrics.companyFractionPercentage}%):</span>
                    <span className="font-bold text-purple-600">R$ {profitMetrics.companyFractionCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Percentual de Impostos:</span>
                    <span className="font-bold text-red-600">{profitMetrics.taxRatio.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sobra Líquida:</span>
                    <span className={`font-bold ${profitMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {profitMetrics.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Análise de Rentabilidade por Contrato</CardTitle>
                  <CardDescription>
                    Detalhamento da lucratividade individual de cada contrato incluindo fração da empresa e impostos
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('⬅️ Clicou em prev');
                      if (navigateMonth) {
                        navigateMonth('prev');
                      }
                    }}
                    className="h-8 w-8 p-0"
                    title="Mês anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2 text-sm font-medium min-w-[160px] justify-center">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {analysisDate ? format(analysisDate, "MMMM 'de' yyyy", { locale: ptBR }) : 'Carregando...'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('➡️ Clicou em next');
                      if (navigateMonth) {
                        navigateMonth('next');
                      }
                    }}
                    className="h-8 w-8 p-0"
                    title="Próximo mês"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {contractProfitDetails.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Receita Mensal</TableHead>
                      <TableHead>Custos Operacionais</TableHead>
                      <TableHead>Fração Empresa</TableHead>
                      <TableHead>Impostos</TableHead>
                      <TableHead>Lucro Bruto</TableHead>
                      <TableHead>Lucro Líquido</TableHead>
                      <TableHead>Margem Bruta</TableHead>
                      <TableHead>Margem Líquida</TableHead>
                      <TableHead>Contratante</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractProfitDetails.map((detail) => {
                      // Find the full contract object
                      const contract = contracts.find(c => c.id === detail.contractId);
                      
                      // Calculate days until renewal
                      const getDaysUntilRenewal = () => {
                        try {
                          let renewalDate;
                          
                          if (contract?.renewal_date?.includes('/')) {
                            const [day, month, year] = contract.renewal_date.split('/');
                            renewalDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                          } else if (contract?.renewal_date && isValid(parseISO(contract.renewal_date))) {
                            renewalDate = parseISO(contract.renewal_date);
                          } else {
                            return null;
                          }
                          
                          const today = new Date();
                          const diffTime = renewalDate.getTime() - today.getTime();
                          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        } catch {
                          return null;
                        }
                      };
                      
                      const daysUntilRenewal = getDaysUntilRenewal();
                      const isExpiringSoon = daysUntilRenewal !== null && daysUntilRenewal <= 30 && daysUntilRenewal > 0;
                      
                      // Create a more descriptive contract object to pass to the modal
                      const contractWithDetails = contract ? {
                        ...contract,
                        renewal_days_remaining: daysUntilRenewal
                      } : null;
                      
                      return (
                        <TableRow key={detail.contractId}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {detail.contractNumber}
                              {isExpiringSoon && (
                                <Badge variant="destructive" className="h-5 py-0 ml-1">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {daysUntilRenewal} dias
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            R$ {detail.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            R$ {(detail.allocatedCosts - detail.allocatedCompanyFraction).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <span className="text-purple-600">
                              R$ {detail.allocatedCompanyFraction.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-red-600">
                              R$ {detail.allocatedTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={detail.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              R$ {detail.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={detail.netProfitAfterTaxes >= 0 ? 'text-green-600' : 'text-red-600'}>
                              R$ {detail.netProfitAfterTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={detail.profitMargin >= 0 ? "default" : "destructive"}>
                              {detail.profitMargin.toFixed(2)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={detail.netProfitMargin >= 0 ? "default" : "destructive"}>
                              {detail.netProfitMargin.toFixed(2)}%
                            </Badge>
                          </TableCell>
                          <TableCell>{detail.contractor?.name || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Badge variant="outline" className="text-green-600">
                                {detail.status}
                              </Badge>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="flex items-center cursor-pointer"
                                    onClick={() => {
                                      console.log("🔧 Abrindo modal de ajuste para contrato:", contractWithDetails);
                                      setSelectedContract(contractWithDetails);
                                      setIsAdjustmentModalOpen(true);
                                    }}
                                  >
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Ajustar Valor
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="flex items-center cursor-pointer"
                                    onClick={() => {
                                      const contractAdjustments = getAdjustmentsForContract(detail.contractId);
                                      console.log("📊 Histórico de ajustes:", contractAdjustments);
                                      alert(`Histórico de Ajustes: ${contractAdjustments.length} ajustes encontrados`);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Histórico de Ajustes
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato ativo encontrado</h3>
                  <p className="text-gray-500 mb-4">Crie contratos ativos para visualizar a análise de rentabilidade</p>
                </div>
              )}
            </CardContent>
          </Card>

          {profitAnalyses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Análises Específicas Cadastradas</CardTitle>
                <CardDescription>
                  Análises detalhadas com custos específicos por contrato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Custos</TableHead>
                      <TableHead>Lucro Bruto</TableHead>
                      <TableHead>Margem</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitAnalyses.map((analysis) => (
                      <TableRow key={analysis.id}>
                        <TableCell className="font-medium">
                          {getContractName(analysis.contract_id)}
                        </TableCell>
                        <TableCell>
                          R$ {analysis.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          R$ {analysis.total_costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <span className={analysis.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            R$ {analysis.gross_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={analysis.profit_margin >= 0 ? "default" : "destructive"}>
                            {analysis.profit_margin.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(analysis)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(analysis.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cost-plans" className="space-y-6">
          <CostPlanManagement />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <AdvancedProfitAnalysis />
        </TabsContent>
      </Tabs>
      
      {/* Contract Adjustment Modal */}
      <ContractAdjustmentModal 
        contract={selectedContract}
        open={isAdjustmentModalOpen}
        onOpenChange={setIsAdjustmentModalOpen}
      />
    </div>
  );
};

export default ProfitAnalysis;
