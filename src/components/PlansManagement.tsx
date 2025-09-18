import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, DollarSign, Settings, Calculator, Building2, FileText, Car, Copy, CheckCircle } from "lucide-react";
import { usePlans } from "@/hooks/usePlans";
import { Plan, PlanFormData } from "@/types/plans";
import { useToast } from "@/hooks/use-toast";
import PlanAddonsManager from "./PlanAddonsManager";
import QuoteGenerator from "./QuoteGenerator";
import TechnicalVisitSettingsModal from "./TechnicalVisitSettingsModal";
const PlansManagement = () => {
  const {
    plans,
    loading,
    createPlan,
    updatePlan,
    deletePlan
  } = usePlans();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [activeTab, setActiveTab] = useState("plans");
  const [isQuoteGeneratorOpen, setIsQuoteGeneratorOpen] = useState(false);
  const [isTechnicalVisitModalOpen, setIsTechnicalVisitModalOpen] = useState(false);
  const {
    toast
  } = useToast();
  const [adjustPercent, setAdjustPercent] = useState<number>(0);
  const [featureInput, setFeatureInput] = useState("");
  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    employee_range: "",
    monthly_price: 0,
    semestral_price: 0,
    annual_price: 0,
    allowed_cnpjs: 1,
    license_cost: 0,
    license_exemption_months: 0,
    is_active: true,
    features: []
  });
  const resetForm = () => {
    setFormData({
      name: "",
      employee_range: "",
      monthly_price: 0,
      semestral_price: 0,
      annual_price: 0,
      allowed_cnpjs: 1,
      license_cost: 0,
      license_exemption_months: 0,
      is_active: true,
      features: []
    });
    setEditingPlan(null);
    setFeatureInput("");
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.employee_range || formData.allowed_cnpjs < 1) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, formData);
      } else {
        await createPlan(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
    }
  };

  // Função para calcular valores semestral e anual automaticamente
  const handleMonthlyPriceChange = (value: number) => {
    setFormData({
      ...formData,
      monthly_price: value,
      semestral_price: value * 6,
      // 6 meses
      annual_price: value * 12 // 12 meses
    });
  };

  // Ajuste percentual rápido para reajustes futuros
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const applyPercentageAdjustment = (percent: number) => {
    const p = Number(percent) || 0;
    const factor = 1 + p / 100;
    setFormData(prev => {
      const newMonthly = round2(Number(prev.monthly_price || 0) * factor);
      const newSemestral = round2(newMonthly * 6);
      const newAnnual = round2(newMonthly * 12);
      const newLicense = round2(Number(prev.license_cost || 0) * factor);
      return {
        ...prev,
        monthly_price: newMonthly,
        semestral_price: newSemestral,
        annual_price: newAnnual,
        license_cost: newLicense
      };
    });
    setAdjustPercent(0);
    toast({
      title: "Ajuste aplicado",
      description: `${p}% aplicado nos valores.`
    });
  };
  // Copiar plano atual (no modal de edição)
  const handleCopyPlan = async () => {
    const copyName = `${formData.name} (copia)`;
    const created = await createPlan({
      ...formData,
      name: copyName,
      is_active: true
    });
    if (created) {
      toast({
        title: "Plano copiado",
        description: `Criado "${copyName}"`
      });
    }
  };
  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      employee_range: plan.employee_range,
      monthly_price: plan.monthly_price,
      semestral_price: plan.semestral_price,
      annual_price: plan.annual_price,
      allowed_cnpjs: plan.allowed_cnpjs || 1,
      license_cost: plan.license_cost || 0,
      license_exemption_months: plan.license_exemption_months || 0,
      is_active: plan.is_active,
      features: plan.features || []
    });
    setIsDialogOpen(true);
  };
  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };
  const handleDelete = async (plan: Plan) => {
    await deletePlan(plan.id);
  };
  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };
  if (loading) {
    return <div>Carregando planos...</div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">Gerenciar Planos</h2>
            <p className="text-muted-foreground">Gerencie os planos de serviço e suas configurações</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsQuoteGeneratorOpen(true)} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Gerador de Orçamentos
          </Button>
          
          
          
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planos Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os planos de serviço com suas configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="plans">Planos</TabsTrigger>
              <TabsTrigger value="addons">Adicionais</TabsTrigger>
            </TabsList>
            
            <TabsContent value="plans" className="mt-6">
              {plans.length > 0 ? <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Funcionários</TableHead>
                        <TableHead>Preço Mensal</TableHead>
                        <TableHead>Preço Semestral</TableHead>
                        <TableHead>Preço Anual</TableHead>
                        <TableHead>Custo da Licença</TableHead>
                        <TableHead>Isenção Licença</TableHead>
                        <TableHead>CNPJs</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {plans.map(plan => <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>{plan.employee_range}</TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {formatPrice(plan.monthly_price)}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatPrice(plan.semestral_price)}
                        </TableCell>
                        <TableCell className="font-medium text-purple-600">
                          {formatPrice(plan.annual_price)}
                        </TableCell>
                        <TableCell className="font-medium text-orange-600">
                          {formatPrice(plan.license_cost || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/10">
                            {plan.license_exemption_months || 0} {plan.license_exemption_months === 1 ? 'mês' : 'meses'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {plan.allowed_cnpjs} CNPJ{plan.allowed_cnpjs > 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(plan)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(plan)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table> : <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum plano cadastrado</h3>
                  <p className="text-muted-foreground mb-4">Comece criando o primeiro plano de serviço</p>
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Plano
                  </Button>
                </div>}
            </TabsContent>
            
            <TabsContent value="addons" className="mt-6">
              <PlanAddonsManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <QuoteGenerator isOpen={isQuoteGeneratorOpen} onClose={() => setIsQuoteGeneratorOpen(false)} />
      
      <TechnicalVisitSettingsModal isOpen={isTechnicalVisitModalOpen} onClose={() => setIsTechnicalVisitModalOpen(false)} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Editar Plano" : "Novo Plano"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nome do Plano</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} placeholder="Ex: Plano Básico" required />
              </div>

              <div>
                <Label htmlFor="employee_range">Funcionários</Label>
                <Input id="employee_range" value={formData.employee_range} onChange={e => setFormData({
                ...formData,
                employee_range: e.target.value
              })} placeholder="Ex: 1-50" required />
              </div>

              <div>
                <Label htmlFor="allowed_cnpjs">CNPJs Permitidos</Label>
                <Input id="allowed_cnpjs" type="number" min="1" value={formData.allowed_cnpjs} onChange={e => setFormData({
                ...formData,
                allowed_cnpjs: parseInt(e.target.value) || 1
              })} required />
              </div>

              <div>
                <Label htmlFor="monthly_price">Preço Mensal (R$)</Label>
                <Input id="monthly_price" type="number" step="0.01" min="0" value={formData.monthly_price} onChange={e => handleMonthlyPriceChange(parseFloat(e.target.value) || 0)} required />
              </div>

              <div>
                <Label htmlFor="semestral_price">Preço Semestral (R$)</Label>
                <Input id="semestral_price" type="number" step="0.01" min="0" value={formData.semestral_price} onChange={e => setFormData({
                ...formData,
                semestral_price: parseFloat(e.target.value) || 0
              })} required />
              </div>

              <div>
                <Label htmlFor="annual_price">Preço Anual (R$)</Label>
                <Input id="annual_price" type="number" step="0.01" min="0" value={formData.annual_price} onChange={e => setFormData({
                ...formData,
                annual_price: parseFloat(e.target.value) || 0
              })} required />
              </div>

              <div>
                <Label htmlFor="license_cost">Custo da Licença (R$)</Label>
                <Input id="license_cost" type="number" step="0.01" min="0" value={formData.license_cost} onChange={e => setFormData({
                ...formData,
                license_cost: parseFloat(e.target.value) || 0
              })} placeholder="0.00" />
              </div>

              <div>
                <Label htmlFor="license_exemption_months">Meses de Isenção da Licença</Label>
                <Input 
                  id="license_exemption_months" 
                  type="number" 
                  min="0" 
                  value={formData.license_exemption_months} 
                  onChange={e => setFormData({
                    ...formData,
                    license_exemption_months: parseInt(e.target.value) || 0
                  })} 
                  placeholder="Ex: 3 (isenção por 3 meses)" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Defina quantos meses o cliente terá isenção do custo de licença após contratar o plano
                </p>
              </div>
            </div>

            <div className="col-span-2">
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

            <div className="col-span-2 flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="adjust_percent">Ajuste (%)</Label>
                <Input id="adjust_percent" type="number" step="0.01" value={adjustPercent} onChange={e => setAdjustPercent(parseFloat(e.target.value) || 0)} placeholder="Ex.: 10 para +10% ou -5 para -5%" />
              </div>
              <Button type="button" variant="outline" onClick={() => applyPercentageAdjustment(adjustPercent)}>
                Aplicar %
              </Button>
            </div>

            <div className="flex justify-between items-center pt-4">
              {editingPlan && <Button type="button" variant="secondary" onClick={handleCopyPlan}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar plano
                </Button>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPlan ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>;
};
export default PlansManagement;