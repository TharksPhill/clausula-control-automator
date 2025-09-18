import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { useCosts } from "@/hooks/useCosts";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// Categorias baseadas nas imagens compartilhadas
const expenseCategories = {
  administrative: {
    label: "Administrativo",
    color: "bg-blue-500",
    items: [
      { key: "water", label: "Água" },
      { key: "rent", label: "Aluguel" },
      { key: "condo", label: "Condomínio" },
      { key: "accounting", label: "Contabilidade" },
      { key: "internet", label: "Internet" },
      { key: "iptu", label: "IPTU" },
      { key: "cleaning", label: "Limpeza" },
      { key: "electricity", label: "Luz" },
      { key: "payment_machine", label: "Máquina Pagamento" },
      { key: "marketing", label: "Publicidade" },
      { key: "phone", label: "Telefone" },
      { key: "systems", label: "Sistemas" }
    ]
  },
  taxes: {
    label: "Impostos",
    color: "bg-red-500",
    items: [
      { key: "cofins", label: "COFINS" },
      { key: "fgts", label: "FGTS" },
      { key: "icms", label: "ICMS" },
      { key: "inss", label: "INSS" },
      { key: "ipi", label: "IPI" },
      { key: "iss", label: "ISS" },
      { key: "mei", label: "MEI" },
      { key: "pis", label: "PIS" },
      { key: "simples", label: "Simples Nacional" },
      { key: "gare", label: "Gare" }
    ]
  },
  merchandise: {
    label: "Pagamento Mercadoria",
    color: "bg-purple-500",
    items: [
      { key: "equipment", label: "Equipamentos" },
      { key: "supplies", label: "Insumos" },
      { key: "raw_material", label: "Matéria-Prima" },
      { key: "merchandise_payment", label: "Pag Mercadoria" },
      { key: "rhid", label: "RHiD" }
    ]
  },
  operational: {
    label: "Operacional",
    color: "bg-orange-500",
    items: [
      { key: "fuel", label: "Combustível" },
      { key: "mail", label: "Correios" },
      { key: "freight", label: "Frete" },
      { key: "equipment_maintenance", label: "Manutenção Equipamento" },
      { key: "vehicle_maintenance", label: "Manutenção Veículo" },
      { key: "toll", label: "Pedágio" },
      { key: "transport", label: "Transporte" },
      { key: "other_operational", label: "Outro" }
    ]
  },
  personal: {
    label: "Pessoal",
    color: "bg-green-500",
    items: [
      { key: "medical_assistance", label: "Assistência Médica" },
      
      { key: "salary", label: "Salário" },
      { key: "external_lunch", label: "Almoço Externo" },
      { key: "araraquara_lunch", label: "Almoço Araraquara" },
      { key: "transport_voucher", label: "Vale Transporte" },
      { key: "robson", label: "Robson" }
    ]
  },
  non_operational: {
    label: "Não Operacional",
    color: "bg-gray-500",
    items: [
      { key: "non_op_revenue", label: "Receita Não Operacional" },
      { key: "leisure_rent", label: "Aluguel Área de Lazer" },
      { key: "working_capital", label: "Capital De Giro" },
      { key: "investment_returns", label: "Rendimentos Aplicações" },
      { key: "investment_rescue", label: "Resgate Investimento" },
      { key: "other_non_op", label: "Outro" },
      { key: "particular_cost", label: "Custo Particular" },
      { key: "company_improvements", label: "Empresa (Melhorias)" },
      { key: "loan_installment", label: "Parcela Empréstimo" },
      { key: "equipment_installment", label: "Parcela Equipamento" },
      { key: "others", label: "Outros" },
      { key: "ford_ka", label: "FORD KA" },
      { key: "bank_fee", label: "Tarifa de Banco" },
      { key: "leisure_area", label: "Área de Lazer" }
    ]
  }
};

interface CompanyCostForm {
  category: string;
  subcategory: string;
  description: string;
  monthly_cost: number;
  cost_type: string;
}

const EnhancedCompanyCosts = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
  const { companyCosts, saveCompanyCost, updateCompanyCost, deleteCompanyCost } = useCosts();
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CompanyCostForm>();

  // Todos os custos ativos em uma única lista
  const allCosts = useMemo(() => {
    if (!companyCosts) return [];
    return companyCosts.filter(cost => cost.is_active);
  }, [companyCosts]);

  // Total geral
  const grandTotal = useMemo(() => {
    const monthly = allCosts.reduce((sum, cost) => sum + (cost.monthly_cost || 0), 0);
    return {
      monthly,
      annual: monthly * 12
    };
  }, [allCosts]);

  const handleSave = async (data: CompanyCostForm) => {
    try {
      const costData = {
        category: data.category,
        description: data.description,
        monthly_cost: data.monthly_cost,
        cost_type: data.cost_type,
        is_active: true
      };

      if (editingCost) {
        await updateCompanyCost(editingCost.id, costData);
        toast.success("Custo atualizado com sucesso!");
      } else {
        await saveCompanyCost(costData);
        toast.success("Custo criado com sucesso!");
      }
      
      setIsDialogOpen(false);
      setEditingCost(null);
      reset();
    } catch (error) {
      toast.error("Erro ao salvar custo");
    }
  };

  const handleEdit = (cost: any) => {
    setEditingCost(cost);
    setValue("category", cost.category);
    setValue("subcategory", cost.subcategory || "");
    setValue("description", cost.description);
    setValue("monthly_cost", cost.monthly_cost);
    setValue("cost_type", cost.cost_type);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompanyCost(id);
      toast.success("Custo excluído com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir custo");
    }
  };

  const handleNewCost = () => {
    setEditingCost(null);
    reset();
    setIsDialogOpen(true);
  };

  const getCategoryInfo = (categoryKey: string) => {
    return expenseCategories[categoryKey as keyof typeof expenseCategories] || 
           { label: categoryKey, color: "bg-gray-500" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">Custos da Empresa</h2>
            <p className="text-muted-foreground">Gerencie os custos da empresa organizados por categoria</p>
          </div>
        </div>
        
        <Button 
          onClick={handleNewCost}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Custo
        </Button>
      </div>

      {/* Card de destaque com total dos custos */}
      {grandTotal.monthly > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              💸 Total de Custos da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              R$ {grandTotal.monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
            </div>
            <p className="text-muted-foreground">
              Custo anual total: R$ {grandTotal.annual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Custos da Empresa Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os custos da empresa organizados por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allCosts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-32 text-center">Mensal</TableHead>
                  <TableHead className="w-32 text-center">Anual</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCosts.map((cost) => {
                  const categoryInfo = getCategoryInfo(cost.category);
                  return (
                    <TableRow key={cost.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${categoryInfo.color}`} />
                          <span className="font-medium">{categoryInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {cost.description}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        R$ {cost.monthly_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        R$ {(cost.monthly_cost * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cost)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cost.id)}
                            className="text-red-600 hover:text-red-700"
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
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum custo cadastrado</p>
              <Button
                variant="outline"
                onClick={handleNewCost}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeiro custo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Adicionar/Editar Custo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCost ? "Editar" : "Novo"} Custo
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={watch("category")} onValueChange={(value) => setValue("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(expenseCategories).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                {...register("description", { required: "Descrição é obrigatória" })}
                placeholder="Ex: Aluguel do escritório"
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="monthly_cost">Valor Mensal (R$)</Label>
              <Input
                id="monthly_cost"
                type="number"
                step="0.01"
                min="0"
                {...register("monthly_cost", { 
                  required: "Valor é obrigatório",
                  min: { value: 0, message: "Valor deve ser positivo" },
                  valueAsNumber: true
                })}
                placeholder="0.00"
              />
              {errors.monthly_cost && (
                <p className="text-sm text-red-500 mt-1">{errors.monthly_cost.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cost_type">Tipo de Custo</Label>
              <Select value={watch("cost_type")} onValueChange={(value) => setValue("cost_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixo</SelectItem>
                  <SelectItem value="variable">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingCost ? "Atualizar" : "Criar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingCost(null);
                  reset();
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedCompanyCosts;