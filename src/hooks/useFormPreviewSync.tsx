import { useRef, useCallback } from "react";
import { useContract } from "@/context/ContractContext";

// Mapeamento de campos para seções da pré-visualização
const FIELD_TO_SECTION_MAP: Record<string, string> = {
  // Informações básicas do contrato
  "contractNumber": "contract-header",
  "startDate": "trial-period-clause",
  "renewalDate": "renewal-date-clause", 
  "paymentStartDate": "payment-date-clause",
  "paymentDay": "payment-date-clause",
  "monthlyValue": "monthly-value-clause",
  "planType": "monthly-value-clause",
  "semestralDiscount": "monthly-value-clause",
  "anualDiscount": "monthly-value-clause",
  "employeeCount": "employee-count-clause",
  "cnpjCount": "employee-count-clause",
  "trialDays": "trial-period-clause",
  
  // Dados dos contratantes  
  "contractor-name": "parties-section",
  "contractor-cnpj": "parties-section",
  "contractor-city": "parties-section",
  "contractor-state": "parties-section", 
  "contractor-address": "parties-section",
  "contractor-email": "parties-section",
  
  // Responsáveis
  "responsible-name": "parties-section",
  "responsible-email": "parties-section",
  "responsible-phone": "parties-section",
  
  // Informações de pagamento
  "payment-terms": "monthly-payment-clause"
};

export const useFormPreviewSync = () => {
  const { setActiveClauseId } = useContract();
  
  const syncToPreview = useCallback((fieldName: string) => {
    // Mapeia o campo para a seção correspondente na pré-visualização
    const sectionId = FIELD_TO_SECTION_MAP[fieldName];
    
    if (sectionId) {
      console.log(`🔄 Sincronizando campo "${fieldName}" para seção "${sectionId}"`);
      setActiveClauseId(sectionId);
    } else {
      console.log(`⚠️ Campo "${fieldName}" não mapeado para nenhuma seção`);
    }
  }, [setActiveClauseId]);

  const createFieldHandler = useCallback((fieldName: string) => {
    return () => syncToPreview(fieldName);
  }, [syncToPreview]);

  return {
    syncToPreview,
    createFieldHandler
  };
};