import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Target, 
  Users, 
  Building, 
  Calculator,
  TrendingUp
} from "lucide-react";
import { useCostPlans, CostPlan } from "@/hooks/useCostPlans";

const CostPlanManagement = () => {
  const {
    costPlans,
    loading,
    saveCostPlan,
    updateCostPlan,
    deleteCostPlan,
    calculateEffectiveCost,
    getMonthlyLicenseCost,
    getMatchingContracts,
    autoAssociateContracts,
    getProjectedTotalRevenue
  } = useCostPlans();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CostPlan | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    base_license_cost: number;
    billing_type: "monthly" | "semiannual" | "annual";
    early_payment_discount_percentage: number;
    exemption_period_months: number;
    min_employees: number;
    max_employees: number;
    max_cnpjs: number;
    projected_quantity: number;
    projected_plan_value: number; // Novo campo para valor de venda
    is_active: boolean;
  }>({
    name: "",
    description: "",
    base_license_cost: 0,
    billing_type: "monthly",
    early_payment_discount_percentage: 0,
    exemption_period_months: 0,
    min_employees: 1,
    max_employees: 100,
    max_cnpjs: 1,
    projected_quantity: 0,
    projected_plan_value: 0, // Novo campo
    is_active: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      base_license_cost: 0,
      billing_type: "monthly",
      early_payment_discount_percentage: 0,
      exemption_period_months: 0,
      min_employees: 1,
      max_employees: 100,
      max_cnpjs: 1,
      projected_quantity: 0,
      projected_plan_value: 0,
      is_active: true
    });
    setEditingPlan(null);
  };

  const handleEdit = (plan: CostPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      base_license_cost: plan.base_license_cost,
      billing_type: plan.billing_type as "monthly" | "semiannual" | "annual",
      early_payment_discount_percentage: plan.early_payment_discount_percentage,
      exemption_period_months: plan.exemption_period_months,
      min_employees: plan.min_employees || 1,
      max_employees: plan.max_employees || 100,
      max_cnpjs: plan.max_cnpjs || 1,
      projected_quantity: plan.projected_quantity || 0,
      projected_plan_value: plan.projected_plan_value || 0, // Novo campo
      is_active: plan.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await updateCostPlan(editingPlan.id, formData);
      } else {
        await saveCostPlan(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar plano de custo:", error);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCostPlan(id);
  };

  const projectedTotalRevenue = getProjectedTotalRevenue();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando planos de custo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">Planos de Custo</h2>
            <p className="text-muted-foreground">Gerencie os planos de custo e suas projeções de faturamento</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? "Editar Plano de Custo" : "Novo Plano de Custo"}
              </DialogTitle>
              <DialogDescription>
                Configure os custos operacionais, limites e projeções de faturamento
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Plano Básico"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do plano de custo..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="projected_plan_value">Valor de Venda Mensal (R$)</Label>
                  <Input
                    id="projected_plan_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.projected_plan_value}
                    onChange={(e) => setFormData({ ...formData, projected_plan_value: parseFloat(e.target.value) || 0 })}
                    placeholder="88.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">Valor que você cobra do cliente por este plano</p>
                </div>

                <div>
                  <Label htmlFor="projected_quantity">Projeção de Contratos</Label>
                  <Input
                    id="projected_quantity"
                    type="number"
                    min="0"
                    value={formData.projected_quantity}
                    onChange={(e) => setFormData({ ...formData, projected_quantity: parseInt(e.target.value) || 0 })}
                    placeholder="100"
                  />
                  <p className="text-sm text-gray-500 mt-1">Quantidade projetada de contratos para este plano</p>
                </div>

                <div>
                  <Label htmlFor="base_license_cost">Custo de Licença Base (R$)</Label>
                  <Input
                    id="base_license_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_license_cost}
                    onChange={(e) => setFormData({ ...formData, base_license_cost: parseFloat(e.target.value) || 0 })}
                    placeholder="50.00"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Custo operacional da licença do fornecedor</p>
                </div>

                <div>
                  <Label htmlFor="billing_type">Tipo de Cobrança</Label>
                  <Select
                    value={formData.billing_type}
                    onValueChange={(value) => 
                      setFormData({ ...formData, billing_type: value as "monthly" | "semiannual" | "annual" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="early_payment_discount_percentage">
                    Desconto p/ Pagamento Antecipado (%)
                  </Label>
                  <Input
                    id="early_payment_discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.early_payment_discount_percentage}
                    onChange={(e) => setFormData({ ...formData, early_payment_discount_percentage: parseFloat(e.target.value) || 0 })}
                    placeholder="5"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Percentual de desconto para clientes que pagam adiantado
                  </p>
                </div>

                <div>
                  <Label htmlFor="exemption_period_months">
                    Período de Isenção (meses)
                  </Label>
                  <Input
                    id="exemption_period_months"
                    type="number"
                    min="0"
                    value={formData.exemption_period_months}
                    onChange={(e) => setFormData({ ...formData, exemption_period_months: parseInt(e.target.value) || 0 })}
                    placeholder="3"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Número de meses de isenção para novos clientes
                  </p>
                </div>

                <div>
                  <Label htmlFor="min_employees">Mínimo de Funcionários</Label>
                  <Input
                    id="min_employees"
                    type="number"
                    min="1"
                    value={formData.min_employees}
                    onChange={(e) => setFormData({ ...formData, min_employees: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>

                <div>
                  <Label htmlFor="max_employees">Máximo de Funcionários</Label>
                  <Input
                    id="max_employees"
                    type="number"
                    min="1"
                    value={formData.max_employees}
                    onChange={(e) => setFormData({ ...formData, max_employees: parseInt(e.target.value) || 100 })}
                    placeholder="100"
                  />
                </div>

                <div>
                  <Label htmlFor="max_cnpjs">Máximo de CNPJs</Label>
                  <Input
                    id="max_cnpjs"
                    type="number"
                    min="1"
                    value={formData.max_cnpjs}
                    onChange={(e) => setFormData({ ...formData, max_cnpjs: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>

                <div className="col-span-2 flex items-center space-x-2">
                  <Label htmlFor="is_active">Ativo</Label>
                  <Input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    className="w-5 h-5"
                    onChange={handleCheckboxChange}
                  />
                </div>
              </div>

              {/* Preview do faturamento projetado */}
              {formData.projected_plan_value > 0 && formData.projected_quantity > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2">💰 Projeção de Faturamento</h4>
                  <div className="text-lg font-bold text-green-700">
                    R$ {formData.projected_plan_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} × {formData.projected_quantity} = 
                    R$ {(formData.projected_plan_value * formData.projected_quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Faturamento anual projetado: R$ {((formData.projected_plan_value * formData.projected_quantity) * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPlan ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo das projeções */}
      {projectedTotalRevenue > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Projeção Total de Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              R$ {projectedTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
            </div>
            <p className="text-gray-600">
              Faturamento anual projetado: R$ {(projectedTotalRevenue * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Planos de Custo Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os planos de custo com suas projeções e configurações
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {costPlans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Valor de Venda</TableHead>
                  <TableHead>Projeção</TableHead>
                  <TableHead>Faturamento Projetado</TableHead>
                  <TableHead>Custo de Licença</TableHead>
                  <TableHead>Limites</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-gray-500">{plan.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {plan.projected_plan_value ? (
                        <div className="font-medium text-blue-600">
                          R$ {plan.projected_plan_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      ) : (
                        <span className="text-gray-400">Não definido</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.projected_quantity ? (
                        <Badge variant="secondary">
                          {plan.projected_quantity} contratos
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.projected_plan_value && plan.projected_quantity ? (
                        <div className="font-bold text-green-600">
                          R$ {(plan.projected_plan_value * plan.projected_quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Base: R$ {plan.base_license_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div className="text-gray-500">
                          Mensal: R$ {getMonthlyLicenseCost(plan).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{plan.min_employees}-{plan.max_employees} funcionários</div>
                        <div className="text-gray-500">Até {plan.max_cnpjs} CNPJs</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
          onClick={() => handleDelete(plan.id)}
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
          ) : (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum plano de custo cadastrado</h3>
              <p className="text-gray-500 mb-4">Crie seu primeiro plano de custo para começar a análise</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CostPlanManagement;
