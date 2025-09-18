import React, { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronUp, Settings, Plus, Pencil, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinancialCategoriesBySection } from "@/hooks/useFinancialCategories";
import { useMonthlyFinancialCosts } from "@/hooks/useMonthlyFinancialCosts";
import { useMonthlyFinancialCostsBySection } from "@/hooks/useMonthlyFinancialCostsBySection";
import { MonthlyFinancialCostEditor } from "@/components/MonthlyFinancialCostEditor";
import { SectionFinancialCostEditor } from "@/components/SectionFinancialCostEditor";
import { SectionCategoryManager } from "@/components/SectionCategoryManager";
import { FinancialCellLoader } from "@/components/FinancialCellLoader";
import { COLOR_SCHEMES, type ColorScheme, type FinancialSectionData } from "@/types/financial-sections";
import { useContracts } from "@/hooks/useContracts";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";
import ContractSelectionModal from "@/components/ContractSelectionModal";
import ContractMonthlyRevenueEditor from "@/components/ContractMonthlyRevenueEditor";
import { useContractMonthlyRevenueOverrides, useContractMonthlyRevenueOverridesUpToYear } from "@/hooks/useContractMonthlyRevenueOverrides";
import { useProfitAnalysis } from "@/hooks/useProfitAnalysis";
import { usePlans } from "@/hooks/usePlans";
import { usePlanAddons } from "@/hooks/usePlanAddons";
import { useContractLicenseCosts } from "@/hooks/useContractLicenseCosts";
import ContractorDetailsModal from "@/components/ContractorDetailsModal";
import { useCosts } from "@/hooks/useCosts";
interface GenericFinancialSectionProps {
  sectionId: string;
  title: string;
  colorScheme: ColorScheme;
  selectedYear: number;
}

const GenericFinancialSection: React.FC<GenericFinancialSectionProps> = ({
  sectionId,
  title,
  colorScheme,
  selectedYear,
}) => {
  const [loadingCells, setLoadingCells] = useState<Record<string, boolean>>({});
  // Utilitário: parse de datas em formatos 'dd/mm/yyyy' e 'yyyy-mm-dd'
  // Deve estar no topo para evitar erros de inicialização
  const parseDateString = useCallback((dateStr?: string): Date | null => {
    if (!dateStr) return null;
    try {
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      }
      if (dateStr.includes('-')) {
        return new Date(dateStr);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCost, setEditingCost] = useState<{
    categoryId: string;
    monthIndex: number;
    currentValue: number;
  } | null>(null);
  const [editingRevenue, setEditingRevenue] = useState<{
    contractId: string;
    monthIndex: number;
    currentValue: number;
  } | null>(null);
  const [selectedContractIdForDetails, setSelectedContractIdForDetails] = useState<string | null>(null);

  const colors = COLOR_SCHEMES[colorScheme];
  
  // Modo especial para Faturamento RHID (por contrato)
  const isRhidSection = useMemo(() => {
    const t = title.toLowerCase();
    return t.includes("faturamento") && t.includes("rhid");
  }, [title]);

  // Modo especial para Custos de Licença (por contrato)
  const isLicenseCostSection = useMemo(() => {
    const t = title.toLowerCase();
    return t.includes("custo") && (t.includes("licença") || t.includes("licenca"));
  }, [title]);

  // Modo especial para Impostos (por contrato)
  const isTaxSection = useMemo(() => {
    const t = title.toLowerCase();
    return t.includes("imposto") || t.includes("tax");
  }, [title]);

  // Modo especial para Boletos RHID (por contrato)
  const isBoletoSection = useMemo(() => {
    const t = title.toLowerCase();
    return t.includes("boleto") && t.includes("rhid");
  }, [title]);

  // Modo especial para Rateio de Custo (por contrato)
  const isCostAllocationSection = useMemo(() => {
    const t = title.toLowerCase();
    return t.includes("rateio") && (t.includes("custo") || t.includes("custos"));
  }, [title]);
  
  const { data: categories = [], isLoading: categoriesLoading } = useFinancialCategoriesBySection(sectionId);
  
  // Use section-specific hook for better performance with large datasets
  const isSpecialSection = isRhidSection || isLicenseCostSection || isTaxSection || isBoletoSection || isCostAllocationSection;
  
  // Optimização: carregamento condicional de dados
  const { data: sectionCosts = [], isLoading: sectionCostsLoading } = useMonthlyFinancialCostsBySection(sectionId, selectedYear);
  
  const { data: allCosts = [], isLoading: allCostsLoading } = useMonthlyFinancialCosts(selectedYear);
  
  // Use section-specific costs for regular sections, all costs for special sections
  const costs = isSpecialSection ? allCosts : sectionCosts;
  const costsLoading = isSpecialSection ? allCostsLoading : sectionCostsLoading;
  
  const { data: revenueOverrides = [], isLoading: revenueLoading } = useContractMonthlyRevenueOverridesUpToYear(selectedYear);
  
  const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  
  // Taxa de imposto global configurada (buscar de configurações de custos)
  const { companyCosts } = useCosts();
  const taxPercentage = useMemo(() => {
    if (!companyCosts) return 0;
    const taxCosts = companyCosts.filter((cost: any) => cost.is_active && cost.category === 'tax');
    
    const totalTaxPercentage = taxCosts.reduce((sum: number, cost: any) => {
      const percentageMatch = cost.description.match(/\((\d+(?:\.\d+)?)%\)/);
      if (percentageMatch) {
        return sum + parseFloat(percentageMatch[1]);
      }
      return sum;
    }, 0);
    
    return totalTaxPercentage;
  }, [companyCosts]);

  // Buscar dados do hook específico para custos de licença
  const { data: contractLicenseCostsData = [], isLoading: licenseCostsDataLoading } = useContractLicenseCosts();
  
  // Log apenas quando estamos na seção de custo de licença
  if (isLicenseCostSection) {
    console.log('🔍 contractLicenseCostsData do hook useContractLicenseCosts:', contractLicenseCostsData);
  }
  
  const licenseCostsLoading = licenseCostsDataLoading;
  
  // Estado de loading geral
  const isLoadingData = categoriesLoading || costsLoading || revenueLoading || licenseCostsLoading;
  
  // Debug específico para 2025
  React.useEffect(() => {
    if (selectedYear === 2025 && costs && !costsLoading) {
      console.log(`🔍 [GenericFinancialSection] Seção: ${title}, Ano: 2025`);
      console.log(`🔍 [GenericFinancialSection] Total de custos carregados:`, costs?.length || 0);
      
      if (costs) {
        const septDecCosts = costs.filter(c => c.month >= 9 && c.month <= 12);
        console.log(`🔍 [GenericFinancialSection] Custos Set-Dez:`, septDecCosts);
        
        if (septDecCosts.length === 0) {
          console.warn(`⚠️ [GenericFinancialSection] Nenhum custo Set-Dez encontrado para ${title}`);
        } else {
          const totalSeptDec = septDecCosts.reduce((sum, c) => sum + c.value, 0);
          console.log(`🔍 [GenericFinancialSection] Total Set-Dez: R$ ${totalSeptDec.toFixed(2)}`);
        }
      }
    }
  }, [selectedYear, costs, costsLoading, title]);

  const { contracts = [] } = useContracts();
  const { getEffectiveValueForContract } = useContractAdjustments();
  const [showContractSelector, setShowContractSelector] = useState(false);
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  
  // Processar custos de licença dos dados do hook específico
  const contractLicenseCosts = useMemo(() => {
    if (!isLicenseCostSection) return [];
    
    console.log("🔍 Processando custos de licença para contratos:", contractLicenseCostsData);
    
    // Usar os custos de licença do hook useContractLicenseCosts
    return contractLicenseCostsData.map(licenseCostData => {
      const contract = contracts.find(c => c.id === licenseCostData.contractId);
      if (!contract) return null;
      
      // Usar o custo de licença diretamente do hook
      const pureLicenseCost = licenseCostData.licenseCost || 0;
      
      console.log(`📊 Contrato ${licenseCostData.contractNumber}:`, {
        licenseCost: licenseCostData.licenseCost,
        employeeCount: licenseCostData.employeeCount,
        cnpjCount: licenseCostData.cnpjCount,
        exemptionMonths: licenseCostData.exemptionMonths,
        pureLicenseCost
      });
      
      // Parse contract start date
      const startDate = licenseCostData.startDate ? parseDateString(licenseCostData.startDate) : null;
      
      // Usar os meses de isenção do plano
      const exemptionMonths = licenseCostData.exemptionMonths || 0;
      
      const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => {
        const currentMonth = new Date(selectedYear, monthIndex, 1);
        const currentMonthEnd = new Date(selectedYear, monthIndex + 1, 0);
        
        console.log(`📅 Processando mês ${monthIndex + 1}/${selectedYear} para contrato ${licenseCostData.contractNumber}`);
        
        // Se não há data de início, não cobrar
        if (!startDate) {
          console.log(`❌ Mês ${monthIndex + 1}/${selectedYear} - Sem data de início para contrato ${licenseCostData.contractNumber}`);
          return 0;
        }
        
        console.log(`📊 Comparando datas - Mês fim: ${currentMonthEnd.toISOString()}, Contrato início: ${startDate.toISOString()}`);
        
        // Se o mês termina antes do início do contrato, não cobrar
        if (currentMonthEnd < startDate) {
          console.log(`⏰ Mês ${monthIndex + 1}/${selectedYear} - Contrato ${licenseCostData.contractNumber} ainda não iniciado`);
          return 0;
        }
        
        // Calcular quantos meses completos se passaram desde o início
        const monthsSinceStart = (currentMonth.getFullYear() - startDate.getFullYear()) * 12 
                                + (currentMonth.getMonth() - startDate.getMonth());
        
        console.log(`🔍 Meses desde início: ${monthsSinceStart}, Meses de isenção: ${exemptionMonths}`);
        
        // Se ainda está no período de isenção (contando meses completos), não há custo
        if (monthsSinceStart < exemptionMonths) {
          console.log(`🆓 Mês ${monthIndex + 1}/${selectedYear} em isenção para contrato ${licenseCostData.contractNumber} (mês ${monthsSinceStart + 1} de ${exemptionMonths})`);
          return 0;
        }
        
        // Verificar se o contrato tem data de encerramento
        if (licenseCostData.terminationDate) {
          const terminationDate = parseDateString(licenseCostData.terminationDate);
          if (terminationDate) {
            const termYear = terminationDate.getFullYear();
            const termMonth = terminationDate.getMonth();
            
            // Se estamos após o mês de encerramento, não cobrar licença
            if (selectedYear > termYear || (selectedYear === termYear && monthIndex > termMonth)) {
              console.log(`🛑 Mês ${monthIndex + 1}/${selectedYear} - Contrato ${licenseCostData.contractNumber} encerrado em ${termMonth + 1}/${termYear}`);
              return 0;
            }
          }
        }
        
        // Após o período de isenção, aplicar o custo mensal da licença
        console.log(`💰 Mês ${monthIndex + 1}/${selectedYear} cobrando R$ ${pureLicenseCost} para contrato ${licenseCostData.contractNumber}`);
        return pureLicenseCost;
      });
      
      const totalValue = monthlyBreakdown.reduce((sum, v) => sum + v, 0);
      
      console.log(`💰 Breakdown mensal para ${licenseCostData.contractNumber}:`, monthlyBreakdown);
      
      return {
        contractId: licenseCostData.contractId,
        contractNumber: licenseCostData.contractNumber,
        monthlyBreakdown,
        totalValue,
        monthlyEstimate: pureLicenseCost,
        annualEstimate: totalValue
      };
    }).filter(Boolean);
  }, [contractLicenseCostsData, isLicenseCostSection, contracts, selectedYear]);
  
  // Memoizar função auxiliar para calcular custo de licença
  const calculateLicenseCostFromPlans = useCallback((contractValue: number, employeeCount: number, cnpjCount: number, planType: string) => {
    const { plans = [] } = usePlans();
    const { planAddons = [] } = usePlanAddons();
    
    if (!plans || plans.length === 0) return 0;

    // Custos de licença dos adicionais
    const cnpjAddon = planAddons?.find(a => a.is_active && /cnpj/i.test(a.name));
    const cnpjAddonLicense = cnpjAddon?.license_cost ?? 0;

    const employeesAddon = planAddons?.find(a => a.is_active && /funcion[áa]rio/i.test(a.name));
    const employeesAddonLicense = employeesAddon?.license_cost ?? 0;
    const employeesIncrement = employeesAddon?.package_increment ?? 100;

    const activePlans = plans.filter(p => p.is_active);

    // Mapear todos os candidatos para obter o MENOR custo total da licença
    const candidates = activePlans.map(p => {
      const [minEmp, maxEmp] = p.employee_range.split('-').map(n => parseInt(n.trim(), 10));
      const inRange = employeeCount >= minEmp && employeeCount <= maxEmp;

      // CNPJs extras acima do permitido pelo plano
      const extraCnpjs = Math.max(0, cnpjCount - (p.allowed_cnpjs || 0));
      const cnpjExtraCost = extraCnpjs * cnpjAddonLicense;

      // Funcionários extras
      const extraEmployeesUnits = employeeCount > maxEmp
        ? Math.ceil((employeeCount - maxEmp) / Math.max(1, employeesIncrement))
        : 0;
      const employeesExtraCost = extraEmployeesUnits * employeesAddonLicense;

      const totalLicenseCost = (p.license_cost || 0) + cnpjExtraCost + employeesExtraCost;

      return {
        plan: p,
        inRange,
        extraCnpjs,
        extraEmployeesUnits,
        totalLicenseCost
      };
    });

    if (candidates.length === 0) return 0;

    // Preferir planos cuja faixa de funcionários atenda diretamente
    let subset = candidates.filter(c => c.inRange);
    if (subset.length === 0) subset = candidates;

    subset.sort((a, b) => {
      if (a.totalLicenseCost !== b.totalLicenseCost) return a.totalLicenseCost - b.totalLicenseCost;
      if (a.extraCnpjs !== b.extraCnpjs) return a.extraCnpjs - b.extraCnpjs;
      return (a.plan.license_cost || 0) - (b.plan.license_cost || 0);
    });

    const chosen = subset[0];
    return chosen.totalLicenseCost;
  }, []);
  
  // Memoizar cálculo de receita para otimização
  const computeRevenueForDate = useCallback((contract: any, date: Date): number => {
    const baseValue = parseFloat(contract?.monthly_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
    const adjustedBase = getEffectiveValueForContract?.(contract.id, baseValue, date) ?? baseValue;

    // Parse datas
    const trialDays = parseInt(contract?.trial_days || '30');
    let startDate: Date;
    try {
      if (contract?.start_date?.includes('/')) {
        const [d, m, y] = contract.start_date.split('/');
        startDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      } else if (contract?.start_date?.includes('-')) {
        startDate = new Date(contract.start_date);
      } else {
        startDate = new Date(contract?.created_at);
      }
    } catch {
      startDate = new Date(contract?.created_at);
    }

    const billingStart = new Date(startDate);
    billingStart.setDate(billingStart.getDate() + trialDays);

    const planType = (contract?.plan_type || 'mensal').toLowerCase();

    const analysisYear = date.getFullYear();
    const analysisMonth = date.getMonth();
    const billingYear = billingStart.getFullYear();
    const billingMonth = billingStart.getMonth();

    const isBeingBilled = analysisYear > billingYear || (analysisYear === billingYear && analysisMonth >= billingMonth);
    if (!isBeingBilled) return 0;

    // Verificar encerramento e reativação do contrato
    const termination = parseDateString(contract?.termination_date);
    if (termination) {
      const termYear = termination.getFullYear();
      const termMonth = termination.getMonth();
      
      // Se a análise é APÓS o encerramento
      if (analysisYear > termYear || (analysisYear === termYear && analysisMonth > termMonth)) {
        
        // Se NÃO tem reativação, parar de faturar
        if (!contract?.reactivation_date) {
          return 0;
        }
        
        // Se TEM reativação, verificar se já foi reativado
        const reactivation = parseDateString(contract.reactivation_date);
        if (reactivation) {
          const reactYear = reactivation.getFullYear();
          const reactMonth = reactivation.getMonth();
          
          // Se ainda não chegou na reativação = período inativo
          if (analysisYear < reactYear || (analysisYear === reactYear && analysisMonth < reactMonth)) {
            return 0; // Período inativo entre encerramento e reativação
          }
          // Caso contrário, continua faturando (reativado)
        }
      }
      // Se a análise é ANTES do encerramento, continua faturando normalmente
    }

    if (planType === 'anual') {
      return analysisMonth === billingMonth ? adjustedBase : 0;
    }
    if (planType === 'semestral') {
      const monthsSinceBilling = (analysisYear - billingYear) * 12 + (analysisMonth - billingMonth);
      return monthsSinceBilling >= 0 && monthsSinceBilling % 6 === 0 ? adjustedBase : 0;
    }
    return adjustedBase; // mensal
  }, [getEffectiveValueForContract, parseDateString]);

  // Verifica se a célula corresponde ao mês da renovação (anual recorrente)
  const isFirstRenewalCell = (contractId: string, monthIndex: number): boolean => {
    const contract = (contracts as any[]).find(c => c.id === contractId);
    const renewal = parseDateString(contract?.renewal_date);
    if (!renewal) return false;
    // Destacar o mês de renovação para o ano da renovação e anos subsequentes
    return selectedYear >= renewal.getFullYear() && renewal.getMonth() === monthIndex;
  };

  // Verifica se a célula está em período de trial e retorna info adicional
  const getTrialInfo = (contractId: string, monthIndex: number): { isTrial: boolean; remainingDays?: number; isLastTrialMonth?: boolean } => {
    const contract = (contracts as any[]).find(c => c.id === contractId);
    if (!contract) return { isTrial: false };
    
    const trialDays = parseInt(contract?.trial_days || '30');
    let startDate: Date;
    try {
      if (contract?.start_date?.includes('/')) {
        const [d, m, y] = contract.start_date.split('/');
        startDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      } else if (contract?.start_date?.includes('-')) {
        startDate = new Date(contract.start_date);
      } else {
        startDate = new Date(contract?.created_at);
      }
    } catch {
      startDate = new Date(contract?.created_at);
    }

    const billingStart = new Date(startDate);
    billingStart.setDate(billingStart.getDate() + trialDays);
    
    const cellDate = new Date(selectedYear, monthIndex, 1);
    const nextMonthStart = new Date(selectedYear, monthIndex + 1, 1);
    
    // Verifica se está no período trial (antes do billing start)
    const isTrial = cellDate >= startDate && cellDate < billingStart;
    
    if (!isTrial) return { isTrial: false };
    
    // Se o próximo mês já não é trial, este é o último mês de trial
    const isLastTrialMonth = nextMonthStart >= billingStart;
    
    if (isLastTrialMonth) {
      // Calcula quantos dias restam até o fim do trial
      const remainingDays = Math.ceil((billingStart.getTime() - cellDate.getTime()) / (1000 * 60 * 60 * 24));
      return { isTrial: true, remainingDays, isLastTrialMonth: true };
    }
    
    return { isTrial: true };
  };

  // Função de compatibilidade
  const isTrialPeriodCell = (contractId: string, monthIndex: number): boolean => {
    return getTrialInfo(contractId, monthIndex).isTrial;
  };

  // Processar dados para a seção
  const sectionData = useMemo(() => {
    // Seção especial para Impostos (calcula com base no faturamento)
    if (isTaxSection) {
      console.log('📊 Processing Tax Section with contract data');
      
      const list = selectedContractIds.length > 0
        ? contracts.filter(c => selectedContractIds.includes(c.id))
        : contracts;

      return list.map((contract: any) => {
        const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => {
          const date = new Date(selectedYear, monthIndex, 1);
          const revenue = computeRevenueForDate(contract, date);
          
          // Se não há receita, não há imposto
          if (revenue <= 0) return 0;
          
          // Calcular imposto baseado na porcentagem configurada
          const taxAmount = (revenue * taxPercentage) / 100;
          
          return taxAmount;
        });
        
        const totalValue = monthlyBreakdown.reduce((sum, v) => sum + v, 0);
        const monthlyEstimate = totalValue > 0 ? parseFloat((totalValue / 12).toFixed(2)) : 0;
        
        return {
          category: contract.contract_number || 'Contrato',
          categoryId: contract.id,
          monthlyEstimate,
          annualEstimate: totalValue,
          monthlyBreakdown,
          totalValue
        };
      });
    }
    
    // Seção especial para Custos de Licença (usar dados da análise por contrato)
    if (isLicenseCostSection) {
      console.log('📊 Processing License Cost Section with contract data:', contractLicenseCosts);
      
      const list = selectedContractIds.length > 0
        ? contractLicenseCosts.filter(c => selectedContractIds.includes(c.contractId))
        : contractLicenseCosts;

      return list.map((licenseCost: any) => {
        // Para cada contrato de licença, usar os valores mensais específicos
        const monthlyValues = licenseCost.monthlyBreakdown || [];
        
        // Para o valor mensal (primeira coluna), usar o valor fixo do custo de licença
        // que é o valor recorrente após o período de isenção
        let monthlyValue = 0;
        for (let i = 0; i < monthlyValues.length; i++) {
          if (monthlyValues[i] > 0) {
            monthlyValue = monthlyValues[i];
            break;
          }
        }
        
        return {
          category: licenseCost.contractNumber || 'Contrato',
          categoryId: licenseCost.contractId,
          monthlyEstimate: monthlyValue, // Valor mensal fixo do custo de licença
          annualEstimate: licenseCost.annualEstimate,
          monthlyBreakdown: licenseCost.monthlyBreakdown, // Valores mensais já corretos do hook
          totalValue: licenseCost.totalValue
        };
      });
    }
    
    // Seção especial para Boletos RHID (calcular R$ 3,80 por contrato ativo)
    if (isBoletoSection) {
      console.log('📊 Processing Boleto RHID Section with contract data');
      
      const boletoValuePerContract = 3.80; // Valor fixo do boleto por contrato
      const list = selectedContractIds.length > 0
        ? contracts.filter(c => selectedContractIds.includes(c.id))
        : contracts;

      return list.map((contract: any) => {
        const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => {
          const date = new Date(selectedYear, monthIndex, 1);
          const revenue = computeRevenueForDate(contract, date);
          
          // Se há receita, cobra o boleto
          if (revenue > 0) {
            return boletoValuePerContract;
          }
          
          return 0;
        });
        
        const totalValue = monthlyBreakdown.reduce((sum, v) => sum + v, 0);
        const monthlyEstimate = totalValue > 0 ? parseFloat((totalValue / 12).toFixed(2)) : 0;
        
        return {
          category: contract.contract_number || 'Contrato',
          categoryId: contract.id,
          monthlyEstimate,
          annualEstimate: totalValue,
          monthlyBreakdown,
          totalValue
        };
      });
    }
    
    // Seção especial para Rateio de Custo (dividir custos fixos proporcionalmente pela receita)
    if (isCostAllocationSection) {
      console.log('📊 Processing Cost Allocation Section with contract data');
      console.log('Company Costs:', companyCosts);
      
      // Calcular custos fixos mensais (excluindo impostos)
      const monthlyFixedCosts = companyCosts ? companyCosts
        .filter((cost: any) => cost.is_active && cost.category !== 'tax')
        .reduce((sum: number, cost: any) => {
          // Use monthly_cost em vez de value
          const costValue = cost.monthly_cost || cost.value || 0;
          console.log(`Adding cost: ${cost.description} - Value: ${costValue}`);
          return sum + costValue;
        }, 0) : 0;
      
      console.log('Total Monthly Fixed Costs:', monthlyFixedCosts);
      
      const list = selectedContractIds.length > 0
        ? contracts.filter(c => selectedContractIds.includes(c.id))
        : contracts;

      return list.map((contract: any) => {
        const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => {
          const date = new Date(selectedYear, monthIndex, 1);
          
          // Calcular receita total de todos os contratos ativos no mês
          let totalRevenue = 0;
          contracts.forEach((c: any) => {
            const revenue = computeRevenueForDate(c, date);
            if (revenue > 0) {
              totalRevenue += revenue;
            }
          });
          
          console.log(`Month ${monthIndex + 1}: Total revenue: ${totalRevenue}`);
          
          // Se não há receita total, não há rateio
          if (totalRevenue === 0) return 0;
          
          // Verificar se este contrato específico está ativo no mês
          const contractRevenue = computeRevenueForDate(contract, date);
          if (contractRevenue <= 0) return 0;
          
          // Calcular o rateio proporcional baseado na receita
          // Fórmula: (receita_contrato / receita_total) × custos_fixos_totais
          const allocatedCost = (contractRevenue / totalRevenue) * monthlyFixedCosts;
          console.log(`Contract ${contract.contract_number} - Month ${monthIndex + 1}: Revenue: ${contractRevenue}, Allocated cost: ${allocatedCost.toFixed(2)}`);
          return allocatedCost;
        });
        
        const totalValue = monthlyBreakdown.reduce((sum, v) => sum + v, 0);
        const monthlyEstimate = totalValue > 0 ? parseFloat((totalValue / 12).toFixed(2)) : 0;
        
        return {
          category: contract.contract_number || 'Contrato',
          categoryId: contract.id,
          monthlyEstimate,
          annualEstimate: totalValue,
          monthlyBreakdown,
          totalValue
        };
      });
    }

    if (isRhidSection) {
      const list = selectedContractIds.length > 0
        ? contracts.filter(c => selectedContractIds.includes(c.id))
        : contracts;

      return list.map((c: any) => {
        const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => {
          const date = new Date(selectedYear, monthIndex, 1);
          
          // Log detalhado para debug do período inativo
          console.log(`🔍 FATURAMENTO RHID - ${c.contract_number} - ${monthIndex + 1}/${selectedYear}:`, {
            termination_date: c.termination_date,
            reactivation_date: c.reactivation_date
          });
          
          const base = computeRevenueForDate(c, date);
          if (base <= 0) {
            console.log(`❌ ${c.contract_number} - ${monthIndex + 1}/${selectedYear}: Sem faturamento (base = ${base})`);
            return 0;
          }
          console.log(`💰 ${c.contract_number} - ${monthIndex + 1}/${selectedYear}: Faturando R$ ${base}`);
          // Buscar último override até a data alvo (ano/mes)
          const overridesForContract = revenueOverrides
            .filter(o => o.contract_id === c.id)
            .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
          const latest = overridesForContract.reduce((acc, o) => {
            if (o.year < selectedYear || (o.year === selectedYear && o.month <= monthIndex + 1)) {
              return o;
            }
            return acc;
          }, undefined as any | undefined);
          return latest ? Number(latest.value) : base;
        });
        const totalValue = monthlyBreakdown.reduce((sum, v) => sum + v, 0);
        const monthlyEstimate = totalValue > 0 ? parseFloat((totalValue / 12).toFixed(2)) : 0;
        return {
          category: c.contract_number || 'Contrato',
          categoryId: c.id,
          monthlyEstimate,
          annualEstimate: totalValue,
          monthlyBreakdown,
          totalValue
        };
      });
    }

    // Para seções importadas da análise por contrato, exibir cada categoria individualmente
    const isImportedSection = categories.some(cat => cat.name.includes(' - Contrato '));

    console.log('🔍 DEBUG - Section analysis:', {
      sectionId,
      title,
      isImportedSection,
      categoriesCount: categories.length,
      costsCount: costs.length,
      sampleCategory: categories[0]?.name,
      categoryNames: categories.map(c => c.name)
    });

    if (isImportedSection) {
      console.log('📊 DEBUG - Processing imported section data');
      return categories.map(category => {
        const categoryCosts = costs.filter(cost => cost.category_id === category.id);
        
        console.log(`📊 DEBUG - Category ${category.name}:`, {
          costsCount: categoryCosts.length,
          costs: categoryCosts.map(c => ({ month: c.month, value: c.value }))
        });
        
        const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => {
          const monthValue = categoryCosts
            .filter(cost => cost.month === monthIndex + 1)
            .reduce((sum, cost) => sum + Math.abs(cost.value), 0); // Usar valor absoluto para custos
          return monthValue;
        });
        
        const totalValue = monthlyBreakdown.reduce((sum, value) => sum + value, 0);
        const monthlyEstimate = totalValue !== 0 ? parseFloat((totalValue / 12).toFixed(2)) : 0;
        
        console.log(`📊 DEBUG - ${category.name} breakdown:`, {
          monthlyBreakdown,
          totalValue,
          monthlyEstimate
        });
        
        return {
          category: category.name,
          categoryId: category.id,
          monthlyEstimate,
          annualEstimate: totalValue,
          monthlyBreakdown,
          totalValue
        };
      }).filter(item => item.totalValue !== 0 || item.monthlyBreakdown.some(value => value !== 0)); // Mostrar se há valores
    }

    // Seções normais (sem contratos)
    console.log(`[Generic Section] Processing normal section ${title} with ${categories.length} categories`);
    
    return categories.map(category => {
      const categoryCosts = costs.filter(cost => cost.category_id === category.id);
      
      // Log detalhado para cada categoria
      if (categoryCosts.length > 0) {
        console.log(`[Generic Section] Category ${category.name} - Found ${categoryCosts.length} costs:`, 
          categoryCosts.map(c => ({ month: c.month, value: c.value }))
        );
      }
      
      const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => {
        const monthlyCost = categoryCosts.find(cost => cost.month === monthIndex + 1);
        const value = monthlyCost?.value || 0;
        
        // Log para meses com valores (especialmente setembro a dezembro)
        if (value !== 0 && monthIndex >= 8) {
          console.log(`[Generic Section] ${category.name} - Month ${monthIndex + 1}: ${value}`);
        }
        
        return value;
      });
      
      const totalValue = monthlyBreakdown.reduce((sum, value) => sum + value, 0);
      const monthlyEstimate = totalValue > 0 ? parseFloat((totalValue / 12).toFixed(2)) : 0;
      const annualEstimate = totalValue;
      
      // Log do resultado final
      if (totalValue > 0) {
        console.log(`[Generic Section] ${category.name} - Monthly breakdown:`, monthlyBreakdown);
        console.log(`[Generic Section] ${category.name} - Total: ${totalValue}`);
      }
      
      return {
        category: category.name,
        categoryId: category.id,
        monthlyEstimate,
        annualEstimate,
        monthlyBreakdown,
        totalValue
      };
    });
  }, [isRhidSection, isLicenseCostSection, isTaxSection, selectedContractIds, contracts, categories, costs, selectedYear, revenueOverrides, contractLicenseCosts, taxPercentage]);

  // Calcular totais
  const totals = useMemo(() => {
    const totalAnual = sectionData.reduce((sum, item) => sum + item.totalValue, 0);
    const totalMensal = sectionData.reduce((sum, item) => sum + item.monthlyEstimate, 0);
    return {
      totalMensal,
      totalAnual
    };
  }, [sectionData]);

  const handleCellClick = (categoryId: string, monthIndex: number) => {
    let currentValue = 0;
    
    // Para seção de boletos, buscar nos dados de licença
    if (isBoletoSection) {
      const contractData = contractLicenseCosts.find(c => c.contractId === categoryId);
      if (contractData) {
        currentValue = contractData.monthlyBreakdown[monthIndex] || 0;
      }
    } else {
      // Para outras seções, buscar nos costs normais
      const categoryCosts = costs.filter(cost => cost.category_id === categoryId);
      currentValue = categoryCosts.find(cost => cost.month === monthIndex + 1)?.value || 0;
    }
    
    setEditingCost({
      categoryId,
      monthIndex,
      currentValue
    });
  };

  const handleCloseEditor = () => {
    setEditingCost(null);
  };

  const handleRhidCellClick = (contractId: string, monthIndex: number, currentValue: number) => {
    console.log('[DEBUG GenericFinancialSection] handleRhidCellClick chamado');
    console.log('[DEBUG GenericFinancialSection] contractId:', contractId);
    console.log('[DEBUG GenericFinancialSection] monthIndex:', monthIndex);
    console.log('[DEBUG GenericFinancialSection] currentValue:', currentValue);
    setEditingRevenue({ contractId, monthIndex, currentValue });
  };

  const handleCloseRevenueEditor = () => {
    console.log('[DEBUG GenericFinancialSection] handleCloseRevenueEditor chamado');
    setEditingRevenue(null);
  };

  return (
    <>
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg font-semibold">
              {title.toUpperCase()}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {(isRhidSection || isTaxSection || isLicenseCostSection || isBoletoSection || isCostAllocationSection) ? `${title} por contrato - ${selectedYear}` : `${title} por categoria - ${selectedYear}`}
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardTitle>
        </CardHeader>

        {isExpanded && (
          <CardContent className="p-6 transition-all duration-200">{/* Adicionada transição suave */}
            {/* Loading state com skeleton */}
            {isLoadingData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">Carregando dados...</span>
                </div>
                {/* Skeleton para preview da tabela */}
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              <>
            <div className="flex items-center justify-between mb-6">
              <div className="bg-muted/50 border text-left p-4 rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  R$ {totals.totalMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-muted-foreground">
                  Mensal • Anual: {totals.totalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => ((isRhidSection || isLicenseCostSection || isTaxSection || isBoletoSection || isCostAllocationSection) ? setShowContractSelector(true) : setShowCategoryManager(true))}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {(isRhidSection || isLicenseCostSection || isTaxSection || isBoletoSection || isCostAllocationSection) ? 'Selecionar Contratos' : 'Gerenciar Categorias'}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold w-40 sticky left-0 bg-muted/50">
                      {title.toUpperCase()}
                    </TableHead>
                    <TableHead className="font-semibold text-center w-24 bg-primary/10 text-primary">MENSAL</TableHead>
                    <TableHead className="font-semibold text-center w-24 bg-primary/10 text-primary">ANUAL</TableHead>
                    {monthNames.map((month) => (
                      <TableHead key={month} className="font-semibold text-center w-20">
                        {month}
                      </TableHead>
                    ))}
                    <TableHead className="font-semibold text-center w-24 bg-primary/10 text-primary">TOTAL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionData.map((item, index) => (
                    <TableRow 
                      key={index} 
                      className="border-b hover:bg-muted/30"
                    >
                  <TableCell className="font-semibold sticky left-0 bg-background">
                        {/* Para seções importadas da análise por contrato, mostrar apenas o número do contrato e botão de detalhes */}
                        {(isLicenseCostSection || isRhidSection || isTaxSection || isBoletoSection || isCostAllocationSection || categories.some(cat => cat.name.includes(' - Contrato '))) ? (
                          <div className="flex items-center gap-2">
                            <span>{item.category.includes('Contrato') ? item.category.split('Contrato')[1]?.trim() || item.category : item.category}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedContractIdForDetails(item.categoryId);
                              }}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          item.category
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm bg-primary/5 font-semibold text-primary">
                        {item.monthlyEstimate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm bg-primary/5 font-semibold text-primary">
                        {item.annualEstimate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                        {item.monthlyBreakdown.map((value, monthIndex) => {
                           const isRenewal = isRhidSection && isFirstRenewalCell(item.categoryId, monthIndex);
                           const trialInfo = isRhidSection ? getTrialInfo(item.categoryId, monthIndex) : { isTrial: false };
                           const isTrial = trialInfo.isTrial;
                          
                          return (
                            <TableCell 
                              key={monthIndex} 
                              className={`text-center font-mono text-sm group relative transition-all duration-200 cursor-pointer hover:border-2 hover:border-primary/60 dark:hover:border-primary/40 ${isRenewal ? 'renewal-pulse' : ''} ${isTrial ? 'trial-period' : ''}`}
                              onClick={() => {
                                if (isRhidSection || isTaxSection || isCostAllocationSection) {
                                  // Apenas RHID, Impostos e Rateio usam o editor de receita de contratos
                                  handleRhidCellClick(item.categoryId, monthIndex, value || 0);
                                } else if (isBoletoSection || !isLicenseCostSection || (isLicenseCostSection && selectedContractIds.length > 0)) {
                                  // Boletos e outras seções usam o editor normal de custos
                                  handleCellClick(item.categoryId, monthIndex);
                                }
                              }}
                            >
                             <FinancialCellLoader
                               isLoading={loadingCells[`${item.categoryId}-${monthIndex}`] || false}
                               hasValue={value > 0}
                               value={
                                 <div className="flex items-center justify-center relative">
                                   {value > 0 ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}
                                   {isRenewal && (
                                     <span className="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-1 rounded text-[10px] font-bold">
                                       REN
                                     </span>
                                   )}
                                   {isTrial && (
                                     <span className="absolute -top-2 -right-2 text-xs bg-orange-500 text-white px-1 rounded text-[10px] font-bold">
                                       {trialInfo.isLastTrialMonth && trialInfo.remainingDays 
                                         ? `TRIAL ${trialInfo.remainingDays}d`
                                         : 'TRIAL'
                                       }
                                     </span>
                                   )}
                                   <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 -right-1 text-blue-500" />
                                 </div>
                               }
                             />
                            </TableCell>
                          );
                        })}
                      <TableCell className="text-center font-mono text-sm bg-primary/5 font-semibold text-primary">
                        {item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Linha de Total */}
                  <TableRow className="bg-primary/10 font-bold hover:bg-primary/10">
                    <TableCell className="font-bold sticky left-0 bg-primary/10">
                      TOTAL {title.toUpperCase()}
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold bg-primary/20 text-primary">
                      {totals.totalMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold bg-primary/20 text-primary">
                      {totals.totalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    {Array.from({ length: 12 }, (_, monthIndex) => {
                      const monthlyTotal = sectionData.reduce((sum, item) => sum + item.monthlyBreakdown[monthIndex], 0);
                      return (
                        <TableCell key={monthIndex} className="text-center font-mono font-bold">
                          {monthlyTotal > 0 ? monthlyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-mono font-bold bg-primary/20 text-primary">
                      {totals.totalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-background p-4 rounded-lg border shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">Total Mensal Médio</div>
                <div className="text-xl font-bold text-primary">
                  R$ {totals.totalMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="bg-background p-4 rounded-lg border shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">Total Anual</div>
                <div className="text-xl font-bold text-primary">
                  R$ {totals.totalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="bg-background p-4 rounded-lg border shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">{(isRhidSection || isTaxSection || isLicenseCostSection) ? `Contratos de ${title}` : `Categorias de ${title}`}</div>
                <div className="text-xl font-bold text-primary">
                  {sectionData.length}
                </div>
              </div>
              
              <div className="bg-background p-4 rounded-lg border shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">{(isRhidSection || isTaxSection || isLicenseCostSection) ? `Contratos Selecionados` : `${title} Configuradas`}</div>
                <div className="text-xl font-bold text-primary">
                  {sectionData.filter(item => item.totalValue > 0).length}
                </div>
              </div>
            </div>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Modal de gerenciamento de categorias / seleção de contratos */}
      <SectionCategoryManager
        sectionId={sectionId}
        sectionName={title}
        open={!isRhidSection && showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />
      {(isRhidSection || isLicenseCostSection || isTaxSection) && (
        <ContractSelectionModal
          open={showContractSelector}
          selectedIds={selectedContractIds}
          onSave={setSelectedContractIds}
          onClose={() => setShowContractSelector(false)}
        />
      )}

      {editingCost && (
        <SectionFinancialCostEditor
          open={true}
          onClose={handleCloseEditor}
          sectionId={sectionId}
          categoryId={editingCost.categoryId}
          year={selectedYear}
          month={editingCost.monthIndex + 1}
          initialValue={editingCost.currentValue}
          onSaveStart={() => {
            const cellKey = `${editingCost.categoryId}-${editingCost.monthIndex}`;
            setLoadingCells(prev => ({ ...prev, [cellKey]: true }));
          }}
          onSaveEnd={() => {
            const cellKey = `${editingCost.categoryId}-${editingCost.monthIndex}`;
            setTimeout(() => {
              setLoadingCells(prev => ({ ...prev, [cellKey]: false }));
            }, 500);
          }}
        />
      )}

      {editingRevenue && (
        <>
          {console.log('[DEBUG GenericFinancialSection] Renderizando ContractMonthlyRevenueEditor')}
          {console.log('[DEBUG GenericFinancialSection] editingRevenue:', editingRevenue)}
          {console.log('[DEBUG GenericFinancialSection] selectedYear:', selectedYear)}
          <ContractMonthlyRevenueEditor
            open={true}
            onClose={handleCloseRevenueEditor}
            contractId={editingRevenue.contractId}
            year={selectedYear}
            month={editingRevenue.monthIndex + 1}
            initialValue={editingRevenue.currentValue}
          />
        </>
      )}

      {/* Modal de Detalhes do Contrato */}
      {selectedContractIdForDetails && (
        <ContractorDetailsModal
          contractId={selectedContractIdForDetails}
          open={true}
          onOpenChange={(open) => {
            if (!open) setSelectedContractIdForDetails(null);
          }}
        />
      )}
    </>
  );
};

export default GenericFinancialSection;