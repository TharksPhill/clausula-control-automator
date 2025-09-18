
// Utilitários para formatação de cláusulas do contrato

export const getClause411Text = (planType: string): string => {
  const periodicityText = getPeriodicityText(planType);
  
  return `Caso **A CONTRATANTE** deseje adicionar CNPJs extras além dos incluídos no plano contratado, será cobrado o valor adicional de R$ 33,00 por CNPJ adicional, também proporcional à ${periodicityText}:`;
};

export const getPeriodicityText = (planType: string): string => {
  console.log("🔄 getPeriodicityText - planType:", planType);
  switch (planType) {
    case "semestral":
      return "semestralidade contratada";
    case "anual":
      return "anualidade contratada";
    default:
      return "mensalidade contratada";
  }
};

export const getPeriodicityAdverb = (planType: string): string => {
  console.log("🔄 getPeriodicityAdverb - planType:", planType);
  switch (planType) {
    case "semestral":
      return "semestralmente";
    case "anual":
      return "anualmente";
    default:
      return "mensalmente";
  }
};

export const getValueText = (planType: string): string => {
  console.log("🔄 getValueText - planType:", planType);
  switch (planType) {
    case "semestral":
      return "valor semestral";
    case "anual":
      return "valor anual";
    default:
      return "valor mensal";
  }
};

export const getPaymentTermText = (planType: string): string => {
  console.log("🔄 getPaymentTermText - planType:", planType);
  switch (planType) {
    case "semestral":
      return "semestralidade";
    case "anual":
      return "anuidade";
    default:
      return "mensalidade";
  }
};

export const getClause21Text = (planType: string): string => {
  console.log("🔄 getClause21Text - planType:", planType);
  const periodicityText = getPeriodicityText(planType);
  const periodicityAdverb = getPeriodicityAdverb(planType);
  
  return `O valor da prestação de serviços será pago ${periodicityAdverb}, conforme ${periodicityText} estabelecida neste contrato.`;
};

export const getClause71Text = (planType: string): string => {
  console.log("🔄 getClause71Text - planType:", planType);
  const periodicityText = getPeriodicityText(planType);
  
  return `Este contrato terá vigência por 12 (doze) meses, sendo renovado automaticamente por igual período, salvo manifestação contrária de qualquer das partes com antecedência mínima de 30 (trinta) dias do término da ${periodicityText}.`;
};

export const formatContractant = (text: string): string => {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

export const getTechnicalVisitText = (visitCost: number = 250, kmCost: number = 1): string => {
  const visitValue = visitCost.toFixed(2).replace('.', ',');
  const kmValue = kmCost.toFixed(2).replace('.', ',');
  
  return `mediante pagamento adicional de R$ ${visitValue} além de R$ ${kmValue} por quilômetro rodado considerando o endereço de saida da **CONTRATADA**.`;
};

export const getTechnicalVisitDetailText = (visitCost: number = 250, kmCost: number = 1): string => {
  const visitValue = visitCost.toFixed(2).replace('.', ',');
  const kmValue = kmCost.toFixed(2).replace('.', ',');
  
  return `estarão sujeitos a um custo adicional fixo de R$ ${visitValue}, que incluirá um valor base e uma taxa de R$ ${kmValue} por quilômetro rodado fora da cidade`;
};

export const getClause47Text = (planType: string): string => {
  console.log("🔄 getClause47Text - planType:", planType);
  
  if (planType === "semestral") {
    return "Em qualquer caso de alteração de plano, **A CONTRATANTE** deverá pagar a diferença do plano novo ou inclusão de adicionais no ato da autorização para mudança de plano ou adicionais, sendo calculada proporcionalmente à vigência restante do contrato semestral. Os novos valores serão aplicados imediatamente após a formalização do aditivo contratual.";
  } else if (planType === "anual") {
    return "Em qualquer caso de alteração de plano, **A CONTRATANTE** deverá pagar a diferença do plano novo ou inclusão de adicionais no ato da autorização para mudança de plano ou adicionais, sendo calculada proporcionalmente à vigência restante do contrato anual. Os novos valores serão aplicados imediatamente após a formalização do aditivo contratual.";
  } else {
    return "Em qualquer caso de alteração de plano, os novos valores somente serão aplicados a partir do mês subsequente à formalização do aditivo contratual por ambas as partes, salvo acordo contrário expressamente firmado entre as partes, incluindo os ajustes referentes à inclusão de novos funcionários e/ou CNPJs.";
  }
};
