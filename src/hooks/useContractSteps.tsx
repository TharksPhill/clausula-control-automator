
import { useState, useMemo } from "react";
import { useContract } from "@/context/ContractContext";

export const useContractSteps = () => {
  const { contractData } = useContract();
  const [currentStep, setCurrentStep] = useState(0);

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Contratantes - apenas dados básicos da empresa
        return contractData.contractors.length > 0 && 
               contractData.contractors.some(contractor => 
                 contractor.name?.trim() && 
                 contractor.cnpj?.trim()
               );
      
      case 1: // Responsáveis - dados dos responsáveis
        return contractData.contractors.length > 0 &&
               contractData.contractors.every(contractor => 
                 contractor.responsibleName?.trim() && 
                 contractor.responsibleCpf?.trim()
               );
      
      case 2: // Serviço
        return !!(
          contractData.employeeCount?.toString().trim() &&
          contractData.trialDays?.toString().trim() &&
          contractData.startDate?.trim() &&
          contractData.renewalDate?.trim() &&
          contractData.monthlyValue?.toString().trim() &&
          contractData.paymentDay?.toString().trim() &&
          contractData.paymentStartDate?.trim()
        );
      
      default:
        return false;
    }
  };

  const steps = useMemo(() => [
    {
      id: "contractors",
      title: "Contratantes",
      description: "Dados das empresas",
      isCompleted: validateStep(0),
      isAccessible: true
    },
    {
      id: "responsible",
      title: "Responsáveis",
      description: "Dados dos responsáveis",
      isCompleted: validateStep(1),
      isAccessible: validateStep(0)
    },
    {
      id: "service",
      title: "Serviço",
      description: "Configurações do serviço",
      isCompleted: validateStep(2),
      isAccessible: validateStep(0) && validateStep(1)
    },
    {
      id: "technical-visit",
      title: "Visita Técnica",
      description: "Cálculo de visita técnica",
      isCompleted: true, // Always accessible, optional step
      isAccessible: validateStep(0) && validateStep(1) && validateStep(2)
    }
  ], [contractData]);

  const canGoToStep = (stepIndex: number): boolean => {
    return steps[stepIndex]?.isAccessible || false;
  };

  const goToStep = (stepIndex: number) => {
    if (canGoToStep(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  const nextStep = () => {
    const nextStepIndex = currentStep + 1;
    if (nextStepIndex < steps.length && canGoToStep(nextStepIndex)) {
      setCurrentStep(nextStepIndex);
    }
  };

  const prevStep = () => {
    const prevStepIndex = currentStep - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(prevStepIndex);
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const canProceedToNext = validateStep(currentStep);
  const allStepsCompleted = steps.every(step => step.isCompleted);

  return {
    steps,
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    canProceedToNext,
    allStepsCompleted,
    validateStep
  };
};
