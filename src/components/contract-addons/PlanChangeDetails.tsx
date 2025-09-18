
import React from "react";
import { Badge } from "@/components/ui/badge";
import { ContractAddon } from "@/types/contract-addons";
import { formatDateToBrazilian } from "@/utils/dateUtils";

interface PlanChangeDetailsProps {
  addon: ContractAddon;
  contractData?: any;
}

const PlanChangeDetails = ({ addon, contractData }: PlanChangeDetailsProps) => {
  if (!addon.plan_change_details) {
    return null;
  }

  const details = addon.plan_change_details as any;
  const calculation = details.calculation;

  if (!calculation) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPlanType = (planType: string) => {
    switch (planType) {
      case 'mensal':
        return 'Mensal';
      case 'semestral':
        return 'Semestral';
      case 'anual':
        return 'Anual';
      default:
        return planType;
    }
  };

  const currentPlan = calculation.currentPlan;
  const newPlan = calculation.newPlan;

  // Para cálculo do tempo restante
  const changeDate = new Date(details.changeDate);
  const contractEndDate = contractData?.renewal_date ? new Date(contractData.renewal_date) : null;
  
  let remainingDays = 0;
  let remainingMonths = 0;
  
  if (contractEndDate) {
    const timeDiff = contractEndDate.getTime() - changeDate.getTime();
    remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    remainingMonths = Math.floor(remainingDays / 30);
  }

  // Função corrigida para extrair o número correto de funcionários do range
  const extractEmployeeCountFromRange = (range: string): number => {
    console.log('🔍 Extraindo funcionários do range:', range);
    
    if (!range) {
      console.log('⚠️ Range vazio, retornando 0');
      return 0;
    }
    
    // Limpar o range de espaços e converter para minúsculo
    const cleanRange = range.trim().toLowerCase();
    
    // Para ranges como "11-20 funcionários" ou "11-20", sempre usar o valor máximo
    const rangeMatch = cleanRange.match(/(\d+)[-\s]*(?:a|até)?\s*(\d+)/);
    if (rangeMatch) {
      const maxEmployees = parseInt(rangeMatch[2]);
      console.log('✓ Encontrado range, usando máximo:', maxEmployees);
      return maxEmployees;
    }
    
    // Para casos como "até 20" ou "até 20 funcionários"
    const ateMatch = cleanRange.match(/até\s*(\d+)/);
    if (ateMatch) {
      const count = parseInt(ateMatch[1]);
      console.log('✓ Encontrado padrão "até X":', count);
      return count;
    }
    
    // Para casos como "1 a 5"
    const aMatch = cleanRange.match(/(\d+)\s*a\s*(\d+)/);
    if (aMatch) {
      const maxEmployees = parseInt(aMatch[2]);
      console.log('✓ Encontrado range com "a", usando máximo:', maxEmployees);
      return maxEmployees;
    }
    
    // Se não encontrou range, tentar extrair o último número encontrado
    const numbers = cleanRange.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      // Se há múltiplos números, pegar o último (que geralmente é o máximo)
      const lastNumber = parseInt(numbers[numbers.length - 1]);
      console.log('✓ Usando último número encontrado:', lastNumber);
      return lastNumber;
    }
    
    console.log('⚠️ Não foi possível extrair número do range, retornando 0');
    return 0;
  };

  // Calcular os novos totais baseados no plano selecionado e addons
  const calculateNewPlanTotals = () => {
    console.log('=== CALCULANDO NOVOS TOTAIS ===');
    console.log('newPlan completo:', JSON.stringify(newPlan, null, 2));
    
    // Inicializar com valores padrão
    let totalEmployees = 0;
    let totalCnpjs = 1;
    
    // PRIORIDADE 1: Usar employeeCount se existe e é válido
    if (newPlan.employeeCount !== undefined && newPlan.employeeCount !== null && newPlan.employeeCount > 0) {
      totalEmployees = newPlan.employeeCount;
      console.log('✓ Usando employeeCount do newPlan:', totalEmployees);
    } 
    // PRIORIDADE 2: Extrair do selectedPlan.employee_range
    else if (newPlan.selectedPlan?.employee_range) {
      const range = newPlan.selectedPlan.employee_range;
      console.log('📋 employee_range encontrado:', range);
      
      totalEmployees = extractEmployeeCountFromRange(range);
      console.log('✓ Funcionários extraídos do range:', totalEmployees);
      
      // Se ainda é 0, tentar outros campos do plano
      if (totalEmployees === 0 && newPlan.selectedPlan?.allowed_employees) {
        totalEmployees = newPlan.selectedPlan.allowed_employees;
        console.log('✓ Usando allowed_employees como fallback:', totalEmployees);
      }
    } 
    // PRIORIDADE 3: Verificar outros campos possíveis
    else if (newPlan.selectedPlan?.allowed_employees) {
      totalEmployees = newPlan.selectedPlan.allowed_employees;
      console.log('✓ Usando allowed_employees:', totalEmployees);
    }
    // PRIORIDADE 4: Se ainda é 0, usar o valor do plano atual como referência mínima
    else if (currentPlan?.employeeCount && currentPlan.employeeCount > 0) {
      totalEmployees = currentPlan.employeeCount;
      console.log('⚠️ Usando employeeCount do plano atual como fallback:', totalEmployees);
    }
    
    // Para CNPJs - mesma lógica
    if (newPlan.cnpjCount !== undefined && newPlan.cnpjCount !== null && newPlan.cnpjCount > 0) {
      totalCnpjs = newPlan.cnpjCount;
      console.log('✓ Usando cnpjCount do newPlan:', totalCnpjs);
    } else if (newPlan.selectedPlan?.allowed_cnpjs) {
      totalCnpjs = newPlan.selectedPlan.allowed_cnpjs;
      console.log('✓ Usando allowed_cnpjs:', totalCnpjs);
    }
    
    console.log('📊 Base inicial - Funcionários:', totalEmployees, 'CNPJs:', totalCnpjs);
    
    // Adicionar os addons extras
    if (newPlan.addons && Array.isArray(newPlan.addons) && newPlan.addons.length > 0) {
      console.log('🔧 Processando addons:', newPlan.addons);
      
      newPlan.addons.forEach((addon: any, index: number) => {
        console.log(`Addon ${index + 1}:`, addon);
        
        // Verificar se é addon de funcionários extras
        if (addon.name && (
          addon.name.toLowerCase().includes('funcionários') || 
          addon.name.toLowerCase().includes('funcionario') ||
          addon.name.toLowerCase().includes('employee') ||
          addon.name.toLowerCase().includes('extra')
        )) {
          const quantity = parseInt(addon.quantity) || 0;
          if (quantity > 0) {
            totalEmployees += quantity;
            console.log(`✓ Adicionando ${quantity} funcionários extras. Total agora: ${totalEmployees}`);
          }
        }
        
        // Verificar se é addon de CNPJs extras
        if (addon.name && (
          addon.name.toLowerCase().includes('cnpj') ||
          addon.name.toLowerCase().includes('empresa')
        )) {
          const quantity = parseInt(addon.quantity) || 0;
          if (quantity > 0) {
            totalCnpjs += quantity;
            console.log(`✓ Adicionando ${quantity} CNPJs extras. Total agora: ${totalCnpjs}`);
          }
        }
      });
    } else {
      console.log('ℹ️ Nenhum addon encontrado ou array vazio');
    }
    
    console.log('🎯 TOTAIS FINAIS - Funcionários:', totalEmployees, 'CNPJs:', totalCnpjs);
    console.log('===============================');
    
    return { totalEmployees, totalCnpjs };
  };

  const { totalEmployees: newTotalEmployees, totalCnpjs: newTotalCnpjs } = calculateNewPlanTotals();

  // Função para calcular o preço das Notificações Premium baseado na faixa de funcionários
  const getNotificationPremiumPrice = (employeeCount: number): number => {
    console.log('🔔 Calculando preço das Notificações Premium para', employeeCount, 'funcionários');
    
    if (employeeCount <= 5) {
      console.log('✓ Faixa 1-5 funcionários: R$ 32,00');
      return 32.00;
    } else if (employeeCount <= 20) {
      console.log('✓ Faixa 6-20 funcionários: R$ 48,00');
      return 48.00;
    } else if (employeeCount <= 50) {
      console.log('✓ Faixa 21-50 funcionários: R$ 68,00');
      return 68.00;
    } else if (employeeCount <= 100) {
      console.log('✓ Faixa 51-100 funcionários: R$ 88,00');
      return 88.00;
    } else {
      console.log('✓ Faixa 101+ funcionários: R$ 98,00');
      return 98.00;
    }
  };

  // Calcular os valores corretos dos addons com base na quantidade real de funcionários
  const calculateAddonDisplayValues = () => {
    const addonDisplayValues: any[] = [];
    
    if (newPlan.addons && Array.isArray(newPlan.addons)) {
      newPlan.addons.forEach((addon: any) => {
        console.log(`📋 Processando addon: "${addon.name}"`);
        console.log(`📋 Valor original do addon:`, addon.totalPrice);
        console.log(`📋 Quantidade original do addon:`, addon.quantity);
        
        // Para Notificações Premium, usar SEMPRE o preço fixo da faixa (independente da quantidade)
        if (addon.name && addon.name.toLowerCase().includes('notificações')) {
          const correctPrice = getNotificationPremiumPrice(newTotalEmployees);
          
          addonDisplayValues.push({
            ...addon,
            displayQuantity: `faixa de ${newTotalEmployees} funcionários`,
            displayTotalPrice: correctPrice // PREÇO FIXO BASEADO NA FAIXA
          });
          
          console.log(`🎯 CORREÇÃO FINAL - Notificações Premium: faixa ${newTotalEmployees} funcionários = R$ ${correctPrice} (PREÇO FIXO, IGNORA QUANTIDADE)`);
        }
        // Para outros addons baseados em funcionários (como Reconhecimento Facial)
        else if (addon.name && (
          addon.name.toLowerCase().includes('reconhecimento') ||
          addon.name.toLowerCase().includes('facial') ||
          addon.name.toLowerCase().includes('funcionário') ||
          addon.name.toLowerCase().includes('funcionario')
        )) {
          const unitPrice = addon.totalPrice / (addon.quantity || 1);
          const correctTotalPrice = unitPrice * newTotalEmployees;
          
          addonDisplayValues.push({
            ...addon,
            displayQuantity: newTotalEmployees,
            displayTotalPrice: correctTotalPrice
          });
          
          console.log(`✓ Addon por funcionário "${addon.name}": ${newTotalEmployees} funcionários × R$ ${unitPrice} = R$ ${correctTotalPrice}`);
        }
        // Para outros addons, manter a quantidade original
        else {
          addonDisplayValues.push({
            ...addon,
            displayQuantity: addon.quantity,
            displayTotalPrice: addon.totalPrice
          });
          
          console.log(`✓ Addon fixo "${addon.name}": quantidade ${addon.quantity} × preço original = R$ ${addon.totalPrice}`);
        }
      });
    }
    
    return addonDisplayValues;
  };

  const correctedAddons = calculateAddonDisplayValues();

  // Calcular o valor final correto baseado nos addons corrigidos
  const calculateCorrectFinalValue = () => {
    let finalValue = newPlan.baseValue || 0;
    
    correctedAddons.forEach(addon => {
      finalValue += addon.displayTotalPrice;
    });
    
    console.log('💰 Valor final recalculado:', finalValue);
    return finalValue;
  };

  const correctFinalValue = calculateCorrectFinalValue();

  // Calcular a diferença de valores
  const valueDifference = correctFinalValue - (currentPlan.monthlyValue || 0);
  const isUpgrade = valueDifference > 0;
  const isDowngrade = valueDifference < 0;

  // Log para verificar os valores finais que serão exibidos
  console.log('📊 VALORES FINAIS PARA EXIBIÇÃO:');
  console.log('Funcionários (novo plano):', newTotalEmployees);
  console.log('CNPJs (novo plano):', newTotalCnpjs);
  console.log('Valor mensal do novo plano:', newPlan.monthlyValue);
  console.log('Valor final correto:', correctFinalValue);
  console.log('Addons corrigidos:', correctedAddons);

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
          🧮 Demonstrativo de Cálculo
        </h3>
        <p className="text-sm text-green-700 mb-4">
          Análise detalhada da mudança de plano para apresentação ao contratante
        </p>

        {/* Análise Temporal */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            🕐 Análise Temporal
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Data da mudança:</span>
              <div className="font-medium text-blue-600">
                {formatDateToBrazilian(details.changeDate)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Término do contrato atual:</span>
              <div className="font-medium">
                {contractData?.renewal_date ? formatDateToBrazilian(contractData.renewal_date) : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Tempo restante:</span>
              <div className="font-medium text-orange-600">
                {remainingDays > 0 ? (
                  <>
                    {remainingMonths} meses e {remainingDays % 30} dias
                    <div className="text-xs text-gray-500">({remainingDays} dias totais)</div>
                  </>
                ) : (
                  <span className="text-red-600">Contrato vencido</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comparação de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Plano Atual */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-600 mb-3">Plano Atual</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nome do plano:</span>
                <span className="font-medium">{currentPlan.planName || 'Plano atual'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor mensal:</span>
                <span className="font-medium">{formatCurrency(currentPlan.monthlyValue || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Funcionários:</span>
                <span className="font-medium">{currentPlan.employeeCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CNPJs:</span>
                <span className="font-medium text-blue-600">{currentPlan.cnpjCount || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-medium">{formatPlanType(currentPlan.planType || 'mensal')}</span>
              </div>
              {currentPlan.range && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Faixa:</span>
                  <span className="font-medium text-xs">{currentPlan.range}</span>
                </div>
              )}
            </div>
          </div>

          {/* Novo Plano */}
          <div className="bg-white border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-600 mb-3">Novo Plano</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nome do plano:</span>
                <span className="font-medium text-green-600">{newPlan.selectedPlan?.name || 'Novo plano'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor base:</span>
                <span className="font-medium text-green-600">{formatCurrency(newPlan.baseValue || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor final:</span>
                <span className="font-bold text-green-600">{formatCurrency(correctFinalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Funcionários:</span>
                <span className="font-medium text-green-600">{newTotalEmployees}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CNPJs:</span>
                <span className="font-medium text-green-600">{newTotalCnpjs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-medium">{formatPlanType(newPlan.planType || 'mensal')}</span>
              </div>
              {newPlan.selectedPlan?.employee_range && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Faixa:</span>
                  <span className="font-medium text-xs">{newPlan.selectedPlan.employee_range}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparação de Valores */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            💰 Análise Financeira
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <span className="text-gray-600">Valor Anterior:</span>
              <div className="text-lg font-semibold">{formatCurrency(currentPlan.monthlyValue || 0)}</div>
            </div>
            <div className="text-center">
              <span className="text-gray-600">Novo Valor:</span>
              <div className="text-lg font-semibold text-green-600">{formatCurrency(correctFinalValue)}</div>
            </div>
            <div className="text-center">
              <span className="text-gray-600">Diferença:</span>
              <div className={`text-lg font-semibold ${
                isUpgrade ? 'text-red-600' : isDowngrade ? 'text-green-600' : 'text-gray-600'
              }`}>
                {isUpgrade && '+'}
                {formatCurrency(Math.abs(valueDifference))}
                <div className="text-xs font-normal">
                  {isUpgrade ? '(Upgrade)' : isDowngrade ? '(Economia)' : '(Sem alteração)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhamento do Cálculo */}
        <div className="bg-white rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            📋 Detalhamento do Cálculo
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Valor base do plano ({newPlan.selectedPlan?.name || 'Novo plano'}):</span>
              <span className="font-medium">{formatCurrency(newPlan.baseValue || 0)}</span>
            </div>
            
            {correctedAddons.length > 0 && (
              <>
                <div className="border-t pt-2">
                  <span className="text-gray-700 font-medium">Adicionais contratados:</span>
                </div>
                {correctedAddons.map((addon: any, index: number) => (
                  <div key={index} className="flex justify-between text-blue-600 pl-4">
                    <span>+ {addon.name}</span>
                    <div className="text-right">
                      <div>{typeof addon.displayQuantity === 'string' ? addon.displayQuantity : `${addon.displayQuantity} unidades`}</div>
                      <div className="font-medium">+{formatCurrency(addon.displayTotalPrice)}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>VALOR TOTAL MENSAL:</span>
              <span className="text-green-600">{formatCurrency(correctFinalValue)}</span>
            </div>

            {/* Informações de Desconto por Tipo de Plano */}
            {newPlan.planType !== 'mensal' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm text-blue-800 font-medium mb-2">
                  Informações sobre o plano {formatPlanType(newPlan.planType)}:
                </div>
                {newPlan.planType === 'semestral' && (
                  <div className="text-xs text-blue-700">
                    • Desconto aplicado no pagamento semestral<br/>
                    • Valor total: {formatCurrency(correctFinalValue * 6)}<br/>
                    • Economia anual: Consulte condições especiais
                  </div>
                )}
                {newPlan.planType === 'anual' && (
                  <div className="text-xs text-blue-700">
                    • Desconto aplicado no pagamento anual<br/>
                    • Valor total: {formatCurrency(correctFinalValue * 12)}<br/>
                    • Maior economia disponível
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Informações Contratuais */}
        <div className="bg-white rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            📄 Informações Contratuais
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Vigência da alteração:</span>
              <div className="font-medium">A partir de {formatDateToBrazilian(details.changeDate)}</div>
            </div>
            <div>
              <span className="text-gray-600">Próxima renovação:</span>
              <div className="font-medium">
                {contractData?.renewal_date ? formatDateToBrazilian(contractData.renewal_date) : 'A definir'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Forma de pagamento:</span>
              <div className="font-medium">Conforme contrato original</div>
            </div>
            <div>
              <span className="text-gray-600">Reajuste:</span>
              <div className="font-medium">Conforme cláusulas contratuais</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanChangeDetails;
