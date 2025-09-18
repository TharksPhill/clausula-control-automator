
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
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Calculator,
  DollarSign
} from "lucide-react";
import { useCosts, CompanyCost } from "@/hooks/useCosts";
import { useContracts } from "@/hooks/useContracts";
import { useForm } from "react-hook-form";

interface TaxForm {
  category: string;
  description: string;
  monthly_cost: number;
  cost_type: 'fixed' | 'variable';
  is_active: boolean;
  tax_percentage?: number;
}

const TaxManagement = () => {
  const { companyCosts, loading, saveCompanyCost, updateCompanyCost, deleteCompanyCost } = useCosts();
  const { contracts } = useContracts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<CompanyCost | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TaxForm>({
    defaultValues: {
      category: "tax",
      description: "",
      monthly_cost: 0,
      cost_type: "variable",
      is_active: true,
      tax_percentage: 0
    }
  });

  // Calcular faturamento mensal total dos contratos ativos
  const calculateMonthlyRevenue = () => {
    if (!contracts) return 0;
    
    return contracts
      .filter(contract => contract.status === 'Ativo')
      .reduce((total, contract) => {
        const rawValue = parseFloat(contract.monthly_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
        const planType = contract.plan_type || 'mensal';
        
        let monthlyRevenue = 0;

        if (planType === 'anual') {
          monthlyRevenue = rawValue / 12;
        } else if (planType === 'semestral') {
          monthlyRevenue = rawValue / 6;
        } else {
          monthlyRevenue = rawValue;
        }

        return total + monthlyRevenue;
      }, 0);
  };

  const monthlyRevenue = calculateMonthlyRevenue();

  // Filtrar apenas impostos
  const taxCosts = companyCosts.filter(cost => cost.category === 'tax');
  const activeTaxCosts = taxCosts.filter(cost => cost.is_active);
  const totalTaxCost = activeTaxCosts.reduce((sum, cost) => sum + cost.monthly_cost, 0);

  // Função para calcular a porcentagem do imposto baseada no valor monetário e faturamento
  const calculateTaxPercentage = (taxValue: number, revenue: number) => {
    if (revenue <= 0) return 0;
    return (taxValue / revenue) * 100;
  };

  const onSubmit = async (data: TaxForm) => {
    try {
      // Validar se a porcentagem foi informada
      if (!data.tax_percentage || data.tax_percentage <= 0) {
        alert("Por favor, informe uma porcentagem válida para o imposto.");
        return;
      }

      // Calcular o valor monetário baseado na porcentagem informada
      const calculatedValue = (monthlyRevenue * data.tax_percentage) / 100;
      
      // Salvar com o valor calculado e preservar a descrição com a porcentagem
      const taxData = {
        category: "tax",
        monthly_cost: calculatedValue,
        description: `${data.description} (${data.tax_percentage}%)`,
        cost_type: "fixed",
        is_active: true
      };

      if (editingTax) {
        await updateCompanyCost(editingTax.id, taxData);
      } else {
        await saveCompanyCost(taxData);
      }
      
      setIsDialogOpen(false);
      setEditingTax(null);
      reset();
    } catch (error) {
      console.error("Erro ao salvar imposto:", error);
    }
  };

  const handleEdit = (tax: CompanyCost) => {
    setEditingTax(tax);
    setValue("category", "tax");
    setValue("description", tax.description.replace(/\s*\(\d+(?:\.\d+)?%\)$/, '')); // Remove a porcentagem da descrição
    setValue("monthly_cost", tax.monthly_cost);
    // Tipo de custo será sempre fixo para impostos
    setValue("is_active", tax.is_active);
    
    // Extrair a porcentagem da descrição ou calcular baseado no valor
    const percentageMatch = tax.description.match(/\((\d+(?:\.\d+)?)%\)/);
    let percentage = 0;
    
    if (percentageMatch) {
      percentage = parseFloat(percentageMatch[1]);
    } else if (monthlyRevenue > 0) {
      percentage = calculateTaxPercentage(tax.monthly_cost, monthlyRevenue);
    }
    
    setValue("tax_percentage", Math.round(percentage * 100) / 100);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteCompanyCost(id);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTax(null);
    reset();
  };

  // Função para extrair a porcentagem salva na descrição
  const getStoredPercentage = (description: string) => {
    const match = description.match(/\((\d+(?:\.\d+)?)%\)/);
    return match ? parseFloat(match[1]) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando impostos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Impostos</h1>
            <p className="text-muted-foreground">Gerencie todos os impostos da empresa</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Imposto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTax ? "Editar Imposto" : "Adicionar Imposto"}
              </DialogTitle>
              <DialogDescription>
                {editingTax ? "Edite os dados do imposto" : "Cadastre um novo imposto da empresa"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="description">Descrição do Imposto</Label>
                <Textarea
                  id="description"
                  {...register("description", { required: "Descrição é obrigatória" })}
                  placeholder="Ex: ISS, IRPJ, CSLL, PIS/COFINS, etc."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-4 p-4 bg-muted/50 border border-border rounded-lg">
                <div>
                  <Label htmlFor="tax_percentage">Percentual do Imposto (%)</Label>
                  <Input
                    id="tax_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register("tax_percentage", { 
                      required: "Percentual é obrigatório",
                      min: { value: 0.01, message: "Percentual deve ser maior que 0" },
                      max: { value: 100, message: "Percentual não pode ser maior que 100%" }
                    })}
                    placeholder="Ex: 5.5"
                  />
                  {errors.tax_percentage && (
                    <p className="text-sm text-red-500 mt-1">{errors.tax_percentage.message}</p>
                  )}
                </div>
                
                <div className="bg-background p-3 rounded border border-border">
                  <Label className="text-sm font-medium text-muted-foreground">Valor Calculado Automaticamente</Label>
                  <div className="text-lg font-bold text-red-600 mt-1">
                    R$ {((watch("tax_percentage") || 0) * monthlyRevenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {watch("tax_percentage") || 0}% de R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="cost_type">Tipo de Custo</Label>
                <Select onValueChange={(value: 'fixed' | 'variable') => setValue("cost_type", value)} defaultValue="variable">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixo</SelectItem>
                    <SelectItem value="variable">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  {...register("is_active")}
                />
                <Label htmlFor="is_active">Imposto ativo</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTax ? "Atualizar" : "Salvar"}
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
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total de Impostos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalTaxCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTaxCosts.length} impostos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Faturamento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Base para cálculo dos impostos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Percentual Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {monthlyRevenue > 0 ? ((totalTaxCost / monthlyRevenue) * 100).toFixed(2) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Do faturamento mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Impostos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Impostos</CardTitle>
          <CardDescription>
            Gerencie todos os impostos da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {taxCosts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Percentual</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxCosts.map((tax) => {
                  const storedPercentage = getStoredPercentage(tax.description);
                  const displayPercentage = storedPercentage > 0 ? storedPercentage : 
                    (monthlyRevenue > 0 ? calculateTaxPercentage(tax.monthly_cost, monthlyRevenue) : 0);
                  
                  return (
                    <TableRow key={tax.id}>
                      <TableCell className="max-w-xs">
                        <p className="truncate">{tax.description.replace(/\s*\(\d+(?:\.\d+)?%\)$/, '')}</p>
                      </TableCell>
                      <TableCell className="font-bold">
                        R$ {tax.monthly_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-red-600">
                          {displayPercentage.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tax.cost_type === 'fixed' ? 'default' : 'secondary'}>
                          {tax.cost_type === 'fixed' ? 'Fixo' : 'Variável'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tax.is_active ? "default" : "secondary"}>
                          {tax.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tax)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(tax.id)}
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
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum imposto cadastrado</h3>
              <p className="text-muted-foreground mb-4">Comece adicionando o primeiro imposto da sua empresa</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Imposto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxManagement;
