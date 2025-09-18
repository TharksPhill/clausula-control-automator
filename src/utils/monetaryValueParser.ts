// Função para formatar valores monetários com período correto
export const formatMonetaryValueWithPeriod = (value: number, planType?: string): string => {
  const formattedValue = formatMonetaryValue(value);
  
  switch (planType) {
    case 'anual':
      return `${formattedValue}/ano`;
    case 'semestral':
      return `${formattedValue}/semestre`;
    case 'mensal':
    default:
      return `${formattedValue}/mês`;
  }
};

// Função para obter o sufixo do período
export const getPeriodSuffix = (planType?: string): string => {
  switch (planType) {
    case 'anual':
      return '/ano';
    case 'semestral':
      return '/semestre';
    case 'mensal':
    default:
      return '/mês';
  }
};

// Função para determinar o tipo de plano mais comum em um conjunto de dados
export const getMostCommonPlanType = (planTypes: { [key: string]: number }): string => {
  let maxCount = 0;
  let mostCommon = 'mensal';
  
  Object.entries(planTypes).forEach(([planType, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = planType;
    }
  });
  
  return mostCommon;
};

export const parseMonetaryValue = (value: string | number): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (!value || typeof value !== 'string') {
    console.log('[PARSE] ⚠️ Valor inválido:', value);
    return 0;
  }

  console.log(`[PARSE] 🔍 Valor original: "${value}"`);

  // Limpar a string removendo símbolos de moeda e espaços
  let cleanValue = value.replace(/[R$\s]/g, '').trim();
  console.log(`[PARSE] Após remover R$ e espaços: "${cleanValue}"`);

  // Se não tem conteúdo, retorna 0
  if (!cleanValue) {
    console.log('[PARSE] ⚠️ String vazia após limpeza');
    return 0;
  }

  // Verificar se é formato brasileiro (vírgula como decimal)
  if (cleanValue.includes(',')) {
    // Remover pontos (separadores de milhares) e substituir vírgula por ponto
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    console.log(`[PARSE] ✅ Formato brasileiro: "${value}" = ${cleanValue}`);
  }

  const result = parseFloat(cleanValue) || 0;
  console.log(`[PARSE] 🎯 RESULTADO FINAL: "${value}" → ${result}`);
  
  return result;
};

export const formatMonetaryValue = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const getLatestContractValue = (contract: any): number => {
  console.log(`[LATEST_VALUE] 🔍 Buscando valor mais recente para contrato ${contract.id}`);
  console.log(`[LATEST_VALUE] Valor original: "${contract.monthly_value}"`);
  
  // Verificar se há mudanças de plano
  if (contract.plan_changes && contract.plan_changes.length > 0) {
    // Ordenar por data de solicitação (mais recente primeiro)
    const sortedChanges = contract.plan_changes.sort((a: any, b: any) => 
      new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
    );
    
    // Pegar a mudança mais recente aprovada
    const latestApprovedChange = sortedChanges.find((change: any) => change.status === 'approved');
    
    if (latestApprovedChange) {
      const latestValue = parseMonetaryValue(latestApprovedChange.requested_monthly_value);
      console.log(`[LATEST_VALUE] 🔄 Mudança aprovada encontrada: R$ ${latestApprovedChange.requested_monthly_value}`);
      console.log(`[LATEST_VALUE] 🎯 Usando valor da mudança: ${latestValue}`);
      return latestValue;
    }
  }
  
  // Se não há mudanças aprovadas, usar valor original
  const originalValue = parseMonetaryValue(contract.monthly_value);
  console.log(`[LATEST_VALUE] 🎯 Nenhuma mudança encontrada, usando valor original: R$ ${contract.monthly_value}`);
  return originalValue;
};

export const convertToMonthlyEquivalent = (value: number, planType: string): number => {
  console.log(`[MONTHLY_CONVERT] 🔄 Convertendo ${value} de ${planType} para mensal`);
  
  switch (planType) {
    case 'anual':
      const monthlyFromAnnual = value / 12;
      console.log(`[MONTHLY_CONVERT] 📅 Anual → Mensal: ${value} ÷ 12 = ${monthlyFromAnnual}`);
      return monthlyFromAnnual;
    case 'semestral':
      const monthlyFromSemestral = value / 6;
      console.log(`[MONTHLY_CONVERT] 📅 Semestral → Mensal: ${value} ÷ 6 = ${monthlyFromSemestral}`);
      return monthlyFromSemestral;
    case 'mensal':
    default:
      console.log(`[MONTHLY_CONVERT] 📅 Já é mensal: ${value}`);
      return value;
  }
};
