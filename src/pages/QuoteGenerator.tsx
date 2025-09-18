
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, FileText, Share2, Download, Eye } from "lucide-react";
import { useQuotes } from "@/hooks/useQuotes";
import { usePlans } from "@/hooks/usePlans";
import { QuoteFormData } from "@/types/quotes";
import BackButton from "@/components/BackButton";

const QuoteGenerator = () => {
  const navigate = useNavigate();
  const { createQuote, isCreating } = useQuotes();
  const { plans } = usePlans();
  
  const [formData, setFormData] = useState<QuoteFormData>({
    system_name: "",
    system_description: "",
    features: [],
    selected_plan_id: "",
    validity_days: 30,
    client_name: "",
    client_email: "",
    client_phone: "",
    client_company: "",
    notes: ""
  });

  const [customFeature, setCustomFeature] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Lista de funcionalidades pré-definidas
  const predefinedFeatures = [
    "Dashboard administrativo",
    "Gestão de usuários",
    "Relatórios em tempo real",
    "Integração com APIs",
    "Sistema de notificações",
    "Backup automático",
    "Suporte técnico 24/7",
    "Treinamento da equipe",
    "Customização de layout",
    "Aplicativo mobile",
    "Sistema de autenticação",
    "Controle de acesso por níveis"
  ];

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const addCustomFeature = () => {
    if (customFeature.trim() && !formData.features.includes(customFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, customFeature.trim()]
      }));
      setCustomFeature("");
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const handlePlanSelect = (planId: string) => {
    const plan = plans?.find(p => p.id === planId);
    setSelectedPlan(plan);
    setFormData(prev => ({
      ...prev,
      selected_plan_id: planId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.system_name.trim()) {
      return;
    }

    try {
      const quote = await createQuote(formData);
      navigate(`/quote-preview/${quote.id}`);
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Gerador de Orçamentos</h1>
          <p className="text-gray-600 mt-2">Crie orçamentos profissionais para seus clientes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="system_name">Nome do Sistema *</Label>
                <Input
                  id="system_name"
                  value={formData.system_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, system_name: e.target.value }))}
                  placeholder="Ex: Sistema de Gestão Empresarial"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="system_description">Descrição do Sistema</Label>
                <Textarea
                  id="system_description"
                  value={formData.system_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, system_description: e.target.value }))}
                  placeholder="Descreva as principais características e objetivos do sistema..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Funcionalidades */}
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades Incluídas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {predefinedFeatures.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={formData.features.includes(feature)}
                      onCheckedChange={() => handleFeatureToggle(feature)}
                    />
                    <Label htmlFor={feature} className="text-sm">{feature}</Label>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex gap-2">
                <Input
                  value={customFeature}
                  onChange={(e) => setCustomFeature(e.target.value)}
                  placeholder="Adicionar funcionalidade personalizada..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomFeature())}
                />
                <Button type="button" onClick={addCustomFeature} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {formData.features.length > 0 && (
                <div className="space-y-2">
                  <Label>Funcionalidades Selecionadas:</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeFeature(feature)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seleção de Plano */}
          <Card>
            <CardHeader>
              <CardTitle>Plano de Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="plan">Selecionar Plano</Label>
                  <Select value={formData.selected_plan_id} onValueChange={handlePlanSelect}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Escolha um plano..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - R$ {plan.monthly_price}/mês
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPlan && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900">{selectedPlan.name}</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedPlan.employee_range} funcionários
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Mensal:</span> R$ {selectedPlan.monthly_price}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Semestral:</span> R$ {selectedPlan.semestral_price}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Anual:</span> R$ {selectedPlan.annual_price}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name">Nome do Contato</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="Nome completo"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="client_company">Empresa</Label>
                  <Input
                    id="client_company"
                    value={formData.client_company}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_company: e.target.value }))}
                    placeholder="Nome da empresa"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="client_email">E-mail</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
                    placeholder="email@empresa.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="client_phone">Telefone</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Orçamento */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="validity_days">Validade (dias)</Label>
                <Input
                  id="validity_days"
                  type="number"
                  value={formData.validity_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, validity_days: parseInt(e.target.value) || 30 }))}
                  min="1"
                  max="365"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações adicionais, condições especiais, etc..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? "Gerando..." : "Gerar Orçamento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteGenerator;
