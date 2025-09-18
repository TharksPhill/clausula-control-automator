import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, FileText, Plus, Minus, Building2, Users, DollarSign, Copy, Download, Percent, File, Trash2, Calendar, Gift, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { usePlans } from "@/hooks/usePlans";
import { usePlanAddons } from "@/hooks/usePlanAddons";
import { Plan } from "@/types/plans";
import { supabase } from "@/integrations/supabase/client";
import { PlanAddon } from "@/types/plan-addons";
import { generateQuotePDF, generateQuoteText, QuoteData as QuoteDataType } from "@/utils/quotePdfGenerator";

interface QuoteGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedAddon {
  addon: PlanAddon;
  quantity: number;
}

interface DiscountData {
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
}

interface QuoteData {
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientPhone: string;
  selectedPlan: Plan | null;
  planPeriod: 'monthly' | 'semestral' | 'annual';
  selectedAddons: SelectedAddon[];
  systemName: string;
  systemDescription: string;
  introduction: string;
  validityDays: number;
  discount: DiscountData;
  hasFreeTrial: boolean;
  freeTrialDays: number;
  paymentStartDate: Date | null;
}

const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const { plans, loading: plansLoading } = usePlans();
  const { planAddons, loading: addonsLoading } = usePlanAddons();

  const [quoteData, setQuoteData] = useState<QuoteData>({
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    clientPhone: "",
    selectedPlan: null,
    planPeriod: 'monthly',
    selectedAddons: [],
    systemName: "RHiD + iDSecure",
    systemDescription: "Sistema completo de gestão de ponto eletrônico (RHiD) integrado com controle de acesso (iDSecure)",
    introduction: "Apresentamos nossa proposta exclusiva para sua empresa. Nossa solução foi desenvolvida para atender às suas necessidades específicas, proporcionando eficiência e inovação para o seu negócio.",
    validityDays: 30,
    discount: {
      type: 'percentage',
      value: 0,
      description: ''
    },
    hasFreeTrial: false,
    freeTrialDays: 0,
    paymentStartDate: null
  });

  // Log dos addons apenas quando mudam, sem forçar refresh
  useEffect(() => {
    if (planAddons.length > 0) {
      console.log('=== ADDONS CARREGADOS NO QUOTE GENERATOR ===');
      console.log('Total de addons:', planAddons.length);
      
      // Filtrar addons únicos por nome para evitar duplicatas
      const uniqueAddons = planAddons.filter((addon, index, self) => 
        index === self.findIndex(a => a.name === addon.name)
      );
      
      console.log('Addons únicos após filtro:', uniqueAddons.length);
      uniqueAddons.forEach((addon, index) => {
        console.log(`Addon ${index + 1}:`, {
          name: addon.name,
          price_per_unit: addon.price_per_unit,
          unit_type: addon.unit_type
        });
      });
      console.log('===========================================');
    }
  }, [planAddons]);

  // Atualizar data de início de pagamento quando dias de teste mudar
  useEffect(() => {
    if (quoteData.hasFreeTrial && quoteData.freeTrialDays > 0) {
      const startDate = addDays(new Date(), quoteData.freeTrialDays);
      setQuoteData(prev => ({ ...prev, paymentStartDate: startDate }));
    } else {
      setQuoteData(prev => ({ ...prev, paymentStartDate: new Date() }));
    }
  }, [quoteData.hasFreeTrial, quoteData.freeTrialDays]);

  const resetForm = () => {
    setQuoteData({
      clientName: "",
      clientEmail: "",
      clientCompany: "",
      clientPhone: "",
      selectedPlan: null,
      planPeriod: 'monthly',
      selectedAddons: [],
      systemName: "RHiD + iDSecure",
      systemDescription: "Sistema completo de gestão de ponto eletrônico (RHiD) integrado com controle de acesso (iDSecure)",
      introduction: "Apresentamos nossa proposta exclusiva para sua empresa. Nossa solução foi desenvolvida para atender às suas necessidades específicas, proporcionando eficiência e inovação para o seu negócio.",
      validityDays: 30,
      discount: {
        type: 'percentage',
        value: 0,
        description: ''
      },
      hasFreeTrial: false,
      freeTrialDays: 0,
      paymentStartDate: null
    });
  };

  const handlePlanSelect = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    console.log('Plano selecionado:', plan);
    console.log('Features do plano:', plan?.features);
    setQuoteData(prev => ({ ...prev, selectedPlan: plan || null }));
  };

  const addAddon = (addon: PlanAddon) => {
    console.log('=== ADICIONANDO ADDON ===');
    console.log('Addon sendo adicionado:', {
      name: addon.name,
      price_per_unit: addon.price_per_unit,
      unit_type: addon.unit_type
    });
    
    setQuoteData(prev => ({
      ...prev,
      selectedAddons: [...prev.selectedAddons, { addon, quantity: 1 }]
    }));
  };

  const removeAddon = (index: number) => {
    setQuoteData(prev => ({
      ...prev,
      selectedAddons: prev.selectedAddons.filter((_, i) => i !== index)
    }));
  };

  const updateAddonQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setQuoteData(prev => ({
      ...prev,
      selectedAddons: prev.selectedAddons.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    }));
  };

  const calculatePlanPrice = () => {
    if (!quoteData.selectedPlan) return 0;
    
    switch (quoteData.planPeriod) {
      case 'semestral':
        return quoteData.selectedPlan.semestral_price;
      case 'annual':
        return quoteData.selectedPlan.annual_price;
      default:
        return quoteData.selectedPlan.monthly_price;
    }
  };

  const calculateAddonsTotal = () => {
    const addonsTotal = quoteData.selectedAddons.reduce((total, { addon, quantity }) => {
      let itemPrice = 0;
      
      // Verificar o tipo de precificação do addon
      if (addon.pricing_type === 'package' && addon.package_ranges && addon.package_ranges.length > 0) {
        // Para pacotes, encontrar a faixa de preço apropriada
        const sortedRanges = [...addon.package_ranges].sort((a, b) => a.min - b.min);
        
        // Encontrar a faixa apropriada para a quantidade
        const range = sortedRanges.find(r => quantity >= r.min && quantity <= r.max) || 
                     sortedRanges[sortedRanges.length - 1]; // Usar a última faixa se nenhuma corresponder
        
        if (range) {
          // Para tipo pacote, usar o preço da faixa diretamente
          itemPrice = range.price;
          console.log(`Addon ${addon.name} (pacote): Quantidade ${quantity}, Faixa ${range.min}-${range.max}, Preço: ${range.price}`);
        } else {
          // Fallback para price_per_unit se não houver faixas
          itemPrice = addon.price_per_unit * quantity;
          console.log(`Addon ${addon.name} (pacote sem faixa): ${addon.price_per_unit} x ${quantity} = ${itemPrice}`);
        }
      } else {
        // Para precificação por unidade
        itemPrice = addon.price_per_unit * quantity;
        console.log(`Addon ${addon.name} (por unidade): ${addon.price_per_unit} x ${quantity} = ${itemPrice}`);
      }
      
      return total + itemPrice;
    }, 0);

    // Multiplicar addons pelo período selecionado
    const periodMultiplier = getPlanPeriodMultiplier();
    return addonsTotal * periodMultiplier;
  };

  const getSubtotal = () => {
    return calculatePlanPrice() + calculateAddonsTotal();
  };

  const calculateDiscount = () => {
    const subtotal = getSubtotal();
    if (quoteData.discount.value <= 0) return 0;

    if (quoteData.discount.type === 'percentage') {
      return subtotal * (quoteData.discount.value / 100);
    } else {
      return Math.min(quoteData.discount.value, subtotal);
    }
  };

  const getTotalValue = () => {
    return getSubtotal() - calculateDiscount();
  };

  const updateDiscount = (field: keyof DiscountData, value: any) => {
    setQuoteData(prev => ({
      ...prev,
      discount: {
        ...prev.discount,
        [field]: value
      }
    }));
  };

  const getPlanPeriodMultiplier = () => {
    switch (quoteData.planPeriod) {
      case 'semestral': return 6;
      case 'annual': return 12;
      default: return 1;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPeriodLabel = () => {
    switch (quoteData.planPeriod) {
      case 'semestral': return 'Semestral (6 meses)';
      case 'annual': return 'Anual (12 meses)';
      default: return 'Mensal';
    }
  };

  // Filtrar addons únicos por nome para evitar duplicatas na exibição
  const uniqueAddons = planAddons.filter((addon, index, self) => 
    index === self.findIndex(a => a.name === addon.name)
  );

  const availableAddons = uniqueAddons.filter(addon => 
    !quoteData.selectedAddons.find(selected => selected.addon.id === addon.id)
  );

  const copyToClipboard = () => {
    const quoteDataForExport: QuoteDataType = {
      ...quoteData,
      selectedAddons: quoteData.selectedAddons
    };
    
    const quoteText = generateQuoteText(quoteDataForExport);
    navigator.clipboard.writeText(quoteText);
    toast({
      title: "Sucesso!",
      description: "Orçamento copiado para a área de transferência",
    });
  };

  const downloadQuoteText = () => {
    const quoteDataForExport: QuoteDataType = {
      ...quoteData,
      selectedAddons: quoteData.selectedAddons
    };
    
    const quoteText = generateQuoteText(quoteDataForExport);
    const element = document.createElement("a");
    const file = new Blob([quoteText], {type: 'text/plain; charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `orcamento-${quoteData.clientName.replace(/\s/g, '_')}-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Sucesso!",
      description: "Orçamento em texto baixado com sucesso",
    });
  };

  const downloadQuotePDF = async () => {
    try {
      console.log('Preparando dados para PDF:', {
        hasFreeTrial: quoteData.hasFreeTrial,
        freeTrialDays: quoteData.freeTrialDays,
        paymentStartDate: quoteData.paymentStartDate
      });
      
      const quoteDataForExport: QuoteDataType = {
        clientName: quoteData.clientName,
        clientEmail: quoteData.clientEmail,
        clientCompany: quoteData.clientCompany,
        clientPhone: quoteData.clientPhone,
        selectedPlan: quoteData.selectedPlan,
        planPeriod: quoteData.planPeriod,
        selectedAddons: quoteData.selectedAddons,
        systemName: quoteData.systemName,
        systemDescription: quoteData.systemDescription,
        introduction: quoteData.introduction,
        validityDays: quoteData.validityDays,
        discount: quoteData.discount,
        hasFreeTrial: quoteData.hasFreeTrial,
        freeTrialDays: quoteData.freeTrialDays,
        paymentStartDate: quoteData.paymentStartDate
      };
      
      console.log('Dados sendo enviados para PDF:', quoteDataForExport);
      
      await generateQuotePDF(quoteDataForExport);
      
      toast({
        title: "Sucesso!",
        description: "PDF do orçamento baixado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const improveTextWithAI = async () => {
    if (!quoteData.introduction.trim()) {
      toast({
        title: "Aviso",
        description: "Digite um texto de introdução primeiro",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Processando...",
        description: "Melhorando o texto com IA",
      });

      const { data, error } = await supabase.functions.invoke('improve-text-with-gemini', {
        body: { text: quoteData.introduction }
      });

      if (error) throw error;

      if (data?.improvedText) {
        setQuoteData(prev => ({ ...prev, introduction: data.improvedText }));
        toast({
          title: "Sucesso!",
          description: "Texto melhorado com sucesso",
        });
      }
    } catch (error) {
      console.error('Erro ao melhorar texto:', error);
      toast({
        title: "Erro",
        description: "Erro ao melhorar o texto. Verifique se a API key do Gemini está configurada.",
        variant: "destructive",
      });
    }
  };

  if (plansLoading || addonsLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Calculator className="w-5 h-5" />
            Gerador de Orçamento - RHiD & iDSecure
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-6">
            {/* Dados do Cliente */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-card-foreground">
                  <Users className="w-4 h-4" />
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="clientName" className="text-foreground">Nome do Cliente *</Label>
                  <Input
                    id="clientName"
                    value={quoteData.clientName}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Nome do cliente"
                    required
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="clientCompany" className="text-foreground">Empresa</Label>
                  <Input
                    id="clientCompany"
                    value={quoteData.clientCompany}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, clientCompany: e.target.value }))}
                    placeholder="Nome da empresa"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="clientEmail" className="text-foreground">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={quoteData.clientEmail}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, clientEmail: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone" className="text-foreground">Telefone</Label>
                    <Input
                      id="clientPhone"
                      value={quoteData.clientPhone}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, clientPhone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Introdução da Proposta */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-card-foreground">
                  <FileText className="w-4 h-4" />
                  Introdução da Proposta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="introduction" className="text-foreground">Texto de Introdução</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={improveTextWithAI}
                      className="flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Melhorar com IA
                    </Button>
                  </div>
                  <Textarea
                    id="introduction"
                    value={quoteData.introduction}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, introduction: e.target.value }))}
                    placeholder="Digite aqui a introdução personalizada da proposta..."
                    className="min-h-[100px] bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este texto aparecerá no início da proposta comercial
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Plano */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Seleção de Plano
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="plan">Plano</Label>
                  <Select onValueChange={handlePlanSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {plan.employee_range} funcionários
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {quoteData.selectedPlan && (
                  <div>
                    <Label htmlFor="period">Período de Contratação</Label>
                    <Select value={quoteData.planPeriod} onValueChange={(value: 'monthly' | 'semestral' | 'annual') => 
                      setQuoteData(prev => ({ ...prev, planPeriod: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">
                          Mensal - {formatCurrency(quoteData.selectedPlan.monthly_price)}
                        </SelectItem>
                        <SelectItem value="semestral">
                          Semestral - {formatCurrency(quoteData.selectedPlan.semestral_price)}
                        </SelectItem>
                        <SelectItem value="annual">
                          Anual - {formatCurrency(quoteData.selectedPlan.annual_price)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Teste Grátis */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-card-foreground">
                  <Gift className="w-4 h-4" />
                  Teste Grátis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="freeTrial"
                    checked={quoteData.hasFreeTrial}
                    onCheckedChange={(checked) => 
                      setQuoteData(prev => ({ ...prev, hasFreeTrial: checked }))
                    }
                  />
                  <Label htmlFor="freeTrial" className="text-foreground">
                    Oferecer teste grátis
                  </Label>
                </div>

                {quoteData.hasFreeTrial && (
                  <>
                    <div>
                      <Label htmlFor="freeTrialDays" className="text-foreground">
                        Dias de teste grátis
                      </Label>
                      <Input
                        id="freeTrialDays"
                        type="number"
                        min="0"
                        value={quoteData.freeTrialDays}
                        onChange={(e) => 
                          setQuoteData(prev => ({ 
                            ...prev, 
                            freeTrialDays: parseInt(e.target.value) || 0 
                          }))
                        }
                        placeholder="Ex: 7, 15, 30 dias"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        O cliente poderá testar o sistema gratuitamente por este período
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="paymentStartDate" className="text-foreground">
                        Data de início do pagamento
                      </Label>
                      <Input
                        id="paymentStartDate"
                        type="date"
                        value={quoteData.paymentStartDate ? format(quoteData.paymentStartDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setQuoteData(prev => ({ 
                              ...prev, 
                              paymentStartDate: new Date(e.target.value) 
                            }));
                          }
                        }}
                        className="bg-background border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Preenchido automaticamente com base nos dias de teste
                      </p>
                    </div>

                    {quoteData.freeTrialDays > 0 && (
                      <div className="bg-primary/5 dark:bg-primary/10 p-3 rounded border border-primary/20">
                        <p className="text-sm font-medium text-primary">
                          Período de teste: {quoteData.freeTrialDays} dias
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Início do pagamento: {quoteData.paymentStartDate ? 
                            format(quoteData.paymentStartDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 
                            'Não definido'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Desconto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Desconto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="discountType">Tipo de Desconto</Label>
                  <Select 
                    value={quoteData.discount.type} 
                    onValueChange={(value: 'percentage' | 'fixed') => updateDiscount('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="discountValue">
                    Valor do Desconto {quoteData.discount.type === 'percentage' ? '(%)' : '(R$)'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    max={quoteData.discount.type === 'percentage' ? "100" : undefined}
                    step={quoteData.discount.type === 'percentage' ? "0.1" : "0.01"}
                    value={quoteData.discount.value}
                    onChange={(e) => updateDiscount('value', parseFloat(e.target.value) || 0)}
                    placeholder={quoteData.discount.type === 'percentage' ? "0.0" : "0,00"}
                  />
                </div>
                
                <div>
                  <Label htmlFor="discountDescription">Descrição do Desconto (opcional)</Label>
                  <Input
                    id="discountDescription"
                    value={quoteData.discount.description}
                    onChange={(e) => updateDiscount('description', e.target.value)}
                    placeholder="Ex: Desconto promocional, Cliente fidelidade, etc."
                  />
                </div>

                {quoteData.discount.value > 0 && (
                  <div className="bg-green-50 p-3 rounded border">
                    <p className="text-sm font-medium text-green-800">
                      Desconto aplicado: {formatCurrency(calculateDiscount())}
                    </p>
                    {quoteData.discount.type === 'percentage' && (
                      <p className="text-xs text-green-600">
                        {quoteData.discount.value}% sobre {formatCurrency(getSubtotal())}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Adicionais */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm text-card-foreground">Adicionais Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableAddons.map((addon) => (
                    <div key={addon.id} className="flex items-center justify-between p-2 border border-border rounded bg-background">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{addon.name}</p>
                        <p className="text-xs text-muted-foreground">{addon.description}</p>
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">
                          {addon.pricing_type === 'package' && addon.package_ranges && addon.package_ranges.length > 0 ? (
                            `${formatCurrency(addon.package_ranges[0].price)} por pacote de ${addon.package_ranges[0].max} ${addon.unit_type}s`
                          ) : (
                            `${formatCurrency(addon.price_per_unit)} por ${addon.unit_type}`
                          )}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addAddon(addon)}
                        className="ml-2"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {availableAddons.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Todos os adicionais foram selecionados
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview do Orçamento */}
          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-card-foreground">
                  <FileText className="w-4 h-4" />
                  Preview do Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plano Selecionado */}
                {quoteData.selectedPlan && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-foreground">Plano Selecionado</h4>
                    <div className="bg-primary/5 dark:bg-primary/10 p-3 rounded border border-primary/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-foreground">{quoteData.selectedPlan.name}</p>
                          <p className="text-sm text-muted-foreground">{quoteData.selectedPlan.employee_range} funcionários</p>
                          <p className="text-sm text-muted-foreground">{getPeriodLabel()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-background text-foreground">
                            {formatCurrency(calculatePlanPrice())}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setQuoteData(prev => ({ ...prev, selectedPlan: null }))}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            title="Remover plano"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Adicionais Selecionados */}
                {quoteData.selectedAddons.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-foreground">Adicionais</h4>
                    <div className="space-y-2">
                      {quoteData.selectedAddons.map((item, index) => {
                        const periodMultiplier = getPlanPeriodMultiplier();
                        let addonTotalPeriod = 0;
                        
                        // Calcular o total correto baseado no tipo de precificação
                        if (item.addon.pricing_type === 'package' && item.addon.package_ranges && item.addon.package_ranges.length > 0) {
                          const sortedRanges = [...item.addon.package_ranges].sort((a, b) => a.min - b.min);
                          const range = sortedRanges.find(r => item.quantity >= r.min && item.quantity <= r.max) || 
                                       sortedRanges[sortedRanges.length - 1];
                          if (range) {
                            addonTotalPeriod = range.price * periodMultiplier;
                          } else {
                            addonTotalPeriod = item.addon.price_per_unit * item.quantity * periodMultiplier;
                          }
                        } else {
                          addonTotalPeriod = item.addon.price_per_unit * item.quantity * periodMultiplier;
                        }
                        
                        return (
                          <div key={index} className="bg-green-50 dark:bg-green-950 p-3 rounded border border-border">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-foreground">{item.addon.name}</p>
                                <p className="text-xs text-muted-foreground">{item.addon.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.quantity}x por {periodMultiplier === 1 ? 'mês' : periodMultiplier + ' meses'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateAddonQuantity(index, Math.max(1, item.quantity - 1))}
                                  className="h-8 w-8 p-0 hover:bg-muted"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 1;
                                    updateAddonQuantity(index, Math.max(1, value));
                                  }}
                                  className="h-8 w-16 text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateAddonQuantity(index, item.quantity + 1)}
                                  className="h-8 w-8 p-0 hover:bg-muted"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Badge variant="secondary" className="ml-2">
                                  {formatCurrency(addonTotalPeriod)}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeAddon(index)}
                                  className="w-6 h-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Resumo Financeiro */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(getSubtotal())}</span>
                  </div>
                  
                  {quoteData.discount.value > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        Desconto {quoteData.discount.description && `(${quoteData.discount.description})`}
                        {quoteData.discount.type === 'percentage' && ` ${quoteData.discount.value}%`}
                      </span>
                      <span>-{formatCurrency(calculateDiscount())}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Total */}
                <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Valor Total ({getPeriodLabel()})
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(getTotalValue())}
                    </span>
                  </div>
                  {quoteData.planPeriod !== 'monthly' && (
                    <p className="text-xs text-gray-600 mt-1">
                      Equivale a {formatCurrency(getTotalValue() / getPlanPeriodMultiplier())} por mês
                    </p>
                  )}
                  {quoteData.discount.value > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Economia de {formatCurrency(calculateDiscount())}
                    </p>
                  )}
                </div>

                {/* Ações Atualizadas */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={copyToClipboard}
                      disabled={!quoteData.clientName || !quoteData.selectedPlan}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                    <Button
                      onClick={downloadQuoteText}
                      disabled={!quoteData.clientName || !quoteData.selectedPlan}
                      variant="outline"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Texto
                    </Button>
                  </div>
                  <Button
                    onClick={downloadQuotePDF}
                    disabled={!quoteData.clientName || !quoteData.selectedPlan}
                    className="w-full"
                  >
                    <File className="w-4 h-4 mr-2" />
                    Baixar PDF Moderno
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteGenerator;
