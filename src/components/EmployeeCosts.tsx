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
import { User, Plus, Edit, Trash2, Calculator } from "lucide-react";
import { useCosts, EmployeeCost } from "@/hooks/useCosts";
import { useForm } from "react-hook-form";
interface EmployeeCostForm {
  name: string;
  position: string;
  salary: number;
  benefits: number;
  taxes: number;
  is_active: boolean;
}
const EmployeeCosts = () => {
  const {
    employeeCosts,
    loading,
    saveEmployeeCost,
    updateEmployeeCost,
    deleteEmployeeCost
  } = useCosts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeCost | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: {
      errors
    }
  } = useForm<EmployeeCostForm>({
    defaultValues: {
      name: "",
      position: "",
      salary: 0,
      benefits: 0,
      taxes: 0,
      is_active: true
    }
  });
  const salary = watch("salary") || 0;
  const benefits = watch("benefits") || 0;
  const taxes = watch("taxes") || 0;
  const totalCost = salary + benefits + taxes;
  const onSubmit = async (data: EmployeeCostForm) => {
    try {
      if (editingEmployee) {
        await updateEmployeeCost(editingEmployee.id, data);
      } else {
        await saveEmployeeCost(data);
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
    setValue("salary", employee.salary);
    setValue("benefits", employee.benefits);
    setValue("taxes", employee.taxes);
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
  };
  const activeCosts = employeeCosts.filter(cost => cost.is_active);
  const totalMonthlyCost = activeCosts.reduce((sum, cost) => sum + cost.total_cost, 0);
  if (loading) {
    return <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando custos de funcionários...</p>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Custos de Funcionários</h1>
            <p className="text-gray-600 dark:text-gray-300">Gerencie os custos de salários, benefícios e impostos dos funcionários</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Editar Funcionário" : "Adicionar Funcionário"}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee ? "Edite os dados do funcionário" : "Cadastre um novo funcionário com seus custos"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Funcionário</Label>
                <Input id="name" {...register("name", {
                required: "Nome é obrigatório"
              })} placeholder="Digite o nome completo" />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <Label htmlFor="position">Cargo</Label>
                <Input id="position" {...register("position", {
                required: "Cargo é obrigatório"
              })} placeholder="Ex: Desenvolvedor, Analista, Gerente" />
                {errors.position && <p className="text-sm text-red-500 mt-1">{errors.position.message}</p>}
              </div>

              <div>
                <Label htmlFor="salary">Salário Bruto (R$)</Label>
                <Input id="salary" type="number" step="0.01" min="0" {...register("salary", {
                required: "Salário é obrigatório",
                min: {
                  value: 0,
                  message: "Salário deve ser positivo"
                }
              })} placeholder="0,00" />
                {errors.salary && <p className="text-sm text-red-500 mt-1">{errors.salary.message}</p>}
              </div>

              <div>
                <Label htmlFor="benefits">Benefícios (R$)</Label>
                <Input id="benefits" type="number" step="0.01" min="0" {...register("benefits", {
                min: {
                  value: 0,
                  message: "Benefícios devem ser positivos"
                }
              })} placeholder="0,00" />
                {errors.benefits && <p className="text-sm text-red-500 mt-1">{errors.benefits.message}</p>}
              </div>

              <div>
                <Label htmlFor="taxes">Impostos e Encargos (R$)</Label>
                <Input id="taxes" type="number" step="0.01" min="0" {...register("taxes", {
                min: {
                  value: 0,
                  message: "Impostos devem ser positivos"
                }
              })} placeholder="0,00" />
                {errors.taxes && <p className="text-sm text-red-500 mt-1">{errors.taxes.message}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="is_active" {...register("is_active")} />
                <Label htmlFor="is_active">Funcionário ativo</Label>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Calculator className="h-4 w-4" />
                  Custo Total Mensal
                </div>
                <div className="text-lg font-bold text-gray-900">
                  R$ {totalCost.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
                </div>
              </div>

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
      

      {/* Tabela de Funcionários */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
          <CardDescription>
            Gerencie todos os funcionários e seus custos mensais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employeeCosts.length > 0 ? <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Salário</TableHead>
                  <TableHead>Benefícios</TableHead>
                  <TableHead>Impostos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeCosts.map(employee => <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>R$ {employee.salary.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}</TableCell>
                    <TableCell>R$ {employee.benefits.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}</TableCell>
                    <TableCell>R$ {employee.taxes.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}</TableCell>
                    <TableCell className="font-bold">
                      R$ {employee.total_cost.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.is_active ? "default" : "secondary"}>
                        {employee.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(employee.id)} className="h-8 w-8 p-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table> : <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário cadastrado</h3>
              <p className="text-gray-500 mb-4">Comece adicionando o primeiro funcionário da sua equipe</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Funcionário
              </Button>
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default EmployeeCosts;