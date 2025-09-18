import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Save, Users, Building, Eye, Bell, Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlanAddons } from "@/hooks/usePlanAddons";
import { PlanAddon, PlanAddonFormData, PackageRange } from "@/types/plan-addons";

const PlanAddonsManager: React.FC = () => {
  const { planAddons, loading, refreshPlanAddons } = usePlanAddons();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<PlanAddon | null>(null);
  const [deletingAddonId, setDeletingAddonId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [featureInput, setFeatureInput] = useState("");
  const [formData, setFormData] = useState<PlanAddonFormData>({
    name: "",
    description: "",
    price_per_unit: 0,
    unit_type: "employee",
    is_active: true,
    pricing_type: "per_unit",
    package_ranges: [],
    package_increment: undefined,
    license_cost: 0,
    features: []
  });

  function getAddonIcon(unitType: string) {
    switch(unitType) {
      case 'employee':
        return <Users className="w-4 h-4" />;
      case 'cnpj':
        return <Building className="w-4 h-4" />;
      case 'face_recognition':
        return <Eye className="w-4 h-4" />;
      case 'notification':
        return <Bell className="w-4 h-4" />;
      default:
        return <Plus className="w-4 h-4" />;
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price_per_unit: 0,
      unit_type: "employee",
      is_active: true,
      pricing_type: "per_unit",
      package_ranges: [],
      package_increment: undefined,
      license_cost: 0,
      features: []
    });
    setEditingAddon(null);
    setFeatureInput("");
  };

  const addPackageRange = () => {
    const newRange: PackageRange = { min: 1, max: 10, price: 0 };
    setFormData({
      ...formData,
      package_ranges: [...(formData.package_ranges || []), newRange]
    });
  };

  const updatePackageRange = (index: number, field: keyof PackageRange, value: number) => {
    const updatedRanges = [...(formData.package_ranges || [])];
    updatedRanges[index] = { ...updatedRanges[index], [field]: value };
    setFormData({ ...formData, package_ranges: updatedRanges });
  };

  const removePackageRange = (index: number) => {
    const updatedRanges = formData.package_ranges?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, package_ranges: updatedRanges });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      let result;
      if (editingAddon) {
        result = await supabase
          .from('plan_addons')
          .update({
            name: formData.name,
            description: formData.description,
            price_per_unit: formData.price_per_unit,
            unit_type: formData.unit_type,
            is_active: formData.is_active,
            pricing_type: formData.pricing_type,
            package_ranges: JSON.parse(JSON.stringify(formData.package_ranges)),
            package_increment: formData.package_increment,
            license_cost: formData.license_cost,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAddon.id)
          .select();
      } else {
        result = await supabase
          .from('plan_addons')
          .insert({
            name: formData.name,
            description: formData.description,
            price_per_unit: formData.price_per_unit,
            unit_type: formData.unit_type,
            is_active: formData.is_active,
            pricing_type: formData.pricing_type,
            package_ranges: JSON.parse(JSON.stringify(formData.package_ranges)),
            package_increment: formData.package_increment,
            license_cost: formData.license_cost,
            user_id: user?.id
          })
          .select();
      }

      if (result.error) throw result.error;
      
      toast({
        title: "Sucesso!",
        description: editingAddon ? "Adicional atualizado com sucesso" : "Adicional criado com sucesso",
      });
      
      refreshPlanAddons();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar adicional:', error);
      toast({
        title: "Erro",
        description: `Erro ao ${editingAddon ? 'atualizar' : 'criar'} adicional`,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (addon: PlanAddon) => {
    setEditingAddon(addon);
    setFormData({
      name: addon.name,
      description: addon.description,
      price_per_unit: addon.price_per_unit,
      unit_type: addon.unit_type,
      is_active: addon.is_active,
      pricing_type: addon.pricing_type || 'per_unit',
      package_ranges: addon.package_ranges || [],
      package_increment: addon.package_increment,
      license_cost: addon.license_cost,
      features: addon.features || []
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDeleteAddon = async (addon: PlanAddon) => {
    try {
      setDeletingAddonId(addon.id);

      const { error } = await supabase
        .from('plan_addons')
        .delete()
        .eq('id', addon.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Adicional excluído com sucesso",
      });

      refreshPlanAddons();
    } catch (error) {
      console.error('Erro ao excluir adicional:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir adicional",
        variant: "destructive",
      });
    } finally {
      setDeletingAddonId(null);
    }
  };

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const getUnitTypeLabel = (unitType: string) => {
    switch(unitType) {
      case 'employee':
        return 'funcionário';
      case 'cnpj':
        return 'CNPJ';
      case 'face_recognition':
        return 'funcionário';
      case 'notification':
        return 'funcionário';
      default:
        return 'unidade';
    }
  };

  const getPricingDescription = (addon: PlanAddon) => {
    if (addon.pricing_type === 'package') {
      if (addon.package_ranges && addon.package_ranges.length > 0) {
        return `Preços por pacote (${addon.package_ranges.length} faixas)`;
      }
      if (addon.package_increment) {
        return `A cada ${addon.package_increment} ${getUnitTypeLabel(addon.unit_type)}s`;
      }
    }
    return `${formatPrice(addon.price_per_unit)} por ${getUnitTypeLabel(addon.unit_type)}`;
  };

  if (loading) {
    return <div>Carregando adicionais de planos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">Adicionais de Planos</h2>
            <p className="text-muted-foreground">Gerencie os adicionais disponíveis para os planos</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Adicional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddon ? "Editar Adicional" : "Criar Novo Adicional"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Adicional</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Funcionário Extra"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Adiciona um funcionário extra ao plano"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="unit_type">Tipo de Unidade</Label>
                <Select value={formData.unit_type} onValueChange={(value) => setFormData({ ...formData, unit_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Funcionário</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="face_recognition">Reconhecimento Facial</SelectItem>
                    <SelectItem value="notification">Notificação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pricing_type">Tipo de Precificação</Label>
                <Select value={formData.pricing_type} onValueChange={(value: 'per_unit' | 'package') => setFormData({ ...formData, pricing_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_unit">Por Unidade</SelectItem>
                    <SelectItem value="package">Por Pacote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.pricing_type === 'per_unit' && (
                <div>
                  <Label htmlFor="price_per_unit">Preço por Unidade</Label>
                  <Input
                    id="price_per_unit"
                    type="number"
                    step="0.01"
                    value={formData.price_per_unit}
                    onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="license_cost">Custo da Licença</Label>
                <Input
                  id="license_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.license_cost}
                  onChange={(e) => setFormData({ ...formData, license_cost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>

              {formData.pricing_type === 'package' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Faixas de Pacotes</Label>
                    <Button type="button" onClick={addPackageRange} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Faixa
                    </Button>
                  </div>

                  {formData.package_ranges?.map((range, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <div className="flex-1">
                        <Label className="text-xs">Min</Label>
                        <Input
                          type="number"
                          value={range.min}
                          onChange={(e) => updatePackageRange(index, 'min', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Max</Label>
                        <Input
                          type="number"
                          value={range.max}
                          onChange={(e) => updatePackageRange(index, 'max', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Preço</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={range.price}
                          onChange={(e) => updatePackageRange(index, 'price', parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePackageRange(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <div>
                    <Label htmlFor="package_increment">Incremento de Pacote</Label>
                    <Input
                      id="package_increment"
                      type="number"
                      value={formData.package_increment || ''}
                      onChange={(e) => setFormData({ ...formData, package_increment: parseInt(e.target.value) || undefined })}
                      placeholder="Ex: 100 (para incrementos a cada 100 unidades)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Usado para pacotes incrementais (ex: a cada 100 funcionários)
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="features">Funcionalidades</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="features"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      placeholder="Digite uma funcionalidade e pressione Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (featureInput.trim()) {
                            setFormData({
                              ...formData,
                              features: [...(formData.features || []), featureInput.trim()]
                            });
                            setFeatureInput("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (featureInput.trim()) {
                          setFormData({
                            ...formData,
                            features: [...(formData.features || []), featureInput.trim()]
                          });
                          setFeatureInput("");
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.features && formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {feature}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                features: formData.features?.filter((_, i) => i !== index)
                              });
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAddon ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adicionais Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os adicionais disponíveis para os planos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {planAddons.length === 0 ? (
            <div className="text-center py-8">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum adicional cadastrado</h3>
              <p className="text-muted-foreground mb-4">Comece criando o primeiro adicional de plano</p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Adicional
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Precificação</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Custo da Licença</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planAddons.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
                          {getAddonIcon(addon.unit_type)}
                        </span>
                        <span className="font-medium">{addon.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-sm">{addon.description}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {addon.unit_type === 'employee' && 'Funcionário'}
                        {addon.unit_type === 'cnpj' && 'CNPJ'}
                        {addon.unit_type === 'face_recognition' && 'Reconhecimento Facial'}
                        {addon.unit_type === 'notification' && 'Notificação'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={addon.pricing_type === 'package' ? 'secondary' : 'default'}>
                        {addon.pricing_type === 'package' ? 'Pacote' : 'Por Unidade'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {getPricingDescription(addon)}
                    </TableCell>
                    <TableCell className="font-medium text-orange-600">
                      {formatPrice(addon.license_cost)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={addon.is_active ? "default" : "secondary"}>
                        {addon.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(addon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddon(addon)}
                          disabled={deletingAddonId === addon.id}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanAddonsManager;
