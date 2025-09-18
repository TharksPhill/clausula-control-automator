import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, DollarSign, Edit, AlertTriangle, Users, Building2, Calculator, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";
import { usePlans } from "@/hooks/usePlans";
import { usePlanAddons } from "@/hooks/usePlanAddons";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calculateProportionalValue } from "@/utils/dateUtils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ManualValueEditModalProps {
  contract: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: number;
  analysisDate: Date;
}

const ManualValueEditModal = ({ 
  contract, 
  open, 
  onOpenChange, 
  currentValue, 
  analysisDate 
}: ManualValueEditModalProps) => {
  const { createAdjustment, isCreating } = useContractAdjustments();
  const { plans } = usePlans();
  const { planAddons } = usePlanAddons();
  const { toast } = useToast();
  
  const [adjustmentMode, setAdjustmentMode] = useState<'manual' | 'automatic'>('manual');
  const [adjustmentType, setAdjustmentType] = useState<'value' | 'percentage'>('value');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [notes, setNotes] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  
  // Campos para cálculo automático
  const [employeeCount, setEmployeeCount] = useState('');
  const [cnpjCount, setCnpjCount] = useState('');
  const [planType, setPlanType] = useState('mensal');
  
  // Campos para desconto
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'value' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  
// Campo para cálculo proporcional
const [useProportionalCalculation, setUseProportionalCalculation] = useState(false);
const [changeDate, setChangeDate] = useState<Date | undefined>(undefined);
  // Initialize with current analysis date and contract data
  useEffect(() => {
if (analysisDate) {
  setEffectiveDate(format(analysisDate, 'yyyy-MM-dd'));
  setChangeDate(analysisDate);
}
if (contract) {
      setEmployeeCount(contract.employee_count || '');
      setCnpjCount(contract.cnpj_count || '');
      setPlanType(contract.plan_type || 'mensal');
    }
  }, [analysisDate, contract]);

  if (!contract) return null;

  // Função para encontrar o plano base baseado no número de funcionários
  const findBasePlan = (employees: number) => {
    if (plans.length === 0) return null;
    
    // Primeiro, tentar encontrar um plano que inclua exatamente o número de funcionários
    const matchingPlans = plans.filter(plan => {
      const [min, max] = plan.employee_range.split('-').map(Number);
      return employees >= min && employees <= max;
    });
    
    if (matchingPlans.length > 0) {
      // Se encontrou planos que atendem, pega o mais adequado (menor preço mensal)
      return matchingPlans.reduce((cheapest, current) => 
        current.monthly_price < cheapest.monthly_price ? current : cheapest
      );
    }
    
    // Se não encontrou um plano exato, procurar planos cujo máximo seja menor que o número de funcionários
    const applicablePlans = plans.filter(plan => {
      const [, max] = plan.employee_range.split('-').map(Number);
      return max < employees;
    });
    
    if (applicablePlans.length > 0) {
      // Entre os planos aplicáveis, pegar o que tem maior capacidade
      const maxCapacity = Math.max(...applicablePlans.map(plan => {
        const [, max] = plan.employee_range.split('-').map(Number);
        return max;
      }));
      
      const highestCapacityPlans = applicablePlans.filter(plan => {
        const [, max] = plan.employee_range.split('-').map(Number);
        return max === maxCapacity;
      });
      
      // Entre os de maior capacidade, pegar o mais barato
      return highestCapacityPlans.reduce((cheapest, current) => 
        current.monthly_price < cheapest.monthly_price ? current : cheapest
      );
    }
    
    // Fallback: retorna o plano mais barato disponível
    return plans.reduce((cheapest, current) => 
      current.monthly_price < cheapest.monthly_price ? current : cheapest
    );
  };

  // Função para calcular funcionários e CNPJs extras
  const calculateExtras = (employees: number, cnpjs: number) => {
    if (plans.length === 0) {
      return {
        basePlan: null,
        extraEmployees: 0,
        extraEmployeeGroups: 0,
        extraCnpjs: 0,
        extraEmployeeCost: 0,
        extraCnpjCost: 0
      };
    }

    const basePlan = findBasePlan(employees);
    if (!basePlan) {
      return {
        basePlan: null,
        extraEmployees: 0,
        extraEmployeeGroups: 0,
        extraCnpjs: 0,
        extraEmployeeCost: 0,
        extraCnpjCost: 0
      };
    }
    
    const [, maxEmployees] = basePlan.employee_range.split('-').map(Number);
    const extraEmployees = Math.max(0, employees - maxEmployees);
    const extraEmployeeGroups = Math.ceil(extraEmployees / 100);
    const extraCnpjs = Math.max(0, cnpjs - basePlan.allowed_cnpjs);
    
    // Buscar preços dos adicionais
    const employeeAddon = planAddons.find(addon => 
      addon.name.toLowerCase().includes('funcionários') || 
      addon.name.toLowerCase().includes('employee')
    );
    const cnpjAddon = planAddons.find(addon => 
      addon.name.toLowerCase().includes('cnpj')
    );
    
    const extraEmployeeCost = extraEmployeeGroups * (employeeAddon?.price_per_unit || 149);
    const extraCnpjCost = extraCnpjs * (cnpjAddon?.price_per_unit || 33);
    
    return {
      basePlan,
      extraEmployees,
      extraEmployeeGroups,
      extraCnpjs,
      extraEmployeeCost,
      extraCnpjCost
    };
  };

  // Função para calcular valor mensal (sempre mensal, independente do tipo de plano)
  const calculateValueWithDiscount = (basePrice: number, extraCosts: number, planType: string) => {
    // Para mudança de plano, sempre mostrar o valor mensal
    // O tipo de plano já determina qual preço base usar (mensal, semestral ou anual)
    // mas o valor final deve sempre ser mensal para consistência
    return basePrice + extraCosts;
  };

  // Função para aplicar desconto
  const applyDiscount = (value: number) => {
    if (!hasDiscount || !discountValue) return value;
    
    const discount = parseFloat(discountValue);
    if (discountType === 'percentage') {
      return value * (1 - discount / 100);
    } else {
      return Math.max(0, value - discount);
    }
  };

  // Função para calcular valor automático baseado em funcionários e CNPJs
  const calculateAutomaticValue = () => {
    if (!employeeCount || !cnpjCount || isNaN(parseInt(employeeCount)) || isNaN(parseInt(cnpjCount))) {
      return 0;
    }

    const employees = parseInt(employeeCount);
    const cnpjs = parseInt(cnpjCount);
    
    const calculation = calculateExtras(employees, cnpjs);
    if (!calculation.basePlan) return 0;

    const basePrice = planType === 'mensal' ? calculation.basePlan.monthly_price :
                     planType === 'semestral' ? calculation.basePlan.semestral_price :
                     calculation.basePlan.annual_price;

    const totalExtraCost = calculation.extraEmployeeCost + calculation.extraCnpjCost;
    const baseValue = calculateValueWithDiscount(basePrice, totalExtraCost, planType);
    return applyDiscount(baseValue);
  };

  // Calculate new value based on adjustment mode
  const getNewValue = () => {
    if (adjustmentMode === 'automatic') {
      return calculateAutomaticValue();
    }
    
    const adjValue = parseFloat(adjustmentValue || '0');
    let newVal;
    if (adjustmentType === 'percentage') {
      newVal = currentValue * (1 + adjValue / 100);
    } else {
      newVal = adjValue;
    }
    
    return applyDiscount(newVal);
  };

  const newValue = getNewValue();
  
  // Calculate proportional value if enabled
const getProportionalCalculation = () => {
  if (!useProportionalCalculation || (!changeDate && !effectiveDate) || !contract.payment_day) {
    return null;
  }
  const changeDateStr = changeDate ? format(changeDate, 'yyyy-MM-dd') : effectiveDate;
  const paymentDay = parseInt(contract.payment_day);
  return calculateProportionalValue(changeDateStr, paymentDay, currentValue, newValue);
};

const proportionalCalc = getProportionalCalculation();
const selectedChangeDateStr = (changeDate ? format(changeDate, 'yyyy-MM-dd') : effectiveDate) || '';
let nextDueDateStr: string | null = null;
if (useProportionalCalculation && contract.payment_day && selectedChangeDateStr) {
  const d = new Date(selectedChangeDateStr);
  const pd = parseInt(contract.payment_day);
  const next = d.getDate() >= pd ? new Date(d.getFullYear(), d.getMonth() + 1, pd) : new Date(d.getFullYear(), d.getMonth(), pd);
  nextDueDateStr = format(next, 'dd/MM/yyyy', { locale: ptBR });
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adjustmentMode === 'manual' && (!adjustmentValue || !effectiveDate)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (adjustmentMode === 'automatic' && (!employeeCount || !cnpjCount || !effectiveDate)) {
      toast({
        title: "Erro",
        description: "Preencha o número de funcionários, CNPJs e data de vigência",
        variant: "destructive"
      });
      return;
    }

// Use proportional value only for display and notes; the contract's new recurring value remains full newValue
const proportionalCharge = useProportionalCalculation && proportionalCalc ? proportionalCalc.totalValue : null;

const adjustmentData = {
  contract_id: contract.id,
  adjustment_type: adjustmentMode === 'automatic' ? 'value' : adjustmentType,
  adjustment_value: adjustmentMode === 'automatic' ? newValue : parseFloat(adjustmentValue),
  renewal_date: effectiveDate,
  previous_value: currentValue,
  new_value: newValue,
  effective_date: effectiveDate,
  notes: (notes.trim() ? notes.trim() + ' ' : '') +
    (adjustmentMode === 'automatic'
      ? `Mudança de plano automática: ${employeeCount} funcionários, ${cnpjCount} CNPJs, plano ${planType}`
      : `Mudança de plano manual: ${adjustmentType === 'percentage' ? 'percentual' : 'valor'}`)
    + (hasDiscount && discountValue ? ` com desconto de ${discountType === 'percentage' ? discountValue + '%' : 'R$ ' + discountValue}` : '')
    + (proportionalCharge ? ` | Próxima fatura proporcional: R$ ${proportionalCharge.toFixed(2)} (${proportionalCalc?.daysOldPlan}d antigo, ${proportionalCalc?.daysNewPlan}d novo)` : '')
    + ` | Vigência: ${format(new Date(effectiveDate), 'dd/MM/yyyy', { locale: ptBR })}`,
};

    try {
      await createAdjustment(adjustmentData);
      
      toast({
        title: "Sucesso",
        description: "Mudança de plano aplicada com sucesso",
      });
      
      // Reset form
      setAdjustmentValue('');
      setNotes('');
      setEmployeeCount('');
      setCnpjCount('');
      setDiscountValue('');
      setHasDiscount(false);
      setUseProportionalCalculation(false);
      onOpenChange(false);
      
    } catch (error) {
      console.error("Erro ao criar ajuste:", error);
      toast({
        title: "Erro",
        description: "Falha ao aplicar a mudança de plano",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Mudança de Plano
          </DialogTitle>
          <DialogDescription>
            Aplicar uma mudança de plano no contrato {contract.contract_number}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6 h-full">
          {/* Left Column - Form */}
          <div className="col-span-2 space-y-4">
            {/* Contract Info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Contrato</Label>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{contract.contract_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Valor Atual</Label>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Adjustment Mode Selection */}
              <div>
                <Label>Modo de Mudança de Plano</Label>
                <Select 
                  value={adjustmentMode} 
                  onValueChange={(value: 'manual' | 'automatic') => setAdjustmentMode(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o modo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual (valor/percentual fixo)</SelectItem>
                    <SelectItem value="automatic">Automático (por funcionários e CNPJs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {adjustmentMode === 'automatic' ? (
                // Automatic mode fields
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Cálculo Automático
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="employeeCount" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Funcionários
                      </Label>
                      <Input
                        id="employeeCount"
                        type="number"
                        min="1"
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                        placeholder="Ex: 15"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="cnpjCount" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        CNPJs
                      </Label>
                      <Input
                        id="cnpjCount"
                        type="number"
                        min="1"
                        value={cnpjCount}
                        onChange={(e) => setCnpjCount(e.target.value)}
                        placeholder="Ex: 2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="planType">Período</Label>
                      <Select value={planType} onValueChange={setPlanType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="semestral">Semestral</SelectItem>
                          <SelectItem value="anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {employeeCount && cnpjCount && (
                    <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded border">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <strong>Cálculo automático:</strong>
                        {(() => {
                          const calc = calculateExtras(parseInt(employeeCount), parseInt(cnpjCount));
                          
                          // Debug logging
                          console.log(`🔍 Debug Mudança de Plano:`, {
                            funcionarios: parseInt(employeeCount),
                            cnpjs: parseInt(cnpjCount),
                            plano_encontrado: calc.basePlan?.name,
                            range_plano: calc.basePlan?.employee_range,
                            funcionarios_extras: calc.extraEmployees,
                            grupos_extras: calc.extraEmployeeGroups,
                            custo_funcionarios_extras: calc.extraEmployeeCost,
                            cnpjs_extras: calc.extraCnpjs,
                            custo_cnpjs_extras: calc.extraCnpjCost
                          });
                          
                          if (!calc.basePlan) return " ❌ Nenhum plano encontrado para essa quantidade de funcionários";
                          
                          const basePrice = planType === 'mensal' ? calc.basePlan.monthly_price :
                                           planType === 'semestral' ? calc.basePlan.semestral_price :
                                           calc.basePlan.annual_price;
                          const beforeDiscount = calculateValueWithDiscount(basePrice, calc.extraEmployeeCost + calc.extraCnpjCost, planType);
                          const afterDiscount = applyDiscount(beforeDiscount);
                          
                           return (
                             <div className="mt-2 space-y-1">
                               <div>• Plano base: {calc.basePlan.name} ({calc.basePlan.employee_range} funcionários) - R$ {basePrice.toFixed(2)}</div>
                               {calc.extraEmployees > 0 && (
                                 <div className="text-orange-600 dark:text-orange-400">
                                   • <strong>+{calc.extraEmployees} funcionários extras</strong> ({calc.extraEmployeeGroups} grupos de 100): R$ {calc.extraEmployeeCost.toFixed(2)}
                                 </div>
                               )}
                               {calc.extraCnpjs > 0 && (
                                 <div className="text-orange-600 dark:text-orange-400">
                                   • <strong>+{calc.extraCnpjs} CNPJs extras</strong>: R$ {calc.extraCnpjCost.toFixed(2)}
                                 </div>
                               )}
                               <div className="text-slate-600 dark:text-slate-400 border-t pt-1 mt-2">
                                 Subtotal: R$ {beforeDiscount.toFixed(2)}
                               </div>
                               {hasDiscount && discountValue && (
                                 <div className="text-orange-600 dark:text-orange-400">
                                   Desconto ({discountType === 'percentage' ? `${discountValue}%` : `R$ ${discountValue}`}): 
                                   -R$ {(beforeDiscount - afterDiscount).toFixed(2)}
                                 </div>
                               )}
                               <div className="font-semibold text-green-600 dark:text-green-400 text-lg">
                                 💰 Total: R$ {afterDiscount.toFixed(2)}
                               </div>
                             </div>
                           );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Manual mode fields
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adjustmentType">Tipo de Mudança</Label>
                    <Select 
                      value={adjustmentType} 
                      onValueChange={(value: 'value' | 'percentage') => setAdjustmentType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="value">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="adjustmentValue">
                      {adjustmentType === 'percentage' ? 'Percentual' : 'Novo Valor'}
                    </Label>
                    <Input
                      id="adjustmentValue"
                      type="number"
                      step="0.01"
                      value={adjustmentValue}
                      onChange={(e) => setAdjustmentValue(e.target.value)}
                      placeholder={adjustmentType === 'percentage' ? '10.5' : '1200.00'}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Discount Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasDiscount"
                    checked={hasDiscount}
                    onChange={(e) => setHasDiscount(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="hasDiscount" className="flex items-center gap-2 cursor-pointer">
                    <Percent className="h-4 w-4" />
                    Aplicar Desconto
                  </Label>
                </div>

                {hasDiscount && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800/30">
                    <div>
                      <Label htmlFor="discountType">Tipo de Desconto</Label>
                      <Select 
                        value={discountType} 
                        onValueChange={(value: 'value' | 'percentage') => setDiscountType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentual (%)</SelectItem>
                          <SelectItem value="value">Valor (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="discountValue">
                        {discountType === 'percentage' ? 'Percentual de Desconto' : 'Valor do Desconto'}
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        step="0.01"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'percentage' ? '10.5' : '200.00'}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Proportional Calculation Option */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="useProportional"
                    checked={useProportionalCalculation}
                    onChange={(e) => setUseProportionalCalculation(e.target.checked)}
                    className="rounded"
                  />
<Label htmlFor="useProportional" className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-100">
  <CalendarIcon className="h-4 w-4" />
  Calcular valor proporcional da próxima fatura
</Label>
</div>

{useProportionalCalculation && (
  <div className="mb-3">
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-[260px] justify-start text-left font-normal", !changeDate && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {changeDate ? format(changeDate, "PPP", { locale: ptBR }) : <span>Data de alteração do plano</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={changeDate}
          onSelect={setChangeDate}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  </div>
)}

{useProportionalCalculation && contract.payment_day && (changeDate || effectiveDate) && (
<div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 text-sm">
  <div className="flex items-center gap-2 mb-3">
    <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    <div className="font-medium text-blue-800 dark:text-blue-200">
      📅 Cálculo Proporcional
    </div>
  </div>
  <div className="mb-3 p-2 bg-blue-100 dark:bg-blue-800/30 rounded border border-blue-200 dark:border-blue-700">
    <div className="font-medium text-blue-900 dark:text-blue-100">
      📅 Data de pagamento determinada no contrato: Todo dia {contract.payment_day}
    </div>
    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
      Data de alteração: {(changeDate || effectiveDate) ? (changeDate ? format(changeDate, 'dd/MM/yyyy', { locale: ptBR }) : format(new Date(effectiveDate), 'dd/MM/yyyy', { locale: ptBR })) : '-'}
      {nextDueDateStr && (<span className="ml-2">• Próximo vencimento: {nextDueDateStr}</span>)}
    </div>
  </div>
                    {proportionalCalc && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            <span className="text-red-700 dark:text-red-300">Plano anterior ({proportionalCalc.daysOldPlan} dias):</span>
                            <span className="font-medium text-red-800 dark:text-red-200">R$ {proportionalCalc.proportionalOldValue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <span className="text-green-700 dark:text-green-300">Plano novo ({proportionalCalc.daysNewPlan} dias):</span>
                            <span className="font-medium text-green-800 dark:text-green-200">R$ {proportionalCalc.proportionalNewValue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-t-2 border-blue-200 dark:border-blue-700">
                            <span className="font-semibold text-blue-800 dark:text-blue-200">
                              Total a cobrar {proportionalCalc.isChargeForNextMonth ? 'no próximo mês' : 'este mês'}:
                            </span>
                            <span className="font-bold text-blue-900 dark:text-blue-100 text-lg">R$ {proportionalCalc.totalValue.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {useProportionalCalculation && !contract.payment_day && (
                  <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                    ⚠️ Dia de pagamento não definido no contrato. O cálculo proporcional não pode ser realizado.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="effectiveDate">Data de Vigência</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Justificativa para o ajuste..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating || 
                           !effectiveDate ||
                           (adjustmentMode === 'manual' && !adjustmentValue) ||
                           (adjustmentMode === 'automatic' && (!employeeCount || !cnpjCount))
                  }
                >
                  {isCreating ? 'Aplicando...' : `Aplicar Mudança de Plano ${adjustmentMode === 'automatic' ? 'Automática' : 'Manual'}`}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column - Preview */}
          <div className="col-span-1 space-y-4">
            {((adjustmentMode === 'manual' && adjustmentValue) || (adjustmentMode === 'automatic' && employeeCount && cnpjCount)) && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Resumo da Mudança de Plano {adjustmentMode === 'automatic' ? 'Automática' : 'Manual'}
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Valor Atual:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Novo Valor:</span>
                    <span className="font-medium text-green-700 dark:text-green-400">
                      R$ {newValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {hasDiscount && discountValue && (
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Desconto:</span>
                      <span className="font-medium text-orange-600 dark:text-orange-400">
                        {discountType === 'percentage' ? `${discountValue}%` : `R$ ${discountValue}`}
                      </span>
                    </div>
                  )}
                  {useProportionalCalculation && proportionalCalc && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-300">Valor Proporcional:</span>
                        <span className="font-medium text-amber-700 dark:text-amber-300">
                          R$ {proportionalCalc.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-300">Dias do novo plano:</span>
                        <span className="font-medium text-amber-700 dark:text-amber-300">
                          {proportionalCalc.daysNewPlan} dias
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-blue-700 dark:text-blue-300">Variação:</span>
                    <span className={`font-medium ${newValue > currentValue ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {newValue > currentValue ? '+' : ''}
                      {((newValue - currentValue) / currentValue * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Diferença:</span>
                    <span className={`font-medium ${newValue > currentValue ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {newValue > currentValue ? '+' : ''}R$ {(newValue - currentValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Vigência:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {effectiveDate ? format(new Date(effectiveDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definida'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>
                    Esta mudança de plano {adjustmentMode === 'automatic' ? 'automática' : 'manual'} será aplicada imediatamente e afetará os cálculos futuros
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualValueEditModal;