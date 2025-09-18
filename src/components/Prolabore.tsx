import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { User, Plus, Edit, Trash2, Calculator, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface ProlaboreForm {
  name: string;
  role: string;
  monthly_value: number;
  percentage: number;
  description: string;
  is_active: boolean;
}

interface Prolabore {
  id: string;
  name: string;
  role: string;
  monthly_value: number;
  percentage: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Prolabore = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProlabore, setEditingProlabore] = useState<Prolabore | null>(null);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProlaboreForm>({
    defaultValues: {
      name: "",
      role: "",
      monthly_value: 0,
      percentage: 0,
      description: "",
      is_active: true
    }
  });

  const monthlyValue = watch("monthly_value") || 0;
  const percentage = watch("percentage") || 0;

  // Query para buscar pró-labore
  const { data: prolaboreData = [], isLoading } = useQuery({
    queryKey: ['prolabore'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prolabore')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Mutation para salvar pró-labore
  const saveMutation = useMutation({
    mutationFn: async (data: ProlaboreForm) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('prolabore')
        .insert({
          ...data,
          user_id: user.user.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prolabore'] });
      toast({
        title: "Sucesso",
        description: "Pró-labore cadastrado com sucesso!",
      });
      setIsDialogOpen(false);
      reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar pró-labore: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar pró-labore
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProlaboreForm }) => {
      const { error } = await supabase
        .from('prolabore')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prolabore'] });
      toast({
        title: "Sucesso",
        description: "Pró-labore atualizado com sucesso!",
      });
      setIsDialogOpen(false);
      setEditingProlabore(null);
      reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar pró-labore: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para deletar pró-labore
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prolabore')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prolabore'] });
      toast({
        title: "Sucesso",
        description: "Pró-labore excluído com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir pró-labore: " + error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (data: ProlaboreForm) => {
    if (editingProlabore) {
      updateMutation.mutate({ id: editingProlabore.id, data });
    } else {
      saveMutation.mutate(data);
    }
  };

  const handleEdit = (prolabore: Prolabore) => {
    setEditingProlabore(prolabore);
    setValue("name", prolabore.name);
    setValue("role", prolabore.role);
    setValue("monthly_value", prolabore.monthly_value);
    setValue("percentage", prolabore.percentage);
    setValue("description", prolabore.description);
    setValue("is_active", prolabore.is_active);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProlabore(null);
    reset();
  };

  const activeProlabore = prolaboreData.filter(item => item.is_active);
  const totalMonthlyValue = activeProlabore.reduce((sum, item) => sum + item.monthly_value, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pró-labore...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pró-labore</h1>
            <p className="text-gray-600">Gerencie os valores de pró-labore dos sócios e administradores</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pró-labore
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProlabore ? "Editar Pró-labore" : "Adicionar Pró-labore"}
              </DialogTitle>
              <DialogDescription>
                {editingProlabore ? "Edite os dados do pró-labore" : "Cadastre um novo pró-labore"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  {...register("name", { required: "Nome é obrigatório" })}
                  placeholder="Digite o nome do beneficiário"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="role">Função/Cargo</Label>
                <Input
                  id="role"
                  {...register("role", { required: "Função é obrigatória" })}
                  placeholder="Ex: Sócio, Diretor, Administrador"
                />
                {errors.role && (
                  <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="monthly_value">Valor Mensal (R$)</Label>
                <Input
                  id="monthly_value"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("monthly_value", { 
                    required: "Valor mensal é obrigatório",
                    min: { value: 0, message: "Valor deve ser positivo" }
                  })}
                  placeholder="0,00"
                />
                {errors.monthly_value && (
                  <p className="text-sm text-red-500 mt-1">{errors.monthly_value.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="percentage">Porcentagem dos Lucros (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register("percentage", { 
                    min: { value: 0, message: "Porcentagem deve ser positiva" },
                    max: { value: 100, message: "Porcentagem não pode ser maior que 100%" }
                  })}
                  placeholder="0,00"
                />
                {errors.percentage && (
                  <p className="text-sm text-red-500 mt-1">{errors.percentage.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Informações adicionais"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  {...register("is_active")}
                />
                <Label htmlFor="is_active">Pró-labore ativo</Label>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Calculator className="h-4 w-4" />
                  Resumo
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Valor fixo:</span>
                    <span className="font-medium">R$ {monthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>% dos lucros:</span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending || updateMutation.isPending}>
                  {editingProlabore ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <User className="h-4 w-4" />
              Total de Beneficiários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeProlabore.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Pró-labore ativos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Total Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Soma de todos os valores fixos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Valor Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {activeProlabore.length > 0 ? (totalMonthlyValue / activeProlabore.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Média dos valores por beneficiário
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Pró-labore */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pró-labore</CardTitle>
          <CardDescription>
            Gerencie todos os pró-labore e seus valores mensais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prolaboreData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>% Lucros</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prolaboreData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.role}</TableCell>
                    <TableCell>R$ {item.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{item.percentage}%</TableCell>
                    <TableCell className="max-w-xs truncate">{item.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending}
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
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pró-labore cadastrado</h3>
              <p className="text-gray-500 mb-4">Comece adicionando o primeiro pró-labore</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Pró-labore
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Prolabore;