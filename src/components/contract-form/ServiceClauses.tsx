import React, { useEffect, useState } from "react";
import { useContract } from "@/context/ContractContext";
import { usePlans } from "@/hooks/usePlans";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Calculator, Loader2, RefreshCw } from "lucide-react";
import { calculatePaymentDate, calculateRenewalDate, calculateRenewalFromPaymentStart } from "@/utils/dateUtils";

const ServiceClauses = () => {
  const { contractData, updateContractData } = useContract();
  const { plans, loading: plansLoading } = usePlans();
  const [isManualValue, setIsManualValue] = useState(false);
  const [lastAutoCalculatedValue, setLastAutoCalculatedValue] = useState("");
  
  const { 
    employeeCount, 
    cnpjCount, 
    monthlyValue, 
    trialDays, 
    startDate, 
    renewalDate,
    paymentStartDate,
    paymentDay,
    planType,
    semestralDiscount,
    anualDiscount
  } = contractData;

  // Valores adicionais - mantendo os mesmos valores para compatibilidade
  const additionalValues = {
    extraEmployeeGroup: 149.00, // Por grupo de 100 funcionários extras
    extraCnpj: 33.00 // Por CNPJ extra
  };

  // Converter planos do banco para o formato usado no cálculo (sempre baseado no valor mensal)
  const pricingTiers = plans.map(plan => {
    const [minEmployees, maxEmployees] = plan.employee_range.split('-').map(Number);
    return {
      minEmployees,
      maxEmployees: maxEmployees || minEmployees,
      cnpjs: plan.allowed_cnpjs,
      price: Number(plan.monthly_price), // Sempre usa o valor mensal para cálculos
      monthlyPrice: Number(plan.monthly_price),
      semestralPrice: Number(plan.semestral_price),
      annualPrice: Number(plan.annual_price)
    };
  }).sort((a, b) => a.minEmployees - b.minEmployees);

  // Função para obter o preço do plano baseado no tipo de pagamento selecionado
  const getPlanDisplayPrice = (plan: any) => {
    switch (planType) {
      case "semestral":
        return plan.semestralPrice;
      case "anual":
        return plan.annualPrice;
      default:
        return plan.monthlyPrice;
    }
  };

  // Função para encontrar o plano base adequado (sempre baseado no valor mensal)
  const findBasePlan = (employees: number) => {
    if (pricingTiers.length === 0) return null;
    
    // Primeiro, procura planos que incluem o número de funcionários e pega o mais barato
    const matchingPlans = pricingTiers.filter(plan => 
      employees >= plan.minEmployees && employees <= plan.maxEmployees
    );
    
    if (matchingPlans.length > 0) {
      // Seleciona o plano mais barato entre os que atendem (baseado no valor mensal)
      return matchingPlans.reduce((cheapest, current) => 
        current.price < cheapest.price ? current : cheapest
      );
    }
    
    // Se não encontrou um plano que inclui, encontra o plano base mais próximo com menor preço
    // Pega todos os planos cujo máximo seja menor que o número de funcionários
    const applicablePlans = pricingTiers.filter(plan => 
      plan.maxEmployees < employees
    );
    
    if (applicablePlans.length > 0) {
      // Entre os planos aplicáveis, pega o que tem maior capacidade e menor preço
      const maxCapacity = Math.max(...applicablePlans.map(plan => plan.maxEmployees));
      const highestCapacityPlans = applicablePlans.filter(plan => plan.maxEmployees === maxCapacity);
      
      return highestCapacityPlans.reduce((cheapest, current) => 
        current.price < cheapest.price ? current : cheapest
      );
    }
    
    // Fallback: retorna o plano mais barato
    return pricingTiers.reduce((cheapest, current) => 
      current.price < cheapest.price ? current : cheapest
    );
  };

  // Função para calcular funcionários extras e CNPJs extras
  const calculateExtras = (employees: number, cnpjs: number) => {
    if (pricingTiers.length === 0) {
      return {
        basePlan: { minEmployees: 0, maxEmployees: 0, cnpjs: 1, price: 0 },
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
        basePlan: pricingTiers[0],
        extraEmployees: 0,
        extraEmployeeGroups: 0,
        extraCnpjs: 0,
        extraEmployeeCost: 0,
        extraCnpjCost: 0
      };
    }
    
    // Calcular funcionários extras baseado no limite máximo do plano selecionado
    const extraEmployees = Math.max(0, employees - basePlan.maxEmployees);
    const extraEmployeeGroups = Math.ceil(extraEmployees / 100);
    
    // Calcular CNPJs extras
    const extraCnpjs = Math.max(0, cnpjs - basePlan.cnpjs);
    
    console.log(`🔍 Cálculo de extras detalhado:`, {
      funcionarios_totais: employees,
      plano_base_encontrado: `${basePlan.minEmployees}-${basePlan.maxEmployees}`,
      valor_base: basePlan.price,
      funcionarios_no_limite_do_plano: basePlan.maxEmployees,
      funcionarios_extras: extraEmployees,
      grupos_extras: extraEmployeeGroups,
      cnpjs_do_plano: basePlan.cnpjs,
      cnpjs_solicitados: cnpjs,
      cnpjs_extras: extraCnpjs
    });
    
    return {
      basePlan,
      extraEmployees,
      extraEmployeeGroups,
      extraCnpjs,
      extraEmployeeCost: extraEmployeeGroups * additionalValues.extraEmployeeGroup,
      extraCnpjCost: extraCnpjs * additionalValues.extraCnpj
    };
  };

  // Função para calcular valor com desconto
  const calculateValueWithDiscount = (basePrice: number, extraCosts: number, planType: string) => {
    const discount = planType === "semestral" 
      ? parseFloat(semestralDiscount) || 0
      : planType === "anual" 
      ? parseFloat(anualDiscount) || 0 
      : 0;

    let totalValue = basePrice + extraCosts;
    
    if (planType === "semestral") {
      totalValue = totalValue * 6;
    } else if (planType === "anual") {
      totalValue = totalValue * 12;
    }

    if (discount > 0) {
      totalValue = totalValue * (1 - discount / 100);
    }

    return totalValue;
  };

  // Função para calcular e retornar o valor automático
  const calculateAutomaticValue = () => {
    if (employeeCount && cnpjCount && !isNaN(parseInt(employeeCount)) && !isNaN(parseInt(cnpjCount)) && pricingTiers.length > 0) {
      const employees = parseInt(employeeCount);
      const cnpjs = parseInt(cnpjCount);
      
      const calculation = calculateExtras(employees, cnpjs);
      const totalExtraCost = calculation.extraEmployeeCost + calculation.extraCnpjCost;
      const finalValue = calculateValueWithDiscount(calculation.basePlan.price, totalExtraCost, planType);
      
      return finalValue.toFixed(2).replace('.', ',');
    }
    return "";
  };

  // Auto-preenchimento baseado no número de funcionários e CNPJs (apenas se não for valor manual)
  useEffect(() => {
    if (!isManualValue && employeeCount && cnpjCount && !isNaN(parseInt(employeeCount)) && !isNaN(parseInt(cnpjCount)) && pricingTiers.length > 0) {
      const newValue = calculateAutomaticValue();
      setLastAutoCalculatedValue(newValue);
      updateContractData({ monthlyValue: newValue });
    }
  }, [employeeCount, cnpjCount, planType, semestralDiscount, anualDiscount, pricingTiers, isManualValue]);

  // Auto-cálculo da data de renovação baseado no tipo de plano
  useEffect(() => {
    if (planType === "mensal" && paymentStartDate && paymentStartDate.trim() !== "") {
      // Para planos mensais, usar 12 meses a partir da data de início dos pagamentos
      const newRenewalDate = calculateRenewalFromPaymentStart(paymentStartDate, 12);
      if (newRenewalDate) {
        updateContractData({ renewalDate: newRenewalDate });
      }
    } else if ((planType === "semestral" || planType === "anual") && paymentStartDate && paymentStartDate.trim() !== "") {
      // Para planos semestrais e anuais, usar a data de início dos pagamentos
      let months = planType === "semestral" ? 6 : 12;
      
      const newRenewalDate = calculateRenewalFromPaymentStart(paymentStartDate, months);
      if (newRenewalDate) {
        updateContractData({ renewalDate: newRenewalDate });
      }
    }
  }, [startDate, paymentStartDate, planType]);

  // Auto-cálculo da data de início dos pagamentos
  useEffect(() => {
    if (startDate && trialDays && startDate.trim() !== "" && trialDays.trim() !== "") {
      const newPaymentDate = calculatePaymentDate(startDate, trialDays);
      if (newPaymentDate) {
        updateContractData({ paymentStartDate: newPaymentDate });
      }
    }
  }, [startDate, trialDays]);

  // Auto-preenchimento do dia do pagamento baseado na data de início dos pagamentos
  useEffect(() => {
    if (paymentStartDate && paymentStartDate.trim() !== "") {
      try {
        let date: Date;
        
        // Se a data está no formato yyyy-mm-dd (input date)
        if (/^\d{4}-\d{2}-\d{2}$/.test(paymentStartDate)) {
          date = new Date(paymentStartDate + 'T00:00:00');
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(paymentStartDate)) {
          // Se está no formato dd/mm/yyyy
          const parts = paymentStartDate.split('/');
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          date = new Date(year, month - 1, day);
        } else {
          return;
        }
        
        // Verificar se a data é válida
        if (!isNaN(date.getTime())) {
          const dayOfMonth = date.getDate();
          // Só atualiza se o campo está vazio ou ainda não foi preenchido
          if (!paymentDay || paymentDay.trim() === "") {
            updateContractData({ paymentDay: dayOfMonth.toString() });
          }
        }
      } catch (error) {
        console.error("Erro ao extrair dia do pagamento:", error);
      }
    }
  }, [paymentStartDate]);

  const formatTablePrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  const getDiscountValue = () => {
    switch (planType) {
      case "semestral":
        return semestralDiscount;
      case "anual":
        return anualDiscount;
      default:
        return "0";
    }
  };

  const getCalculationBreakdown = () => {
    if (!employeeCount || !cnpjCount || isNaN(parseInt(employeeCount)) || isNaN(parseInt(cnpjCount)) || pricingTiers.length === 0) {
      return null;
    }
    
    const employees = parseInt(employeeCount);
    const cnpjs = parseInt(cnpjCount);
    const calculation = calculateExtras(employees, cnpjs);
    
    return calculation;
  };

  const handleValueChange = (newValue: string) => {
    setIsManualValue(true);
    updateContractData({ monthlyValue: newValue });
  };

  const handleRecalculateValue = () => {
    const newAutoValue = calculateAutomaticValue();
    setIsManualValue(false);
    setLastAutoCalculatedValue(newAutoValue);
    updateContractData({ monthlyValue: newAutoValue });
  };

  const calculationBreakdown = getCalculationBreakdown();

  // Função para obter o nome do período baseado no tipo de plano
  const getPeriodName = () => {
    switch (planType) {
      case "semestral":
        return "Semestral";
      case "anual":
        return "Anual";
      default:
        return "Mensal";
    }
  };

  if (plansLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando planos...</span>
        </CardContent>
      </Card>
    );
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">Nenhum plano encontrado</p>
            <p className="text-sm">Configure os planos no menu "Gerenciamento de Planos" para continuar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tipo de Plano com Radio Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-contract">
            Tipo de Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={planType} 
            onValueChange={(value) => updateContractData({ planType: value })}
            className="flex flex-row space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mensal" id="mensal" />
              <Label htmlFor="mensal">Mensal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="semestral" id="semestral" />
              <Label htmlFor="semestral">Semestral</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="anual" id="anual" />
              <Label htmlFor="anual">Anual</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Desconto para planos semestral/anual */}
      {planType !== "mensal" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-contract">
              Desconto {planType} (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={getDiscountValue()}
                onChange={(e) => {
                  if (planType === "semestral") {
                    updateContractData({ semestralDiscount: e.target.value });
                  } else {
                    updateContractData({ anualDiscount: e.target.value });
                  }
                }}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Desconto aplicado sobre o valor {planType === "semestral" ? "semestral" : "anual"} (valor mensal x {planType === "semestral" ? "6" : "12"})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakdown do Cálculo */}
      {calculationBreakdown && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Detalhamento do Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">Plano Base Selecionado:</h4>
                  <p className="text-blue-700 dark:text-blue-300">
                    {calculationBreakdown.basePlan.minEmployees} - {calculationBreakdown.basePlan.maxEmployees} funcionários
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    {calculationBreakdown.basePlan.cnpjs} CNPJ{calculationBreakdown.basePlan.cnpjs > 1 ? 's' : ''} incluído{calculationBreakdown.basePlan.cnpjs > 1 ? 's' : ''}
                  </p>
                  <p className="font-semibold text-blue-800 dark:text-blue-200">
                    Valor base: R$ {formatTablePrice(calculationBreakdown.basePlan.price)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Adicionais:</h4>
                  {calculationBreakdown.extraEmployees > 0 && (
                    <p className="text-green-700 dark:text-green-300">
                      + {calculationBreakdown.extraEmployees} funcionários extras
                      ({calculationBreakdown.extraEmployeeGroups} grupo{calculationBreakdown.extraEmployeeGroups > 1 ? 's' : ''} de 100)
                      = R$ {formatTablePrice(calculationBreakdown.extraEmployeeCost)}
                    </p>
                  )}
                  {calculationBreakdown.extraCnpjs > 0 && (
                    <p className="text-green-700 dark:text-green-300">
                      + {calculationBreakdown.extraCnpjs} CNPJ{calculationBreakdown.extraCnpjs > 1 ? 's' : ''} extra{calculationBreakdown.extraCnpjs > 1 ? 's' : ''}
                      = R$ {formatTablePrice(calculationBreakdown.extraCnpjCost)}
                    </p>
                  )}
                  {calculationBreakdown.extraEmployees === 0 && calculationBreakdown.extraCnpjs === 0 && (
                    <p className="text-muted-foreground">Nenhum adicional necessário</p>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-lg font-semibold text-foreground">
                  Total {planType}: R$ {monthlyValue || '0,00'}
                  {planType !== "mensal" && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (com desconto de {getDiscountValue()}%)
                    </span>
                  )}
                </p>
                {isManualValue && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    ⚠️ Valor editado manualmente (negociação especial)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview da Cláusula 1.5 */}
      {monthlyValue && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-contract">
              Preview da Cláusula 1.5
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-600">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>1.5.</strong> Após o período gratuito, a utilização do software RHiD será cobrada {
                  planType === "mensal" ? "mensalmente" : 
                  planType === "semestral" ? "semestralmente" : "anualmente"
                } no valor de <strong>R$ {monthlyValue}</strong>. Este valor será reajustado anualmente, de acordo com:
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações do Serviço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-contract">
            Cláusula 1.3 - Informações do Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employeeCount">Número de colaboradores</Label>
            <Input
              id="employeeCount"
              name="employeeCount"
              type="number"
              value={employeeCount}
              onChange={(e) => updateContractData({ employeeCount: e.target.value })}
              placeholder="Ex: 220"
            />
            <p className="text-xs text-green-600">
              ✓ Sistema seleciona automaticamente o plano base adequado dos seus planos cadastrados
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cnpjCount">Quantidade de CNPJs necessários</Label>
            <Input
              id="cnpjCount"
              name="cnpjCount"
              type="number"
              value={cnpjCount}
              onChange={(e) => updateContractData({ cnpjCount: e.target.value })}
              placeholder="Ex: 5"
            />
            <p className="text-xs text-green-600">
              ✓ Calcula automaticamente CNPJs extras se necessário
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="trialDays">Dias de Teste</Label>
            <Input
              id="trialDays"
              name="trialDays"
              type="number"
              value={trialDays}
              onChange={(e) => updateContractData({ trialDays: e.target.value })}
              placeholder="Ex: 30"
            />
            <p className="text-xs text-green-600">
              ✓ Período gratuito antes do início das cobranças
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={startDate}
              onChange={(e) => updateContractData({ startDate: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="renewalDate">Data de Renovação</Label>
            <Input
              id="renewalDate"
              name="renewalDate"
              type="date"
              value={renewalDate}
              onChange={(e) => updateContractData({ renewalDate: e.target.value })}
            />
            <p className="text-xs text-green-600">
              ✓ Para planos mensais: Data de início + 1 mês
              <br />
              ✓ Para planos semestrais/anuais: Início dos pagamentos + 6/12 meses
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paymentStartDate">Início dos Pagamentos</Label>
            <Input
              id="paymentStartDate"
              name="paymentStartDate"
              type="date"
              value={paymentStartDate}
              onChange={(e) => updateContractData({ paymentStartDate: e.target.value })}
            />
            <p className="text-xs text-green-600">
              ✓ Calculado automaticamente baseado na data de início + dias de teste
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Valor do Serviço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-contract">
            Valor do Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyValue">
              Valor {planType === "mensal" ? "Mensal" : planType === "semestral" ? "Semestral" : "Anual"} (R$)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="monthlyValue"
                name="monthlyValue"
                value={monthlyValue}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="0,00"
                className={isManualValue ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20" : ""}
              />
              {isManualValue && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRecalculateValue}
                  title="Recalcular valor automaticamente"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {isManualValue ? (
                <p className="text-xs text-orange-600">
                  ⚠️ Valor editado manualmente para negociação especial. Clique em ⟲ para recalcular automaticamente.
                </p>
              ) : (
                <p className="text-xs text-green-600">
                  ✓ Calculado automaticamente: plano base + adicionais + descontos (baseado nos seus planos cadastrados)
                </p>
              )}
              {lastAutoCalculatedValue && isManualValue && (
                <p className="text-xs text-gray-500">
                  Valor automático seria: R$ {lastAutoCalculatedValue}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paymentDay">Dia do Pagamento</Label>
            <Input
              id="paymentDay"
              name="paymentDay"
              type="number"
              min="1"
              max="31"
              value={paymentDay}
              onChange={(e) => updateContractData({ paymentDay: e.target.value })}
              placeholder="Ex: 5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Preços de Referência */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-contract">
            Seus Planos Cadastrados
            <Badge variant="outline" className="ml-2">
              Valores {getPeriodName()}s do Gerenciamento de Planos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faixa de Funcionários</TableHead>
                  <TableHead>CNPJs Incluídos</TableHead>
                  <TableHead>Valor {getPeriodName()} (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingTiers.map((tier, index) => {
                  const isSelected = calculationBreakdown && 
                    tier.minEmployees === calculationBreakdown.basePlan.minEmployees &&
                    tier.maxEmployees === calculationBreakdown.basePlan.maxEmployees;
                  
                  const displayPrice = getPlanDisplayPrice(tier);
                  
                  return (
                     <TableRow 
                      key={index} 
                      className={isSelected ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : ""}
                    >
                      <TableCell>
                        {tier.minEmployees === tier.maxEmployees 
                          ? `${tier.minEmployees} funcionário${tier.minEmployees > 1 ? 's' : ''}`
                          : `${tier.minEmployees} - ${tier.maxEmployees} funcionários`
                        }
                        {isSelected && <Badge variant="default" className="ml-2">Plano Base Selecionado</Badge>}
                      </TableCell>
                      <TableCell>{tier.cnpjs} CNPJ{tier.cnpjs > 1 ? 's' : ''}</TableCell>
                      <TableCell>R$ {formatTablePrice(displayPrice)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Valores Adicionais:</h4>
              <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                <li>• Funcionários extras: R$ {formatTablePrice(additionalValues.extraEmployeeGroup)} por grupo de 100 funcionários</li>
                <li>• CNPJs extras: R$ {formatTablePrice(additionalValues.extraCnpj)} por CNPJ adicional</li>
              </ul>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800 dark:text-green-200">
                  <p className="font-medium mb-1">Integração com Gerenciamento de Planos</p>
                  <p>Os valores são baseados nos planos cadastrados no seu "Gerenciamento de Planos". A tabela mostra os valores {getPeriodName().toLowerCase()}s conforme o método de pagamento selecionado. Os cálculos sempre usam o valor mensal como base.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceClauses;
