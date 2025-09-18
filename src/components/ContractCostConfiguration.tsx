import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Settings, 
  DollarSign, 
  Percent, 
  Clock,
  FileText,
  Calculator
} from "lucide-react";
import { useCostPlans, type ContractCostConfiguration } from "@/hooks/useCostPlans";
import { useContracts } from "@/hooks/useContracts";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

interface ContractConfigForm {
  contract_id: string;
  cost_plan_id: string;
  tax_percentage: number;
  labor_cost_percentage: number;
  fixed_cost_percentage: number;
  client_trial_period_days: number;
}

const ContractCostConfiguration = () => {
  const { 
    costPlans, 
    contractConfigurations, 
    loading, 
    saveContractConfiguration,
    calculateContractProfit
  } = useCostPlans();
  
  const { contracts, loading: contractsLoading } = useContracts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ContractCostConfiguration | null>(null);
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ContractConfigForm>({
    defaultValues: {
      tax_percentage: 0,
      labor_cost_percentage: 0,
      fixed_cost_percentage: 0,
      client_trial_period_days: 0
    }
  });

  const watchedValues = watch();
  const activeContracts = contracts?.filter(contract => contract.status === 'Ativo') || [];
  const activeCostPlans = costPlans.filter(plan => plan.is_active);

  // Calcular preview do lucro
  const selectedContract = activeContracts.find(c => c.id === watchedValues.contract_id);
  const selectedCostPlan = activeCostPlans.find(p => p.id === watchedValues.cost_plan_id);
  
  let profitPreview = null;
  if (selectedContract && selectedCostPlan) {
    const mockConfig = {
      tax_percentage: watchedValues.tax_percentage || 0,
      labor_cost_percentage: watchedValues.labor_cost_percentage || 0,
      fixed_cost_percentage: watchedValues.fixed_cost_percentage || 0,
      client_trial_period_days: watchedValues.client_trial_period_days || 0
    } as ContractCostConfiguration;
    
    profitPreview = calculateContractProfit(
      parseFloat(selectedContract.monthly_value),
      selectedCostPlan,
      mockConfig
    );
  }

  const onSubmit = async (data: ContractConfigForm) => {
    try {
      await saveContractConfiguration(data);
      setIsDialogOpen(false);
      setEditingConfig(null);
      reset();
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
    }
  };

  const handleEdit = (config: ContractCostConfiguration) => {
    setEditingConfig(config);
    setValue("contract_id", config.contract_id);
    setValue("cost_plan_id", config.cost_plan_id);
    setValue("tax_percentage", config.tax_percentage);
    setValue("labor_cost_percentage", config.labor_cost_percentage);
    setValue("fixed_cost_percentage", config.fixed_cost_percentage);
    setValue("client_trial_period_days", config.client_trial_period_days);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingConfig(null);
    reset();
  };

  const getContractName = (contractId: string) => {
    const contract = contracts?.find(c => c.id === contractId);
    return contract ? `${contract.contract_number} - R$ ${parseFloat(contract.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Contrato não encontrado';
  };

  const getCostPlanName = (costPlanId: string) => {
    const plan = costPlans.find(p => p.id === costPlanId);
    return plan ? plan.name : 'Plano não encontrado';
  };

  if (loading || contractsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuração de Custos por Contrato</h1>
            <p className="text-gray-600">Vincule contratos aos planos de custo e configure parâmetros</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Configuração
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? "Editar Configuração de Contrato" : "Nova Configuração de Contrato"}
              </DialogTitle>
              <DialogDescription>
                Configure os parâmetros de custo para este contrato específico
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
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
                  <Label htmlFor="cost_plan_id">Plano de Custo</Label>
                  <Select 
                    value={watchedValues.cost_plan_id}
                    onValueChange={(value) => setValue("cost_plan_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCostPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - R$ {plan.base_license_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.cost_plan_id && (
                    <p className="text-sm text-red-500 mt-1">Plano de custo é obrigatório</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tax_percentage">Percentual de Impostos (%)</Label>
                  <Input
                    id="tax_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register("tax_percentage", { 
                      min: { value: 0, message: "Percentual deve ser positivo" },
                      max: { value: 100, message: "Percentual não pode ser maior que 100%" }
                    })}
                    placeholder="0,00"
                  />
                  {errors.tax_percentage && (
                    <p className="text-sm text-red-500 mt-1">{errors.tax_percentage.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="labor_cost_percentage">Percentual Mão de Obra (%)</Label>
                  <Input
                    id="labor_cost_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register("labor_cost_percentage", { 
                      min: { value: 0, message: "Percentual deve ser positivo" },
                      max: { value: 100, message: "Percentual não pode ser maior que 100%" }
                    })}
                    placeholder="0,00"
                  />
                  {errors.labor_cost_percentage && (
                    <p className="text-sm text-red-500 mt-1">{errors.labor_cost_percentage.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="fixed_cost_percentage">Percentual Custo Fixo (%)</Label>
                  <Input
                    id="fixed_cost_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register("fixed_cost_percentage", { 
                      min: { value: 0, message: "Percentual deve ser positivo" },
                      max: { value: 100, message: "Percentual não pode ser maior que 100%" }
                    })}
                    placeholder="0,00"
                  />
                  {errors.fixed_cost_percentage && (
                    <p className="text-sm text-red-500 mt-1">{errors.fixed_cost_percentage.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="client_trial_period_days">Período de Teste Cliente (dias)</Label>
                  <Input
                    id="client_trial_period_days"
                    type="number"
                    min="0"
                    {...register("client_trial_period_days", { 
                      min: { value: 0, message: "Período deve ser positivo ou zero" }
                    })}
                    placeholder="0"
                  />
                  {errors.client_trial_period_days && (
                    <p className="text-sm text-red-500 mt-1">{errors.client_trial_period_days.message}</p>
                  )}
                </div>
              </div>

              {profitPreview && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                    <Calculator className="h-4 w-4 mr-2" />
                    Preview do Cálculo de Lucro
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Receita Bruta:</span>
                      <span className="font-bold text-blue-600 ml-2">
                        R$ {profitPreview.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Custos Totais:</span>
                      <span className="font-bold text-red-600 ml-2">
                        R$ {profitPreview.totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Lucro Bruto:</span>
                      <span className={`font-bold ml-2 ${profitPreview.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {profitPreview.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Margem de Lucro:</span>
                      <span className={`font-bold ml-2 ${profitPreview.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitPreview.profitMargin.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Licença:</span>
                      <span className="font-bold text-orange-600 ml-2">
                        R$ {profitPreview.licenseCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Impostos:</span>
                      <span className="font-bold text-purple-600 ml-2">
                        R$ {profitPreview.taxCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingConfig ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Contrato</CardTitle>
          <CardDescription>
            Contratos vinculados aos planos de custo e suas configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contractConfigurations.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma configuração cadastrada</h3>
              <p className="text-gray-600 mb-4">Configure os custos dos seus contratos para análise de lucro precisa</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Configuração
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Plano de Custo</TableHead>
                  <TableHead>Impostos</TableHead>
                  <TableHead>Mão de Obra</TableHead>
                  <TableHead>Custo Fixo</TableHead>
                  <TableHead>Teste Cliente</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractConfigurations.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="font-medium">
                          {getContractName(config.contract_id)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCostPlanName(config.cost_plan_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Percent className="h-3 w-3 text-gray-400 mr-1" />
                        {config.tax_percentage}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Percent className="h-3 w-3 text-gray-400 mr-1" />
                        {config.labor_cost_percentage}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Percent className="h-3 w-3 text-gray-400 mr-1" />
                        {config.fixed_cost_percentage}%
                      </div>
                    </TableCell>
                    <TableCell>
                      {config.client_trial_period_days > 0 ? (
                        <div className="flex items-center text-blue-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {config.client_trial_period_days} dias
                        </div>
                      ) : (
                        <span className="text-gray-400">Sem teste</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(config)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractCostConfiguration;