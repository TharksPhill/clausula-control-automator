import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, CalendarIcon, TrendingUp, Calculator, Info, Users, Building, Eye, Bell, Percent, DollarSign, FileText, Clock, User, AlertCircle, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { usePlans } from "@/hooks/usePlans";
import { usePlanAddons } from "@/hooks/usePlanAddons";
import { formatDateForInput, formatDateToBrazilian, calculateSemestralAnnualProportionalValue } from "@/utils/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";

interface PlanChangeManagerProps {
  currentContract: any;
  onSavePlanChange: (planChangeData: any) => void;
  contractAddons?: any[];
}

const PlanChangeManager = ({ currentContract, onSavePlanChange, contractAddons = [] }: PlanChangeManagerProps) => {
  const { plans, loading } = usePlans();
  const { planAddons, loading: addonsLoading } = usePlanAddons();
  const { getEffectiveValueForContract } = useContractAdjustments();
  const [selectedPlan, setSelectedPlan] = useState("");
  const [planType, setPlanType] = useState("mensal");
  const [changeDate, setChangeDate] = useState<Date>();
  const [requestedBy, setRequestedBy] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [additionalEmployees, setAdditionalEmployees] = useState(0);
  const [additionalCnpjs, setAdditionalCnpjs] = useState(0);
  const [faceRecognition, setFaceRecognition] = useState(false);
  const [faceRecognitionEmployees, setFaceRecognitionEmployees] = useState(0);
  const [notifications, setNotifications] = useState(false);
  const [notificationEmployees, setNotificationEmployees] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState("percentage");

  // Função refatorada para buscar addons por tipo
  const getAddonByType = (searchType: string) => {
    console.log('=== BUSCANDO ADDON POR TIPO REFATORADO ===');
    console.log('Tipo buscado:', searchType);
    console.log('Total de addons disponíveis:', planAddons.length);
    
    if (!planAddons || planAddons.length === 0) {
      console.log('Nenhum addon disponível');
      return null;
    }
    
    let foundAddon = null;
    
    // Mapeamento direto por unit_type
    const unitTypeMap = {
      'funcionarios_extras': ['employee'],
      'cnpjs_extras': ['cnpj'],
      'reconhecimento_facial': ['face_recognition'],
      'notificacoes_premium': ['notification']
    };
    
    const expectedUnitTypes = unitTypeMap[searchType as keyof typeof unitTypeMap];
    
    if (expectedUnitTypes) {
      // Busca primeiro por unit_type exato
      foundAddon = planAddons.find(addon => {
        const unitTypeMatch = expectedUnitTypes.includes(addon.unit_type?.toLowerCase());
        console.log(`Verificando addon "${addon.name}":`, {
          unit_type: addon.unit_type,
          unitTypeMatch,
          expectedUnitTypes
        });
        return unitTypeMatch;
      });
      
      // Se não encontrou por unit_type, busca por nome como fallback
      if (!foundAddon) {
        console.log('Não encontrou por unit_type, tentando buscar por nome...');
        
        const nameSearchMap = {
          'funcionarios_extras': ['funcionário', 'employee', 'extra'],
          'cnpjs_extras': ['cnpj', 'extra'],
          'reconhecimento_facial': ['reconhecimento', 'facial', 'face'],
          'notificacoes_premium': ['notifica', 'premium', 'notification']
        };
        
        const searchTerms = nameSearchMap[searchType as keyof typeof nameSearchMap] || [];
        
        foundAddon = planAddons.find(addon => {
          const nameMatch = searchTerms.some(term => 
            addon.name.toLowerCase().includes(term.toLowerCase())
          );
          console.log(`Verificando nome do addon "${addon.name}":`, {
            searchTerms,
            nameMatch
          });
          return nameMatch;
        });
      }
    }
    
    console.log(`Resultado final para ${searchType}:`, foundAddon ? {
      id: foundAddon.id,
      name: foundAddon.name,
      unit_type: foundAddon.unit_type,
      price_per_unit: foundAddon.price_per_unit,
      pricing_type: foundAddon.pricing_type
    } : null);
    console.log('=====================================');
    
    return foundAddon;
  };

  // Obter addons usando a função refatorada
  const employeeAddon = getAddonByType('funcionarios_extras');
  const cnpjAddon = getAddonByType('cnpjs_extras');
  const faceRecognitionAddon = getAddonByType('reconhecimento_facial');
  const notificationAddon = getAddonByType('notificacoes_premium');

  // Função CORRIGIDA para calcular preço baseado no tipo de preço
  const calculateAddonPrice = (addon: any, quantity: number) => {
    if (!addon || quantity <= 0) return 0;
    
    console.log(`Calculando preço para addon ${addon.name}:`, {
      pricing_type: addon.pricing_type,
      quantity,
      price_per_unit: addon.price_per_unit,
      package_ranges: addon.package_ranges
    });
    
    // Se for preço por unidade simples - multiplica quantidade por preço unitário
    if (addon.pricing_type === 'per_unit') {
      const total = quantity * Number(addon.price_per_unit);
      console.log(`Preço per_unit: ${quantity} × ${addon.price_per_unit} = ${total}`);
      return total;
    }
    
    // Se for preço por pacote - CORRIGIDO: multiplica o preço do pacote pela quantidade
    if (addon.pricing_type === 'package' && addon.package_ranges && addon.package_ranges.length > 0) {
      // Para addons de pacote como funcionários extras, cada unidade representa um pacote
      // Então se o usuário quer 2 funcionários extras, são 2 pacotes
      const packagePrice = addon.package_ranges[0]?.price || addon.price_per_unit;
      const total = quantity * Number(packagePrice);
      
      console.log(`Preço package CORRIGIDO: ${quantity} pacotes × ${packagePrice} = ${total}`);
      return total;
    }
    
    // Fallback para price_per_unit
    const fallbackTotal = quantity * Number(addon.price_per_unit);
    console.log(`Usando fallback price_per_unit: ${quantity} × ${addon.price_per_unit} = ${fallbackTotal}`);
    return fallbackTotal;
  };

  // Obter preços calculados
  const employeeAddonPrice = employeeAddon ? calculateAddonPrice(employeeAddon, additionalEmployees) : 0;
  const cnpjAddonPrice = cnpjAddon ? calculateAddonPrice(cnpjAddon, additionalCnpjs) : 0;
  const faceRecognitionPrice = faceRecognitionAddon ? calculateAddonPrice(faceRecognitionAddon, faceRecognitionEmployees) : 0;
  const notificationPrice = notificationAddon ? calculateAddonPrice(notificationAddon, notificationEmployees) : 0;

  // Log para debug dos preços
  useEffect(() => {
    console.log('=== ADDONS E PREÇOS ATUALIZADOS ===');
    console.log('Employee addon:', employeeAddon?.name, 'Price:', employeeAddonPrice);
    console.log('CNPJ addon:', cnpjAddon?.name, 'Price:', cnpjAddonPrice);
    console.log('Face recognition addon:', faceRecognitionAddon?.name, 'Price:', faceRecognitionPrice);
    console.log('Notification addon:', notificationAddon?.name, 'Price:', notificationPrice);
    console.log('==================================');
  }, [planAddons, employeeAddon, cnpjAddon, faceRecognitionAddon, notificationAddon, additionalEmployees, additionalCnpjs, faceRecognitionEmployees, notificationEmployees]);

  useEffect(() => {
    if (changeDate) {
      console.log("Data de mudança selecionada:", changeDate);
    }
  }, [changeDate]);

  const calculatePlanChange = () => {
    if (!currentContract || !selectedPlan || !changeDate) return null;

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return null;

    const currentEmployeeCount = parseInt(currentContract.employee_count) || 0;
    const currentCnpjCount = parseInt(currentContract.cnpj_count) || 1;
    
    // CORREÇÃO: Buscar o valor efetivo do contrato considerando todos os reajustes
    const baseContractValue = parseFloat(currentContract.monthly_value?.replace(',', '.')) || 0;
    
    // Usar o hook para buscar o valor efetivo na data da mudança
    let currentPlanValue = getEffectiveValueForContract(
      currentContract.id, 
      baseContractValue, 
      changeDate
    );
    
    console.log(`💰 INICIAL - Valor do contrato ${currentContract.contract_number}:`, {
      valorBase: baseContractValue,
      valorEfetivo: currentPlanValue,
      tipoPlano: currentContract.plan_type,
      dataAnalise: changeDate.toISOString().split('T')[0]
    });

    // Para planos semestrais/anuais, verificar se o valor encontrado é razoável
    if (currentContract.plan_type === "semestral" || currentContract.plan_type === "anual") {
      const coveragePeriodMonths = currentContract.plan_type === "semestral" ? 6 : 12;
      
      // Se o valor é muito baixo (menos de R$ 100), tentar outras estratégias
      if (currentPlanValue < 100) {
        console.log(`⚠️ Valor muito baixo detectado (${currentPlanValue}), tentando outras estratégias...`);
        
        // 1. Buscar nas mudanças de plano anteriores
        const planChanges = contractAddons
          .filter(addon => addon.contract_id === currentContract.id && addon.addon_type === 'plan_change')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        for (const planChange of planChanges) {
          try {
            const planChangeDetails = typeof planChange.plan_change_details === 'string' 
              ? JSON.parse(planChange.plan_change_details) 
              : planChange.plan_change_details;
            
            if (planChangeDetails?.finalPrice && planChangeDetails.finalPrice > 100) {
              currentPlanValue = planChangeDetails.finalPrice;
              console.log(`🔍 Valor encontrado em mudança de plano anterior: R$ ${currentPlanValue}`);
              break;
            }
          } catch (error) {
            console.error('Erro ao processar detalhes da mudança de plano:', error);
          }
        }
        
        // 2. Se ainda não encontrou, verificar se o valor base precisa ser multiplicado pelo período
        if (currentPlanValue < 100 && baseContractValue > 0 && baseContractValue < 500) {
          // Provavelmente é um valor mensal que precisa ser convertido para o período
          const periodValue = baseContractValue * coveragePeriodMonths;
          console.log(`🔄 Convertendo valor mensal para período:`, {
            valorMensal: baseContractValue,
            mesesPeriodo: coveragePeriodMonths,
            valorPeriodo: periodValue
          });
          currentPlanValue = periodValue;
        }
        
        // 3. Última tentativa: buscar nos addons do tipo 'plan_change'
        if (currentPlanValue < 100) {
          const lastValidPlanChange = contractAddons
            .filter(addon => addon.contract_id === currentContract.id && addon.addon_type === 'plan_change')
            .find(addon => {
              try {
                const details = typeof addon.plan_change_details === 'string' 
                  ? JSON.parse(addon.plan_change_details) 
                  : addon.plan_change_details;
                return details?.finalPrice > 100;
              } catch {
                return false;
              }
            });
          
          if (lastValidPlanChange) {
            const details = typeof lastValidPlanChange.plan_change_details === 'string' 
              ? JSON.parse(lastValidPlanChange.plan_change_details) 
              : lastValidPlanChange.plan_change_details;
            currentPlanValue = details.finalPrice;
            console.log(`🔍 Valor encontrado em addon plan_change: R$ ${currentPlanValue}`);
          }
        }
      }
      
      console.log(`✅ FINAL - Valor calculado para plano ${currentContract.plan_type}:`, {
        valorFinal: currentPlanValue,
        estrategiaUsada: currentPlanValue > 100 ? 'sucesso' : 'falhou'
      });
    }

    // Get plan base price based on type
    let basePlanPrice = 0;
    if (planType === "mensal") {
      basePlanPrice = plan.monthly_price;
    } else if (planType === "semestral") {
      basePlanPrice = plan.semestral_price;
    } else if (planType === "anual") {
      basePlanPrice = plan.annual_price;
    }

    // Calculate total employees and CNPJs after additions
    const totalEmployees = currentEmployeeCount + additionalEmployees;
    const totalCnpjs = currentCnpjCount + additionalCnpjs;

    // Calculate additional costs using calculated prices
    const employeeCost = employeeAddonPrice;
    const cnpjCost = cnpjAddonPrice;
    const faceRecognitionCost = faceRecognition ? faceRecognitionPrice : 0;
    const notificationCost = notifications ? notificationPrice : 0;

    const totalAdditionalCosts = employeeCost + cnpjCost + faceRecognitionCost + notificationCost;
    let finalPrice = basePlanPrice + totalAdditionalCosts;

    // Apply discount
    if (discountValue > 0) {
      if (discountType === "percentage") {
        finalPrice = finalPrice * (1 - discountValue / 100);
      } else {
        finalPrice = finalPrice - discountValue;
      }
    }

    // Calculate time info
    const timeInfo = calculateRemainingTime(changeDate, currentContract);
    
    // CORREÇÃO: Calcular diferença baseado no tipo de plano
    let monthlyFinalPrice = finalPrice;
    let proportionalDifference = 0;
    let proportionalInfo = null;
    
    if (planType === "semestral" || planType === "anual") {
      // Para planos semestrais e anuais, usar cálculo proporcional específico
      // Usar o valor corrigido calculado anteriormente
      
      // Para planos semestrais/anuais, comparar valores completos do período
      let currentPlanPeriodValue = currentPlanValue;
      // O currentPlanValue já foi corrigido acima, então usar diretamente
      
      proportionalInfo = calculateSemestralAnnualProportionalValue(
        changeDate.toISOString().split('T')[0],
        currentContract.start_date,
        currentContract.renewal_date,
        currentPlanPeriodValue,
        finalPrice,
        planType
      );
      
      proportionalDifference = proportionalInfo.proportionalDifference;
      monthlyFinalPrice = finalPrice / (planType === "semestral" ? 6 : 12);
      
    } else {
      // Para planos mensais, manter lógica original
      monthlyFinalPrice = finalPrice;
      const monthlyDifference = monthlyFinalPrice - currentPlanValue;
      const dailyDifference = monthlyDifference / 30;
      proportionalDifference = dailyDifference * timeInfo.remainingDays;
    }
    
    const monthlyDifference = monthlyFinalPrice - currentPlanValue;
    const isUpgrade = monthlyDifference > 0;
    const isDowngrade = monthlyDifference < 0;

    return {
      currentPlan: {
        tier: "Plano Atual",
        type: currentContract.plan_type || "mensal",
        finalValue: currentPlanValue,
        employeeCount: currentEmployeeCount,
        cnpjCount: currentCnpjCount,
        contractStartDate: currentContract.start_date,
        contractEndDate: currentContract.renewal_date
      },
      newPlan: {
        tier: plan.employee_range,
        type: planType,
        baseValue: basePlanPrice,
        monthlyEquivalent: monthlyFinalPrice,
        employeeCount: totalEmployees,
        cnpjCount: totalCnpjs,
        allowedCnpjs: plan.allowed_cnpjs || 1,
        additionalCosts: {
          employees: employeeCost,
          cnpjs: cnpjCost,
          faceRecognition: faceRecognitionCost,
          notifications: notificationCost
        },
        discount: discountValue,
        discountType: discountType,
        finalValue: finalPrice,
        // Incluir detalhes dos addons para o link compartilhado
        addonsDetails: {
          additionalEmployees,
          additionalCnpjs,
          faceRecognition,
          faceRecognitionEmployees,
          notifications,
          notificationEmployees,
          employeeAddonPrice: employeeAddon ? Number(employeeAddon.price_per_unit) : 0,
          cnpjAddonPrice: cnpjAddon ? Number(cnpjAddon.price_per_unit) : 0,
          faceRecognitionPrice: faceRecognitionAddon ? Number(faceRecognitionAddon.price_per_unit) : 0,
          notificationPrice: notificationAddon ? Number(notificationAddon.price_per_unit) : 0
        }
      },
      timeInfo,
      monthlyDifference: Math.abs(monthlyDifference),
      isUpgrade,
      isDowngrade,
      difference: Math.abs(proportionalDifference),
      proportionalInfo // Incluir informações do cálculo proporcional
    };
  };

  const calculateRemainingTime = (changeDateObj: Date, contract: any) => {
    try {
      let contractEndDate;
      if (contract.renewal_date?.includes('/')) {
        const parts = contract.renewal_date.split('/');
        contractEndDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else {
        contractEndDate = new Date(contract.renewal_date);
      }

      if (isNaN(contractEndDate.getTime())) {
        throw new Error("Invalid contract end date");
      }

      const timeDiff = contractEndDate.getTime() - changeDateObj.getTime();
      const remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      
      const remainingMonths = Math.floor(remainingDays / 30);
      const remainingDaysAfterMonths = remainingDays % 30;

      return {
        changeDate: format(changeDateObj, "dd/MM/yyyy", { locale: ptBR }),
        contractStartDate: formatDateToBrazilian(contract.start_date) || "Data não informada",
        contractEndDate: formatDateToBrazilian(contract.renewal_date) || "Data não informada",
        remainingDays,
        remainingMonths,
        remainingDaysAfterMonths
      };
    } catch (error) {
      console.error("Erro ao calcular tempo restante:", error);
      return {
        changeDate: format(changeDateObj, "dd/MM/yyyy", { locale: ptBR }),
        contractStartDate: formatDateToBrazilian(contract.start_date) || "Data não informada",
        contractEndDate: formatDateToBrazilian(contract.renewal_date) || "Data não informada",
        remainingDays: 0,
        remainingMonths: 0,
        remainingDaysAfterMonths: 0
      };
    }
  };

  const handleSave = async () => {
    const calculation = calculatePlanChange();
    if (!calculation || !requestedBy.trim()) return;

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    const planChangeData = {
      addon_type: "plan_change",
      description: `Mudança de plano para ${plan.name} (${plan.employee_range} funcionários) - ${planType}`,
      previous_value: currentContract.monthly_value,
      new_value: calculation.newPlan.monthlyEquivalent.toFixed(2).replace('.', ','),
      requested_by: requestedBy,
      request_date: new Date().toISOString().split('T')[0],
      plan_change_details: {
        selectedPlanId: selectedPlan,
        newPlanType: planType,
        changeDate: calculation.timeInfo.changeDate,
        requestedBy,
        requestReason,
        additionalEmployees: additionalEmployees.toString(),
        additionalCnpjs: additionalCnpjs.toString(),
        faceRecognition,
        faceRecognitionEmployees: faceRecognitionEmployees.toString(),
        notifications,
        notificationEmployees: notificationEmployees.toString(),
        discountValue,
        discountType,
        calculation
      }
    };

    onSavePlanChange(planChangeData);
    
    // Reset form
    setSelectedPlan("");
    setPlanType("mensal");
    setChangeDate(undefined);
    setRequestedBy("");
    setRequestReason("");
    setAdditionalEmployees(0);
    setAdditionalCnpjs(0);
    setFaceRecognition(false);
    setFaceRecognitionEmployees(0);
    setNotifications(false);
    setNotificationEmployees(0);
    setDiscountValue(0);
  };

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const getSelectedPlan = () => {
    return plans.find(p => p.id === selectedPlan);
  };

  const calculation = calculatePlanChange();
  const selectedPlanData = getSelectedPlan();

  if (loading || addonsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando planos e adicionais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-blue-600">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            Solicitação de Mudança de Plano
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Configure os detalhes da mudança de plano. Todas as informações serão apresentadas ao contratante para aprovação e assinatura.
          </p>
        </CardHeader>
      </Card>

      {/* Current Contract Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Info className="w-5 h-5" />
            Informações do Contrato Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-700">Contrato</Label>
              <p className="text-lg font-bold text-blue-900">{currentContract?.contract_number}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-700">Funcionários</Label>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-lg font-semibold">{currentContract?.employee_count || "0"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-700">CNPJs</Label>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span className="text-lg font-semibold">{currentContract?.cnpj_count || "1"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-700">Valor Mensal</Label>
              <p className="text-lg font-bold text-green-600">R$ {currentContract?.monthly_value}</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-700">Data de Início</Label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{formatDateToBrazilian(currentContract?.start_date) || "Não informado"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-700">Data de Vigência</Label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{formatDateToBrazilian(currentContract?.renewal_date) || "Não informado"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-700">Tipo Atual</Label>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {currentContract?.plan_type || "mensal"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Configuração do Novo Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Request Info */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h6 className="font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Informações da Solicitação
              </h6>
              
              <div>
                <Label htmlFor="requested-by">Solicitado por *</Label>
                <Input
                  id="requested-by"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  placeholder="Nome completo de quem solicita"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="request-reason">Motivo da Mudança</Label>
                <Input
                  id="request-reason"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Ex: Aumento no número de funcionários"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Change Date */}
            <div>
              <Label>Data da Mudança *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !changeDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {changeDate ? format(changeDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={changeDate}
                    onSelect={setChangeDate}
                    initialFocus
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Plan Selection */}
            <div>
              <Label htmlFor="plan-select">Selecionar Novo Plano *</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Escolha um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.employee_range} funcionários) - até {plan.allowed_cnpjs} CNPJ{plan.allowed_cnpjs > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlanData && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h6 className="font-medium mb-3 text-green-800">Preços do Plano Selecionado</h6>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-600 mb-1">Mensal</p>
                    <p className="font-bold text-green-600">{formatPrice(selectedPlanData.monthly_price)}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-600 mb-1">Semestral</p>
                    <p className="font-bold text-blue-600">{formatPrice(selectedPlanData.semestral_price)}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-600 mb-1">Anual</p>
                    <p className="font-bold text-purple-600">{formatPrice(selectedPlanData.annual_price)}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600 space-y-1">
                  <p>• Permite até {selectedPlanData.allowed_cnpjs} CNPJ{selectedPlanData.allowed_cnpjs > 1 ? 's' : ''}</p>
                  <p>• Faixa: {selectedPlanData.employee_range} funcionários</p>
                </div>
              </div>
            )}

            {/* Plan Type */}
            <div>
              <Label htmlFor="plan-type">Tipo de Cobrança *</Label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Additional Services - COM EXIBIÇÃO CORRIGIDA */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Serviços Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Additional Employees - EXIBIÇÃO CORRIGIDA */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-200">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <Label htmlFor="additional-employees" className="font-medium">
                  Funcionários Extras
                </Label>
              </div>
              <Input
                id="additional-employees"
                type="number"
                min="0"
                value={additionalEmployees}
                onChange={(e) => setAdditionalEmployees(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <div className="space-y-2">
                {employeeAddon ? (
                  <>
                    <p className="text-sm text-blue-700 font-medium">
                      R$ {Number(employeeAddon.package_ranges?.[0]?.price || employeeAddon.price_per_unit).toFixed(2).replace('.', ',')} por pacote
                    </p>
                    {employeeAddon.package_ranges && (
                      <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                        <strong>Faixa de preço:</strong>
                        {employeeAddon.package_ranges.map((range: any, index: number) => (
                          <div key={index}>
                            {range.min}-{range.max} funcionários: R$ {Number(range.price).toFixed(2).replace('.', ',')} por pacote
                          </div>
                        ))}
                      </div>
                    )}
                    {additionalEmployees > 0 && (
                      <p className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                        <strong>Cálculo:</strong> {additionalEmployees} × R$ {Number(employeeAddon.package_ranges?.[0]?.price || employeeAddon.price_per_unit).toFixed(2).replace('.', ',')} = <strong>R$ {employeeAddonPrice.toFixed(2).replace('.', ',')}</strong>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-red-600 bg-red-100 p-2 rounded">
                    ⚠️ Addon de funcionários extras não encontrado no cadastro
                  </p>
                )}
              </div>
            </div>

            {/* Additional CNPJs */}
            <div className="bg-green-50 p-4 rounded-lg space-y-3 border border-green-200">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-green-600" />
                <Label htmlFor="additional-cnpjs" className="font-medium">
                  CNPJs Extras
                </Label>
              </div>
              <Input
                id="additional-cnpjs"
                type="number"
                min="0"
                value={additionalCnpjs}
                onChange={(e) => setAdditionalCnpjs(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <div className="space-y-2">
                {cnpjAddon ? (
                  <>
                    <p className="text-sm text-green-700 font-medium">
                      R$ {Number(cnpjAddon.price_per_unit).toFixed(2).replace('.', ',')} por CNPJ adicional
                    </p>
                    {selectedPlanData && (
                      <p className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                        Plano inclui {selectedPlanData.allowed_cnpjs} CNPJ{selectedPlanData.allowed_cnpjs > 1 ? 's' : ''}
                      </p>
                    )}
                    {additionalCnpjs > 0 && (
                      <p className="text-xs text-green-600 bg-green-100 p-2 rounded">
                        Custo total: R$ {cnpjAddonPrice.toFixed(2).replace('.', ',')}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-red-600 bg-red-100 p-2 rounded">
                    ⚠️ Addon de CNPJs extras não encontrado no cadastro
                  </p>
                )}
              </div>
            </div>

            {/* Face Recognition */}
            <div className="bg-purple-50 p-4 rounded-lg space-y-3 border border-purple-200">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="face-recognition"
                  checked={faceRecognition}
                  onCheckedChange={(checked) => setFaceRecognition(checked === true)}
                />
                <Eye className="w-5 h-5 text-purple-600" />
                <Label htmlFor="face-recognition" className="font-medium">
                  Reconhecimento Facial
                </Label>
              </div>
              <div className="space-y-2">
                {faceRecognitionAddon ? (
                  <p className="text-sm text-purple-700 font-medium">
                    R$ {Number(faceRecognitionAddon.price_per_unit).toFixed(2).replace('.', ',')} por funcionário com reconhecimento facial
                  </p>
                ) : (
                  <p className="text-xs text-red-600 bg-red-100 p-2 rounded">
                    ⚠️ Addon de reconhecimento facial não encontrado no cadastro
                  </p>
                )}
              </div>
              
              {faceRecognition && (
                <div>
                  <Label htmlFor="face-recognition-employees">Funcionários com Reconhecimento</Label>
                  <Input
                    id="face-recognition-employees"
                    type="number"
                    min="0"
                    value={faceRecognitionEmployees}
                    onChange={(e) => setFaceRecognitionEmployees(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="mt-1"
                  />
                  {faceRecognitionEmployees > 0 && faceRecognitionPrice > 0 && (
                    <p className="text-xs text-purple-600 bg-purple-100 p-2 rounded mt-2">
                      Custo total: R$ {faceRecognitionPrice.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-orange-50 p-4 rounded-lg space-y-3 border border-orange-200">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={(checked) => setNotifications(checked === true)}
                />
                <Bell className="w-5 h-5 text-orange-600" />
                <Label htmlFor="notifications" className="font-medium">
                  Notificações Premium
                </Label>
              </div>
              <div className="space-y-2">
                {notificationAddon ? (
                  <>
                    <p className="text-sm text-orange-700 font-medium">
                      Preço por pacote (veja as faixas)
                    </p>
                    {notificationAddon.package_ranges && (
                      <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                        <strong>Faixas de preço:</strong>
                        {notificationAddon.package_ranges.map((range: any, index: number) => (
                          <div key={index}>
                            {range.min}-{range.max} funcionários: R$ {Number(range.price).toFixed(2).replace('.', ',')}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-red-600 bg-red-100 p-2 rounded">
                    ⚠️ Addon de notificações premium não encontrado no cadastro
                  </p>
                )}
              </div>
              
              {notifications && (
                <div>
                  <Label htmlFor="notification-employees">Funcionários com Notificações</Label>
                  <Input
                    id="notification-employees"
                    type="number"
                    min="0"
                    value={notificationEmployees}
                    onChange={(e) => setNotificationEmployees(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="mt-1"
                  />
                  {notificationEmployees > 0 && notificationPrice > 0 && (
                    <p className="text-xs text-orange-600 bg-orange-100 p-2 rounded mt-2">
                      Custo total: R$ {notificationPrice.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Discount */}
            <div className="bg-yellow-50 p-4 rounded-lg space-y-3 border border-yellow-200">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-yellow-600" />
                <Label className="font-medium">Desconto</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="discount-type">Tipo</Label>
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="discount-value">Valor</Label>
                  <Input
                    id="discount-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Preview */}
      {calculation && changeDate && (
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-green-800">
              <Calculator className="w-6 h-6" />
              Demonstrativo de Cálculo
            </CardTitle>
            <p className="text-green-700">
              Análise detalhada da mudança de plano para apresentação ao contratante
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Time Analysis */}
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <h5 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Análise Temporal
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 font-medium">Data da mudança:</span>
                  <p className="font-semibold text-blue-600">{calculation.timeInfo.changeDate}</p>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Término do contrato atual:</span>
                  <p className="font-semibold">{calculation.timeInfo.contractEndDate}</p>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Tempo restante:</span>
                  <p className="font-semibold text-orange-600">
                    {calculation.timeInfo.remainingMonths} meses e {calculation.timeInfo.remainingDaysAfterMonths} dias
                  </p>
                  <p className="text-xs text-gray-500">({calculation.timeInfo.remainingDays} dias totais)</p>
                </div>
              </div>
            </div>

            {/* Financial Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h6 className="font-medium text-blue-800 mb-3">Plano Atual</h6>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Valor mensal:</span>
                    <span className="font-semibold">R$ {currentContract?.monthly_value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Funcionários:</span>
                    <span>{calculation.currentPlan.employeeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CNPJs:</span>
                    <span>{calculation.currentPlan.cnpjCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <Badge variant="outline">{calculation.currentPlan.type}</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h6 className="font-medium text-green-800 mb-3">Novo Plano</h6>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Valor ({planType}):</span>
                    <span className="font-semibold text-green-600">{formatPrice(calculation.newPlan.finalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equivalente mensal:</span>
                    <span className="font-semibold">{formatPrice(calculation.newPlan.monthlyEquivalent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Funcionários:</span>
                    <span>{calculation.newPlan.employeeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CNPJs:</span>
                    <span>{calculation.newPlan.cnpjCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Calculation */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h6 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Detalhamento do Cálculo
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Valor base do plano:</p>
                  <p className="font-semibold">{formatPrice(calculation.newPlan.baseValue)}</p>
                </div>
                {calculation.newPlan.additionalCosts.employees > 0 && (
                  <div>
                    <p className="text-gray-600">+ Funcionários extras:</p>
                    <p className="font-semibold text-blue-600">{formatPrice(calculation.newPlan.additionalCosts.employees)}</p>
                    <p className="text-xs text-gray-500">({additionalEmployees} pacotes)</p>
                  </div>
                )}
                {calculation.newPlan.additionalCosts.cnpjs > 0 && (
                  <div>
                    <p className="text-gray-600">+ CNPJs extras:</p>
                    <p className="font-semibold text-green-600">{formatPrice(calculation.newPlan.additionalCosts.cnpjs)}</p>
                    <p className="text-xs text-gray-500">({additionalCnpjs} × {formatPrice(cnpjAddonPrice / additionalCnpjs)})</p>
                  </div>
                )}
                {calculation.newPlan.additionalCosts.faceRecognition > 0 && (
                  <div>
                    <p className="text-gray-600">+ Reconhecimento facial:</p>
                    <p className="font-semibold text-purple-600">{formatPrice(calculation.newPlan.additionalCosts.faceRecognition)}</p>
                    <p className="text-xs text-gray-500">({faceRecognitionEmployees} × {formatPrice(faceRecognitionPrice / faceRecognitionEmployees)})</p>
                  </div>
                )}
                {calculation.newPlan.additionalCosts.notifications > 0 && (
                  <div>
                    <p className="text-gray-600">+ Notificações premium:</p>
                    <p className="font-semibold text-orange-600">{formatPrice(calculation.newPlan.additionalCosts.notifications)}</p>
                    <p className="text-xs text-gray-500">({notificationEmployees} funcionários)</p>
                  </div>
                )}
                {calculation.newPlan.discount > 0 && (
                  <div>
                    <p className="text-gray-600">- Desconto aplicado:</p>
                    <p className="font-semibold text-yellow-600">
                      {calculation.newPlan.discountType === 'percentage' 
                        ? `${calculation.newPlan.discount}%` 
                        : formatPrice(calculation.newPlan.discount)
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Final Result */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-lg">
              <h5 className="font-bold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Resultado Final
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-gray-300 text-sm mb-1">Diferença Mensal</p>
                  <p className={`text-2xl font-bold ${calculation.isUpgrade ? 'text-red-400' : 'text-green-400'}`}>
                    {calculation.isUpgrade ? '+' : '-'}{formatPrice(calculation.monthlyDifference)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {calculation.isUpgrade ? 'Aumento' : 'Redução'} no valor mensal
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-300 text-sm mb-1">Valor Proporcional</p>
                  <p className={`text-2xl font-bold ${calculation.isUpgrade ? 'text-red-400' : 'text-green-400'}`}>
                    {formatPrice(calculation.difference)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {calculation.isUpgrade ? 'A cobrar' : 'A creditar'} pelos próximos {calculation.timeInfo?.remainingDays || 0} dias
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-300 text-sm mb-1">Novo Valor {planType}</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {formatPrice(calculation.newPlan.finalValue)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Equivalente a {formatPrice(calculation.newPlan.monthlyEquivalent)}/mês
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex justify-center pt-6">
        <Button 
          onClick={handleSave} 
          disabled={!selectedPlan || !calculation || !requestedBy.trim()}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg font-semibold shadow-lg"
        >
          <DollarSign className="w-5 h-5 mr-2" />
          Gerar Solicitação de Mudança
        </Button>
      </div>

      {/* Validation Alert */}
      {(!selectedPlan || !changeDate || !requestedBy.trim()) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm font-medium">
                Para continuar, preencha: {!selectedPlan && "Plano"}{!selectedPlan && (!changeDate || !requestedBy.trim()) && ", "}{!changeDate && "Data da mudança"}{!changeDate && !requestedBy.trim() && ", "}{!requestedBy.trim() && "Solicitado por"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlanChangeManager;
