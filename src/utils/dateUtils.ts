
// Utilitários centralizados para formatação de datas
export const formatDateForInput = (dateStr: string): string => {
  console.log("formatDateForInput - entrada:", dateStr);
  
  if (!dateStr || dateStr.trim() === "" || dateStr === "NaN/NaN/NaN") {
    console.log("formatDateForInput - string vazia ou inválida, retornando vazio");
    return "";
  }
  
  // Se já está no formato yyyy-mm-dd, retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.log("formatDateForInput - já no formato correto:", dateStr);
    return dateStr;
  }
  
  // Se está no formato dd/mm/yyyy, converte para yyyy-mm-dd
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    
    const result = `${year}-${month}-${day}`;
    console.log("formatDateForInput - convertido:", result);
    return result;
  }
  
  console.log("formatDateForInput - formato não reconhecido, retornando vazio");
  return "";
};

export const formatDateToBrazilian = (dateStr: string): string => {
  console.log("formatDateToBrazilian - entrada:", dateStr);
  
  if (!dateStr || dateStr.trim() === "" || dateStr === "NaN/NaN/NaN") {
    console.log("formatDateToBrazilian - string vazia ou inválida, retornando vazio");
    return "";
  }
  
  // Se já está no formato dd/mm/yyyy, retorna como está
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    console.log("formatDateToBrazilian - já no formato brasileiro:", dateStr);
    return dateStr;
  }
  
  // Se está no formato yyyy-mm-dd, converte para dd/mm/yyyy
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    
    const result = `${day}/${month}/${year}`;
    console.log("formatDateToBrazilian - convertido:", result);
    return result;
  }
  
  console.log("formatDateToBrazilian - formato não reconhecido, retornando vazio");
  return "";
};

export const calculatePaymentDate = (startDate: string, trialDays: string): string => {
  console.log("calculatePaymentDate - startDate:", startDate, "trialDays:", trialDays);
  
  // Validações básicas
  if (!startDate || startDate.trim() === "" || startDate === "NaN/NaN/NaN") {
    console.log("calculatePaymentDate - startDate inválida");
    return "";
  }
  
  if (!trialDays || trialDays.trim() === "") {
    console.log("calculatePaymentDate - trialDays vazio");
    return "";
  }
  
  const trial = parseInt(trialDays.replace(/\D/g, ''), 10);
  if (isNaN(trial) || trial <= 0) {
    console.log("calculatePaymentDate - trial inválido:", trial);
    return "";
  }
  
  try {
    // Se a data está no formato yyyy-mm-dd (input date)
    let date: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      date = new Date(startDate + 'T00:00:00');
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(startDate)) {
      // Se está no formato dd/mm/yyyy
      const parts = startDate.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      date = new Date(year, month - 1, day);
    } else {
      console.log("calculatePaymentDate - formato de data inválido:", startDate);
      return "";
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.log("calculatePaymentDate - data inválida após criação");
      return "";
    }
    
    // Adicionar os dias de teste
    date.setDate(date.getDate() + trial);
    
    // Retornar no formato yyyy-mm-dd para input
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const result = `${year}-${month}-${day}`;
    console.log("calculatePaymentDate - resultado:", result);
    return result;
  } catch (error) {
    console.error("calculatePaymentDate - erro:", error);
    return "";
  }
};

export const calculateRenewalDate = (startDate: string, months: number = 12): string => {
  console.log("Calculando data de renovação:", { startDate, months });
  
  if (!startDate || startDate === "NaN/NaN/NaN") {
    console.log("Data de início inválida");
    return "";
  }
  
  try {
    let date: Date;
    
    // Se a data está no formato yyyy-mm-dd (input date)
    if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      date = new Date(startDate + 'T00:00:00');
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(startDate)) {
      // Se está no formato dd/mm/yyyy
      const parts = startDate.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      date = new Date(year, month - 1, day);
    } else {
      console.log("Formato de data inválido");
      return "";
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.log("Data inválida após criação");
      return "";
    }
    
    // Adicionar meses
    date.setMonth(date.getMonth() + months);
    
    // Retornar no formato yyyy-mm-dd para input
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const renewalDate = `${year}-${month}-${day}`;
    console.log("Data de renovação calculada:", renewalDate);
    
    return renewalDate;
  } catch (error) {
    console.error("Erro ao calcular data de renovação:", error);
    return "";
  }
};

// Nova função para calcular renovação baseada na data de início dos pagamentos
export const calculateRenewalFromPaymentStart = (paymentStartDate: string, months: number = 12): string => {
  console.log("Calculando data de renovação baseada no início dos pagamentos:", { paymentStartDate, months });
  
  if (!paymentStartDate || paymentStartDate === "NaN/NaN/NaN") {
    console.log("Data de início dos pagamentos inválida");
    return "";
  }
  
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
      console.log("Formato de data inválido");
      return "";
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.log("Data inválida após criação");
      return "";
    }
    
    // Adicionar meses
    date.setMonth(date.getMonth() + months);
    
    // Retornar no formato yyyy-mm-dd para input
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const renewalDate = `${year}-${month}-${day}`;
    console.log("Data de renovação calculada baseada no pagamento:", renewalDate);
    
    return renewalDate;
  } catch (error) {
    console.error("Erro ao calcular data de renovação baseada no pagamento:", error);
    return "";
  }
};

// Nova função para calcular data de renovação baseada na data de reajuste
export const calculateNextRenewalFromAdjustment = (
  startDate: string, 
  adjustmentDate: string,
  months: number = 12
): string => {
  console.log("Calculando próxima renovação após reajuste:", { startDate, adjustmentDate, months });
  
  if (!startDate || !adjustmentDate) {
    console.log("Datas inválidas");
    return "";
  }
  
  try {
    // Converter data de início
    let startDateTime: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      startDateTime = new Date(startDate + 'T00:00:00');
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(startDate)) {
      const parts = startDate.split('/');
      startDateTime = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      console.log("Formato de data de início inválido");
      return "";
    }
    
    // Converter data de reajuste
    const adjustmentDateTime = new Date(adjustmentDate);
    
    if (isNaN(startDateTime.getTime()) || isNaN(adjustmentDateTime.getTime())) {
      console.log("Datas inválidas após conversão");
      return "";
    }
    
    // Calcular quantos anos completos se passaram desde o início
    const yearsPassed = adjustmentDateTime.getFullYear() - startDateTime.getFullYear();
    
    // Determinar a próxima data de renovação (aniversário do contrato)
    let nextRenewalYear = startDateTime.getFullYear() + yearsPassed + 1;
    
    // Se o reajuste foi feito depois do aniversário do contrato no ano atual,
    // a próxima renovação é no próximo ano
    const currentYearAnniversary = new Date(
      startDateTime.getFullYear() + yearsPassed, 
      startDateTime.getMonth(), 
      startDateTime.getDate()
    );
    
    if (adjustmentDateTime >= currentYearAnniversary) {
      nextRenewalYear = startDateTime.getFullYear() + yearsPassed + 1;
    } else {
      nextRenewalYear = startDateTime.getFullYear() + yearsPassed;
    }
    
    const nextRenewal = new Date(nextRenewalYear, startDateTime.getMonth(), startDateTime.getDate());
    const renewalDate = `${nextRenewal.getFullYear()}-${(nextRenewal.getMonth() + 1).toString().padStart(2, '0')}-${nextRenewal.getDate().toString().padStart(2, '0')}`;
    
    console.log(`Próxima renovação calculada: ${renewalDate} (Início: ${startDate}, Reajuste: ${adjustmentDate})`);
    
    return renewalDate;
  } catch (error) {
    console.error("Erro ao calcular próxima renovação:", error);
    return "";
  }
};

// Função para calcular valor proporcional baseado na data de mudança de plano
export const calculateProportionalValue = (
  changeDate: string,
  paymentDay: number,
  oldValue: number,
  newValue: number
): { proportionalOldValue: number; proportionalNewValue: number; totalValue: number; daysOldPlan: number; daysNewPlan: number; isChargeForNextMonth: boolean } => {
  console.log("Calculando valor proporcional:", { changeDate, paymentDay, oldValue, newValue });
  
  if (!changeDate || paymentDay < 1 || paymentDay > 31) {
    console.log("Parâmetros inválidos");
    return { proportionalOldValue: oldValue, proportionalNewValue: 0, totalValue: oldValue, daysOldPlan: 30, daysNewPlan: 0, isChargeForNextMonth: false };
  }
  
  try {
    const changeDateObj = new Date(changeDate);
    if (isNaN(changeDateObj.getTime())) {
      console.log("Data de mudança inválida");
      return { proportionalOldValue: oldValue, proportionalNewValue: 0, totalValue: oldValue, daysOldPlan: 30, daysNewPlan: 0, isChargeForNextMonth: false };
    }
    
    const changeDay = changeDateObj.getDate();
    const changeMonth = changeDateObj.getMonth();
    const changeYear = changeDateObj.getFullYear();
    
    // Determinar o último dia de pagamento (início do período atual)
    let lastPaymentDate: Date;
    let nextPaymentDate: Date;
    
    if (changeDay >= paymentDay) {
      // A mudança ocorreu depois do dia de pagamento do mês atual
      lastPaymentDate = new Date(changeYear, changeMonth, paymentDay);
      nextPaymentDate = new Date(changeYear, changeMonth + 1, paymentDay);
    } else {
      // A mudança ocorreu antes do dia de pagamento do mês atual
      lastPaymentDate = new Date(changeYear, changeMonth - 1, paymentDay);
      nextPaymentDate = new Date(changeYear, changeMonth, paymentDay);
    }
    
    // O período de cobrança inicia no dia seguinte ao pagamento
    const billingStartDate = new Date(lastPaymentDate);
    billingStartDate.setDate(billingStartDate.getDate() + 1);
    
    // Calcular os dias do plano antigo (desde o início do período de cobrança até o dia anterior à mudança)
    const daysOldPlan = Math.max(0, Math.ceil((changeDateObj.getTime() - billingStartDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calcular os dias do plano novo (desde a mudança até o próximo pagamento, incluindo o dia da mudança)
    const daysNewPlan = Math.max(0, Math.ceil((nextPaymentDate.getTime() - changeDateObj.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Assumir 30 dias no mês para cálculo proporcional
    const daysInMonth = 30;
    
    // Calcular valores proporcionais
    const proportionalOldValue = (oldValue * daysOldPlan) / daysInMonth;
    const proportionalNewValue = (newValue * daysNewPlan) / daysInMonth;
    const totalValue = proportionalOldValue + proportionalNewValue;
    
  // Determinar se a cobrança é para este mês ou próximo mês
  const today = new Date();
  const currentMonth = today.getMonth();
  const nextPaymentMonth = nextPaymentDate.getMonth();
  const isChargeForNextMonth = nextPaymentMonth > currentMonth || nextPaymentDate.getFullYear() > today.getFullYear();
  
  console.log("Resultado do cálculo proporcional:", {
    daysOldPlan,
    daysNewPlan,
    proportionalOldValue,
    proportionalNewValue,
    totalValue,
    lastPaymentDate: lastPaymentDate.toISOString().split('T')[0],
    nextPaymentDate: nextPaymentDate.toISOString().split('T')[0],
    isChargeForNextMonth
  });
  
  return {
    proportionalOldValue,
    proportionalNewValue,
    totalValue,
    daysOldPlan,
    daysNewPlan,
    isChargeForNextMonth
  };
  } catch (error) {
    console.error("Erro ao calcular valor proporcional:", error);
    return { proportionalOldValue: oldValue, proportionalNewValue: 0, totalValue: oldValue, daysOldPlan: 30, daysNewPlan: 0, isChargeForNextMonth: false };
  }
};

// Função específica para calcular valor proporcional para planos semestrais e anuais
export const calculateSemestralAnnualProportionalValue = (
  changeDate: string,
  contractStartDate: string,
  renewalDate: string,
  oldValue: number,
  newValue: number,
  planType: 'semestral' | 'anual'
): { 
  proportionalDifference: number; 
  remainingDays: number; 
  totalPeriodDays: number;
  alreadyPaidValue: number;
  newPlanProportionalValue: number;
  description: string;
} => {
  console.log("=== CÁLCULO PROPORCIONAL SEMESTRAL/ANUAL ===");
  console.log({ changeDate, contractStartDate, renewalDate, oldValue, newValue, planType });
  
  try {
    // Parse das datas
    const changeDateObj = new Date(changeDate);
    let renewalDateObj: Date;
    
    // Parsear data de renovação (pode estar em formato DD/MM/YYYY ou YYYY-MM-DD)
    if (renewalDate.includes('/')) {
      const parts = renewalDate.split('/');
      renewalDateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      renewalDateObj = new Date(renewalDate);
    }
    
    if (isNaN(changeDateObj.getTime()) || isNaN(renewalDateObj.getTime())) {
      throw new Error("Datas inválidas");
    }
    
    // Calcular dias restantes até a renovação
    const timeDiff = renewalDateObj.getTime() - changeDateObj.getTime();
    const remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    
    // Calcular total de dias do período (6 meses = 183 dias, 12 meses = 365 dias)
    const totalPeriodDays = planType === 'semestral' ? 183 : 365;
    
    // Calcular valor diário de cada plano
    const dailyOldPlanValue = oldValue / totalPeriodDays;
    const dailyNewPlanValue = newValue / totalPeriodDays;
    
    // Calcular a diferença diária entre os planos
    const dailyDifference = dailyNewPlanValue - dailyOldPlanValue;
    
    // O valor a ser cobrado é apenas a diferença pelos dias restantes
    const proportionalDifference = dailyDifference * remainingDays;
    
    // Valor proporcional do novo plano para os dias restantes
    const newPlanProportionalValue = dailyNewPlanValue * remainingDays;
    
    console.log("Resultado do cálculo:", {
      remainingDays,
      totalPeriodDays,
      dailyOldPlanValue,
      dailyNewPlanValue,
      dailyDifference,
      newPlanProportionalValue,
      proportionalDifference
    });
    
    const description = `Cliente já pagou R$ ${oldValue.toFixed(2).replace('.', ',')} do plano anterior. ` +
      `Diferença diária: R$ ${dailyDifference.toFixed(4).replace('.', ',')}. ` +
      `Deve pagar R$ ${proportionalDifference.toFixed(2).replace('.', ',')} pela diferença nos ${remainingDays} dias restantes até a próxima renovação.`;
    
    return {
      proportionalDifference,
      remainingDays,
      totalPeriodDays,
      alreadyPaidValue: oldValue,
      newPlanProportionalValue,
      description
    };
    
  } catch (error) {
    console.error("Erro ao calcular valor proporcional semestral/anual:", error);
    return {
      proportionalDifference: newValue - oldValue,
      remainingDays: 0,
      totalPeriodDays: planType === 'semestral' ? 183 : 365,
      alreadyPaidValue: oldValue,
      newPlanProportionalValue: newValue,
      description: "Erro no cálculo proporcional"
    };
  }
};
