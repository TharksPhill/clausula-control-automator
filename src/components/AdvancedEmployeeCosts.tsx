
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Calculator, 
  Building, 
  Clock, 
  DollarSign,
  Percent,
  FileText,
  TrendingUp
} from "lucide-react";
import { useCosts, EmployeeCost } from "@/hooks/useCosts";
import { useForm } from "react-hook-form";

interface EmployeeCostForm {
  name: string;
  position: string;
  department: string;
  salary: number;
  benefits: number;
  taxes: number;
  hourly_rate: number;
  monthly_hours: number;
  transport_allowance: number;
  meal_allowance: number;
  medical_allowance: number;
  is_active: boolean;
}

const AdvancedEmployeeCosts = () => {
  const { 
    employeeCosts, 
    loading, 
    saveEmployeeCost, 
    updateEmployeeCost, 
    deleteEmployeeCost,
    calculateLaborCharges,
    calculateSocialCharges
  } = useCosts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeCost | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<EmployeeCostForm>({
    defaultValues: {
      name: "",
      position: "",
      department: "",
      salary: 0,
      benefits: 0,
      taxes: 0,
      hourly_rate: 0,
      monthly_hours: 220,
      transport_allowance: 0,
      meal_allowance: 0,
      medical_allowance: 0,
      is_active: true
    }
  });

  const watchedValues = watch();
  const salary = watchedValues.salary || 0;
  const benefits = watchedValues.benefits || 0;
  const taxes = watchedValues.taxes || 0;
  const transportAllowance = watchedValues.transport_allowance || 0;
  const mealAllowance = watchedValues.meal_allowance || 0;
  const medicalAllowance = watchedValues.medical_allowance || 0;

  // Cálculos automáticos
  const laborCharges = calculateLaborCharges(salary);
  const socialCharges = calculateSocialCharges(salary);
  const totalAllowances = transportAllowance + mealAllowance + medicalAllowance;
  const totalCharges = laborCharges.total_labor_charges + socialCharges.total_social_charges;
  const totalCost = salary + benefits + taxes + totalAllowances + totalCharges;
  const chargesPercentage = salary > 0 ? ((totalCharges / salary) * 100) : 0;

  const onSubmit = async (data: EmployeeCostForm) => {
    try {
      const employeeData = {
        ...data,
        // Adicionar cálculos automáticos
        vacation_provision: laborCharges.vacation_provision,
        thirteenth_salary_provision: laborCharges.thirteenth_salary_provision,
        vacation_bonus_provision: laborCharges.vacation_bonus_provision,
        total_labor_charges: laborCharges.total_labor_charges,
        total_social_charges: socialCharges.total_social_charges,
        total_charges_percentage: chargesPercentage,
        // Atualizar total_cost para incluir todos os valores
        total_cost: totalCost
      };

      if (editingEmployee) {
        await updateEmployeeCost(editingEmployee.id, employeeData);
      } else {
        await saveEmployeeCost(employeeData);
      }
      setIsDialogOpen(false);
      setEditingEmployee(null);
      reset();
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error);
    }
  };

  const handleEdit = (employee: EmployeeCost) => {
    setEditingEmployee(employee);
    setValue("name", employee.name);
    setValue("position", employee.position);
    setValue("department", employee.department || "");
    setValue("salary", employee.salary);
    setValue("benefits", employee.benefits);
    setValue("taxes", employee.taxes);
    setValue("hourly_rate", employee.hourly_rate || 0);
    setValue("monthly_hours", employee.monthly_hours || 220);
    setValue("transport_allowance", employee.transport_allowance || 0);
    setValue("meal_allowance", employee.meal_allowance || 0);
    setValue("medical_allowance", employee.medical_allowance || 0);
    setValue("is_active", employee.is_active);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteEmployeeCost(id);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
    reset();
    setActiveTab("basic");
  };

  const activeCosts = employeeCosts.filter(cost => cost.is_active);
  const totalMonthlyCost = activeCosts.reduce((sum, cost) => sum + cost.total_cost, 0);

  // Estatísticas por departamento
  const departmentStats = activeCosts.reduce((acc, employee) => {
    const dept = employee.department || 'Não informado';
    if (!acc[dept]) {
      acc[dept] = { count: 0, totalCost: 0 };
    }
    acc[dept].count++;
    acc[dept].totalCost += employee.total_cost;
    return acc;
  }, {} as Record<string, { count: number; totalCost: number }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando custos de funcionários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custos Avançados de Funcionários</h1>
            <p className="text-gray-600">Gestão completa com encargos trabalhistas e sociais</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Editar Funcionário" : "Adicionar Funcionário"}
              </DialogTitle>
              <DialogDescription>
                Preencha todos os dados para calcular automaticamente os encargos
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="allowances">Benefícios</TabsTrigger>
                  <TabsTrigger value="charges">Encargos</TabsTrigger>
                  <TabsTrigger value="summary">Resumo</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        {...register("name", { required: "Nome é obrigatório" })}
                        placeholder="Digite o nome completo"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="position">Cargo</Label>
                      <Input
                        id="position"
                        {...register("position", { required: "Cargo é obrigatório" })}
                        placeholder="Ex: Desenvolvedor, Analista"
                      />
                      {errors.position && (
                        <p className="text-sm text-red-500 mt-1">{errors.position.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="department">Departamento</Label>
                      <Select onValueChange={(value) => setValue("department", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administrativo">Administrativo</SelectItem>
                          <SelectItem value="Produtivo">Produtivo</SelectItem>
                          <SelectItem value="Comercial">Comercial</SelectItem>
                          <SelectItem value="Financeiro">Financeiro</SelectItem>
                          <SelectItem value="RH">Recursos Humanos</SelectItem>
                          <SelectItem value="TI">Tecnologia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="salary">Salário Base (R$)</Label>
                      <Input
                        id="salary"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("salary", { 
                          required: "Salário é obrigatório",
                          min: { value: 0, message: "Salário deve ser positivo" }
                        })}
                        placeholder="0,00"
                      />
                      {errors.salary && (
                        <p className="text-sm text-red-500 mt-1">{errors.salary.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="monthly_hours">Carga Horária Mensal</Label>
                      <Input
                        id="monthly_hours"
                        type="number"
                        min="0"
                        {...register("monthly_hours")}
                        placeholder="220"
                      />
                    </div>

                    <div>
                      <Label htmlFor="hourly_rate">Valor/Hora (R$)</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("hourly_rate")}
                        placeholder="Calculado automaticamente"
                        value={watchedValues.monthly_hours > 0 ? (salary / watchedValues.monthly_hours).toFixed(2) : "0.00"}
                        readOnly
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="allowances" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="transport_allowance">Vale Transporte (R$)</Label>
                      <Input
                        id="transport_allowance"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("transport_allowance")}
                        placeholder="0,00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="meal_allowance">Vale Refeição (R$)</Label>
                      <Input
                        id="meal_allowance"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("meal_allowance")}
                        placeholder="0,00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="medical_allowance">Convênio Médico (R$)</Label>
                      <Input
                        id="medical_allowance"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("medical_allowance")}
                        placeholder="0,00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="benefits">Outros Benefícios (R$)</Label>
                      <Input
                        id="benefits"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("benefits")}
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Total de Benefícios</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      R$ {totalAllowances.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="charges" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Encargos Trabalhistas</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <Label className="text-sm text-gray-600">Provisão Férias (11,11%)</Label>
                          <p className="font-bold">R$ {laborCharges.vacation_provision.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <Label className="text-sm text-gray-600">Provisão 13º Salário (8,33%)</Label>
                          <p className="font-bold">R$ {laborCharges.thirteenth_salary_provision.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <Label className="text-sm text-gray-600">Provisão 13º sobre Férias (2,33%)</Label>
                          <p className="font-bold">R$ {laborCharges.vacation_bonus_provision.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded">
                          <Label className="text-sm text-blue-600">Total Encargos Trabalhistas (21,77%)</Label>
                          <p className="font-bold text-blue-600">R$ {laborCharges.total_labor_charges.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Encargos Sociais</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <Label className="text-sm text-gray-600">INSS (20,00%)</Label>
                          <p className="font-bold">R$ {socialCharges.inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <Label className="text-sm text-gray-600">FGTS (8,00%)</Label>
                          <p className="font-bold">R$ {socialCharges.fgts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <Label className="text-sm text-gray-600">FGTS + Provisão de Rescisão (4,00%)</Label>
                          <p className="font-bold">R$ {socialCharges.fgts_provision.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <Label className="text-sm text-green-600">Total Encargos Sociais (32,00%)</Label>
                          <p className="font-bold text-green-600">R$ {socialCharges.total_social_charges.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="summary" className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Resumo Financeiro</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Salário Base:</span>
                          <span className="font-bold">R$ {salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Benefícios:</span>
                          <span className="font-bold">R$ {totalAllowances.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Outros Custos:</span>
                          <span className="font-bold">R$ {(benefits + taxes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Encargos:</span>
                          <span className="font-bold text-orange-600">R$ {totalCharges.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-lg">
                          <span className="text-gray-800 font-semibold">Custo Total:</span>
                          <span className="font-bold text-green-600">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">% Encargos sobre Salário:</span>
                          <span className="font-bold text-red-600">{chargesPercentage.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      {...register("is_active")}
                    />
                    <Label htmlFor="is_active">Funcionário ativo</Label>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingEmployee ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <User className="h-4 w-4" />
              Total Funcionários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeCosts.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Funcionários ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Custo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalMonthlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Mensal com encargos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Custo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {activeCosts.length > 0 ? (totalMonthlyCost / activeCosts.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Por funcionário
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Departamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {Object.keys(departmentStats).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Áreas diferentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas por Departamento */}
      {Object.keys(departmentStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custos por Departamento</CardTitle>
            <CardDescription>Distribuição de custos e funcionários por área</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(departmentStats).map(([dept, stats]) => (
                <div key={dept} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800">{dept}</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      {stats.count} funcionário{stats.count !== 1 ? 's' : ''}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      R$ {stats.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      Média: R$ {(stats.totalCost / stats.count).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Funcionários */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Detalhada de Funcionários</CardTitle>
          <CardDescription>
            Visualização completa com todos os custos e encargos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employeeCosts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Salário Base</TableHead>
                    <TableHead>Benefícios</TableHead>
                    <TableHead>Encargos</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>% Encargos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeCosts.map((employee) => {
                    const totalChargesCalc = (employee.total_labor_charges || 0) + (employee.total_social_charges || 0);
                    const chargesPerc = employee.salary > 0 ? ((totalChargesCalc / employee.salary) * 100) : 0;
                    
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.position}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {employee.department || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>R$ {employee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>R$ {((employee.transport_allowance || 0) + (employee.meal_allowance || 0) + (employee.medical_allowance || 0) + employee.benefits).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>R$ {totalChargesCalc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="font-bold">
                          R$ {employee.total_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={chargesPerc > 60 ? "destructive" : chargesPerc > 50 ? "default" : "secondary"}>
                            {chargesPerc.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={employee.is_active ? "default" : "secondary"}>
                            {employee.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(employee.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário cadastrado</h3>
              <p className="text-gray-500 mb-4">Comece adicionando o primeiro funcionário com cálculos detalhados</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Funcionário
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedEmployeeCosts;
