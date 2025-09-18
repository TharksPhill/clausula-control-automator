import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFinancialSections } from "@/hooks/useFinancialSections";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { useMonthlyFinancialCosts } from "@/hooks/useMonthlyFinancialCosts";
import { useContracts } from "@/hooks/useContracts";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";
import { useContractMonthlyRevenueOverridesUpToYear } from "@/hooks/useContractMonthlyRevenueOverrides";
import { useCosts } from "@/hooks/useCosts";
import { useContractMonthlyLicenseCosts } from "@/hooks/useContractLicenseCosts";

export interface FinancialSummaryData {
  sectionName: string;
  sectionType: 'revenue' | 'expense';
  categories: {
    categoryName: string;
    monthlyTotals: number[];
    total: number;
  }[];
  monthlyTotals: number[];
  total: number;
}

export const useFinancialSummary = (year: number) => {
  const { data: sections = [] } = useFinancialSections();
  const { data: categories = [] } = useFinancialCategories();
  const { data: monthlyCosts = [] } = useMonthlyFinancialCosts(year);
  const { contracts = [] } = useContracts();
  const { getEffectiveValueForContract } = useContractAdjustments();
  const { data: overrides = [] } = useContractMonthlyRevenueOverridesUpToYear(year);
  const { companyCosts } = useCosts();
  const { data: licenseCosts = [] } = useContractMonthlyLicenseCosts(year);
  const contractsKey = (contracts || []).map((c: any) => `${c.id}:${c.termination_date || ''}:${c.status || ''}:${c.monthly_value || ''}`).join('|');
  
  console.log(`[useFinancialSummary] License costs data for year ${year}:`, licenseCosts);

  // Criar uma chave única para os custos mensais que inclua valores
  const monthlyCostsKey = monthlyCosts.map(c => `${c.category_id}:${c.month}:${c.value}`).join('|');
  
  // Criar chave única que inclui os IDs das seções e categorias
  const sectionsKey = sections.map(s => `${s.id}:${s.name}`).join('|');
  const categoriesKey = categories.map(c => `${c.id}:${c.section_id}:${c.name}`).join('|');
  
  return useQuery({
    queryKey: ["financial-summary", year, sectionsKey, categoriesKey, monthlyCostsKey, contracts.length, overrides.length, contractsKey, companyCosts, licenseCosts],
    queryFn: () => {
      // Função auxiliar para obter o valor efetivo de um contrato em uma data específica
      const getEffectiveValueAtDate = (contract: any, date: Date): number => {
        // Parse do valor base do contrato
        const baseValue = parseFloat(contract.valor) || 0;
        
        // Obter ajustes do contrato e ordená-los por data
        const adjustments = contract.contract_adjustments || [];
        const sortedAdjustments = adjustments
          .filter((adj: any) => adj.status === 'applied')
          .sort((a: any, b: any) => new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime());
        
        // Calcular valor ajustado considerando todos os ajustes até a data especificada
        let adjustedValue = baseValue;
        
        for (const adjustment of sortedAdjustments) {
          const adjustmentDate = new Date(adjustment.effective_date);
          
          // Só aplicar ajustes que já estão em vigor na data especificada
          if (adjustmentDate <= date) {
            if (adjustment.adjustment_type === 'percentage') {
              adjustedValue = adjustedValue * (1 + adjustment.adjustment_value / 100);
            } else {
              adjustedValue = adjustment.adjustment_value;
            }
          }
        }
        
        return adjustedValue;
      };

      // Calcular porcentagem de impostos configurada
      const taxPercentage = companyCosts ? companyCosts
        .filter((cost: any) => cost.is_active && cost.category === 'tax')
        .reduce((sum: number, cost: any) => {
          const percentageMatch = cost.description.match(/\((\d+(?:\.\d+)?)%\)/);
          if (percentageMatch) {
            return sum + parseFloat(percentageMatch[1]);
          }
          return sum;
        }, 0) : 0;
      const computeRevenueForDate = (contract: any, date: Date): number => {
        const baseValue = parseFloat(contract?.monthly_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
        const adjustedBase = getEffectiveValueForContract?.(contract.id, baseValue, date) ?? baseValue;

        // Parse trial days com valor padrão
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

        // Encerramento: zerar a partir do mês do encerramento
        const terminationStr = (contract as any)?.termination_date as string | undefined;
        if (terminationStr) {
          console.log(`[Termination Check] Contrato ${contract.id} tem termination_date: ${terminationStr}`);
          let termination: Date | null = null;
          try {
            if (terminationStr.includes('/')) {
              const [d, m, y] = terminationStr.split('/');
              termination = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            } else if (terminationStr.includes('-')) {
              termination = new Date(terminationStr);
            }
          } catch {}
          if (termination) {
            const termYear = termination.getFullYear();
            const termMonth = termination.getMonth();
            console.log(`[Termination Check] Data de análise: ${analysisYear}-${analysisMonth + 1}, Data de encerramento: ${termYear}-${termMonth + 1}`);
            
            // Se a análise é APÓS o encerramento
            if (analysisYear > termYear || (analysisYear === termYear && analysisMonth > termMonth)) {
              
              // Se NÃO tem reativação, parar de faturar
              if (!contract.reactivation_date) {
                console.log(`[Termination Check] Contrato ${contract.id} encerrado definitivamente em ${termYear}-${termMonth + 1}`);
                return 0;
              }
              
              // Se TEM reativação, verificar se já foi reativado
              let reactivation: Date | null = null;
              try {
                const reactivationStr = contract.reactivation_date;
                if (reactivationStr?.includes('/')) {
                  const [d, m, y] = reactivationStr.split('/');
                  reactivation = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                } else if (reactivationStr?.includes('-')) {
                  reactivation = new Date(reactivationStr);
                }
              } catch {}
              
              if (reactivation) {
                const reactYear = reactivation.getFullYear();
                const reactMonth = reactivation.getMonth();
                
                // Se ainda não chegou na reativação = período inativo
                if (analysisYear < reactYear || (analysisYear === reactYear && analysisMonth < reactMonth)) {
                  console.log(`[Termination Check] Contrato ${contract.id} em período inativo (${termYear}-${termMonth + 1} até ${reactYear}-${reactMonth + 1})`);
                  return 0;
                }
                console.log(`[Termination Check] Contrato ${contract.id} reativado em ${reactYear}-${reactMonth + 1}`);
              }
            }
          }
        }

        if (planType === 'anual') {
          // Para contratos anuais, cobrar apenas uma vez por ano no mês de vencimento
          const monthsSinceBilling = (analysisYear - billingYear) * 12 + (analysisMonth - billingMonth);
          
          // Verifica se é mês de cobrança anual (no mês de início da cobrança, e depois a cada 12 meses)
          const isAnnualBillingMonth = monthsSinceBilling >= 0 && monthsSinceBilling % 12 === 0;
          
          if (isAnnualBillingMonth) {
            // Para contratos anuais, retornar o valor ajustado
            console.log(`[Anual] Cobrança anual para contrato ${contract.id} em ${analysisYear}-${analysisMonth + 1}: R$ ${adjustedBase}`);
            return adjustedBase;
          }
          return 0;
        }
        if (planType === 'semestral') {
          // Para contratos semestrais, cobrar a cada 6 meses
          const monthsSinceBilling = (analysisYear - billingYear) * 12 + (analysisMonth - billingMonth);
          
          // Verifica se é mês de cobrança semestral (no mês de início, e depois a cada 6 meses)
          const isSemestralBillingMonth = monthsSinceBilling >= 0 && monthsSinceBilling % 6 === 0;
          
          if (isSemestralBillingMonth) {
            // Usar o valor ajustado
            console.log(`[Semestral] Cobrança semestral para contrato ${contract.id} em ${analysisYear}-${analysisMonth + 1}: R$ ${adjustedBase}`);
            return adjustedBase;
          }
          return 0;
        }
        return adjustedBase;
      };

      // Agrupar seções por tipo de operação
      const operationalSections = sections.filter(s => s.operation_type === 'operational');
      const nonOperationalSections = sections.filter(s => s.operation_type === 'non_operational');

      const calculateSectionData = (sectionIds: string[]): FinancialSummaryData[] => {
        const sectionData: FinancialSummaryData[] = [];
        
        // Debug log para verificar todos os custos mensais carregados
        console.log(`[Financial Summary] Total monthly costs loaded for year ${year}:`, monthlyCosts.length);
        if (monthlyCosts.length > 0) {
          console.log(`[Financial Summary] Sample monthly costs:`, monthlyCosts.slice(0, 5));
        }

        sectionIds.forEach(sectionId => {
          const section = sections.find(s => s.id === sectionId);
          if (!section) return;

          const sectionCategories = categories.filter(c => c.section_id === sectionId);
          console.log(`[Financial Summary] Processing section: ${section.name} with ${sectionCategories.length} categories`);
          
          // Debug específico para seção TESTE
          if (section.name === 'TESTE') {
            console.log(`[TESTE Debug] Section ID: ${sectionId}`);
            console.log(`[TESTE Debug] Categories:`, sectionCategories);
            console.log(`[TESTE Debug] All monthly costs count:`, monthlyCosts.length);
            
            // Verificar se os dados de Set-Dez estão nos custos carregados
            const allSeptDecCosts = monthlyCosts.filter(c => c.month >= 9);
            console.log(`[TESTE Debug] Total Sept-Dec costs in monthlyCosts:`, allSeptDecCosts.length);
            
            // Verificar especificamente a categoria TESTE 01
            const testeCategory = sectionCategories.find(c => c.name === 'TESTE 01');
            if (testeCategory) {
              console.log(`[TESTE Debug] TESTE 01 category ID:`, testeCategory.id);
              const testeCategoryCosts = monthlyCosts.filter(cost => cost.category_id === testeCategory.id);
              console.log(`[TESTE Debug] All costs for TESTE 01:`, testeCategoryCosts);
              console.log(`[TESTE Debug] Sept-Dec for TESTE 01:`, testeCategoryCosts.filter(c => c.month >= 9));
            }
            
            const testeCosts = monthlyCosts.filter(cost => {
              const cat = sectionCategories.find(c => c.id === cost.category_id);
              return cat !== undefined;
            });
            console.log(`[TESTE Debug] TESTE section costs:`, testeCosts);
            console.log(`[TESTE Debug] TESTE section costs for Sept-Dec:`, testeCosts.filter(c => c.month >= 9));
          }
          
          let categoriesData = sectionCategories.map(category => {
            const monthlyTotals = Array(12).fill(0);
            
            // Buscar custos mensais para esta categoria
            const categoryCosts = monthlyCosts.filter(cost => cost.category_id === category.id);
            
            // Debug log para verificar custos da categoria
            if (categoryCosts.length > 0) {
              console.log(`[Financial Summary] Category ${category.name} - Found ${categoryCosts.length} costs:`, categoryCosts);
            }
            
            categoryCosts.forEach(cost => {
              if (cost.month >= 1 && cost.month <= 12) {
                monthlyTotals[cost.month - 1] = cost.value;
                console.log(`[Financial Summary] Category ${category.name} - Month ${cost.month}: ${cost.value}`);
              }
            });

            const total = monthlyTotals.reduce((sum, value) => sum + value, 0);
            
            // Log para seções com dados
            if (total > 0) {
              console.log(`[Financial Summary] Category ${category.name} - Monthly Totals:`, monthlyTotals);
              console.log(`[Financial Summary] Category ${category.name} - Total: ${total}`);
            }

            return {
              categoryName: category.name,
              monthlyTotals,
              total
            };
          });

          // Calcular totais da seção
          const sectionMonthlyTotals = Array(12).fill(0);
          categoriesData.forEach(cat => {
            cat.monthlyTotals.forEach((value, index) => {
              sectionMonthlyTotals[index] += value;
            });
          });
          
          // Log para seções com dados (especialmente nos últimos meses)  
          const hasDataInLastMonths = sectionMonthlyTotals.slice(8).some(v => v !== 0);
          // Sempre logar a seção TESTE para debug
          if (hasDataInLastMonths || section.name === 'TESTE') {
            console.log(`[Financial Summary] Section ${section.name} - Operation type: ${section.operation_type}, Revenue type: ${section.revenue_type}`);
            console.log(`[Financial Summary] Section ${section.name} - Monthly totals:`, sectionMonthlyTotals);
            console.log(`[Financial Summary] Section ${section.name} - Last 4 months (Set-Dez):`, sectionMonthlyTotals.slice(8));
            console.log(`[Financial Summary] Section ${section.name} - Categories data:`, categoriesData);
          }
          
          // Debug específico para 2025 e seções operacionais
          if (year === 2025 && section.operation_type === 'operational') {
            console.log(`🔍 [DEBUG 2025] Processando seção operacional: ${section.name} (ID: ${section.id})`);
            console.log(`🔍 [DEBUG 2025] Totais mensais calculados:`, sectionMonthlyTotals);
            console.log(`🔍 [DEBUG 2025] Set-Dez (meses 9-12):`, sectionMonthlyTotals.slice(8));
            
            // Verificar se há categorias e custos para esta seção
            const sectionCategoriesDebug = categories.filter((cat: any) => cat.section_id === section.id);
            console.log(`🔍 [DEBUG 2025] Categorias da seção ${section.name}:`, sectionCategoriesDebug);
            
            const sectionCosts = monthlyCosts.filter((cost: any) => {
              const category = categories.find((cat: any) => cat.id === cost.category_id);
              return category && category.section_id === section.id;
            });
            
            const septDecCosts = sectionCosts.filter((c: any) => c.month >= 9 && c.month <= 12);
            console.log(`🔍 [DEBUG 2025] Custos encontrados para Set-Dez:`, septDecCosts);
            
            if (septDecCosts.length === 0 && sectionMonthlyTotals.slice(8).some(v => v === 0)) {
              console.warn(`⚠️ [DEBUG 2025] PROBLEMA DETECTADO: Seção ${section.name} tem valores zerados para Set-Dez!`);
              console.warn(`⚠️ [DEBUG 2025] Dados brutos dos custos mensais para verificação:`, sectionCosts);
            }
          }

          // Se for a seção Faturamento RHID, criar categorias individuais por contrato
          const isRhidSectionName = (section.name || '').toLowerCase().includes('faturamento') && (section.name || '').toLowerCase().includes('rhid');
          if (isRhidSectionName) {
            console.log(`[RHID Section] Processando seção ${section.name} para o ano ${year}`);
            
            // Criar uma categoria para cada contrato ativo
            categoriesData = contracts.map((c: any) => {
              const contractMonthlyTotals = Array(12).fill(0);
              let contractTotal = 0;
              
              // Log para debug de contratos anuais/semestrais
              const planType = (c.plan_type || 'mensal').toLowerCase();
              if (planType === 'anual' || planType === 'semestral') {
                console.log(`[RHID Debug] Contrato ${c.contract_number} - Tipo: ${planType}`);
                console.log(`[RHID Debug] Start date: ${c.start_date}, Trial: ${c.trial_days}`);
              }
              
              for (let m = 0; m < 12; m++) {
                const date = new Date(year, m, 1);
                const base = computeRevenueForDate(c, date);
                
                if (base > 0) {
                  const overridesForContract = overrides
                    .filter(o => o.contract_id === c.id)
                    .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
                  const latest = overridesForContract.reduce((acc, o) => {
                    if (o.year < year || (o.year === year && o.month <= m + 1)) {
                      return o;
                    }
                    return acc;
                  }, undefined as any | undefined);
                  const finalValue = latest ? Number(latest.value) || 0 : base;
                  contractMonthlyTotals[m] = finalValue;
                  contractTotal += finalValue;
                  
                  // Log específico para contratos anuais/semestrais quando há valor
                  if ((planType === 'anual' || planType === 'semestral') && finalValue > 0) {
                    console.log(`[RHID Debug] ${planType} - Mês ${m+1}: R$ ${finalValue}`);
                  }
                }
              }
              
              // Só retornar contratos que tiveram faturamento no ano
              if (contractTotal > 0) {
                // Buscar nome do cliente (pode estar nos contractors)
                const contractorName = c.contractors?.[0]?.name || c.client_name || 'Cliente não identificado';
                return {
                  categoryName: `${contractorName}`,
                  monthlyTotals: contractMonthlyTotals,
                  total: contractTotal,
                  contractNumber: c.contract_number
                };
              }
              return null;
            }).filter(Boolean);
            
            // Recalcular totais da seção baseados nas categorias de contratos
            sectionMonthlyTotals.fill(0);
            categoriesData.forEach(cat => {
              cat.monthlyTotals.forEach((value, index) => {
                sectionMonthlyTotals[index] += value;
              });
            });
            console.log(`[RHID Section] Totais mensais finais:`, sectionMonthlyTotals);
          }
          
          // Se for seção de Impostos RHID, criar categorias individuais por contrato
          const isTaxSectionName = ((section.name || '').toLowerCase().includes('imposto') && (section.name || '').toLowerCase().includes('rhid')) || 
                                   ((section.name || '').toLowerCase().includes('tax') && (section.name || '').toLowerCase().includes('rhid'));
          if (isTaxSectionName && taxPercentage > 0) {
            console.log(`[Tax Section] Processando seção ${section.name} para o ano ${year} com ${taxPercentage}% de imposto`);
            
            // Criar uma categoria para cada contrato ativo
            categoriesData = contracts.map((c: any) => {
              const contractMonthlyTotals = Array(12).fill(0);
              let contractTotal = 0;
              
              for (let m = 0; m < 12; m++) {
                const date = new Date(year, m, 1);
                const base = computeRevenueForDate(c, date);
                
                if (base > 0) {
                  const overridesForContract = overrides
                    .filter(o => o.contract_id === c.id)
                    .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
                  const latest = overridesForContract.reduce((acc, o) => {
                    if (o.year < year || (o.year === year && o.month <= m + 1)) {
                      return o;
                    }
                    return acc;
                  }, undefined as any | undefined);
                  const finalValue = latest ? Number(latest.value) || 0 : base;
                  const taxValue = (finalValue * taxPercentage) / 100;
                  contractMonthlyTotals[m] = taxValue;
                  contractTotal += taxValue;
                }
              }
              
              // Só retornar contratos que tiveram impostos no ano
              if (contractTotal > 0) {
                // Buscar nome do cliente (pode estar nos contractors)
                const contractorName = c.contractors?.[0]?.name || c.client_name || 'Cliente não identificado';
                return {
                  categoryName: `${contractorName}`,
                  monthlyTotals: contractMonthlyTotals,
                  total: contractTotal,
                  contractNumber: c.contract_number
                };
              }
              return null;
            }).filter(Boolean);
            
            // Recalcular totais da seção
            sectionMonthlyTotals.fill(0);
            categoriesData.forEach(cat => {
              cat.monthlyTotals.forEach((value, index) => {
                sectionMonthlyTotals[index] += value;
              });
            });
            console.log(`[Tax Section] Totais mensais finais:`, sectionMonthlyTotals);
          }
          
          // Se for seção de Custo de Licença, criar categorias individuais por contrato
          const isLicenseCostSectionName = (section.name || '').toLowerCase().includes('custo') && 
            ((section.name || '').toLowerCase().includes('licença') || (section.name || '').toLowerCase().includes('licenca'));
          if (isLicenseCostSectionName) {
            console.log(`[License Cost] Processing license costs for section: ${section.name}`);
            console.log(`[License Cost] License costs data:`, licenseCosts);
            
            // Criar uma categoria para cada contrato com custos de licença
            categoriesData = licenseCosts.map((licenseCost: any) => {
              const contract = contracts.find((c: any) => c.id === licenseCost.contractId);
              if (!contract) return null;
              
              const contractMonthlyTotals = licenseCost.monthlyBreakdown || Array(12).fill(0);
              const contractTotal = contractMonthlyTotals.reduce((sum: number, val: number) => sum + val, 0);
              
              if (contractTotal > 0) {
                // Buscar nome do cliente (pode estar nos contractors)
                const contractorName = contract.contractors?.[0]?.name || contract.client_name || 'Cliente não identificado';
                return {
                  categoryName: `${contractorName}`,
                  monthlyTotals: contractMonthlyTotals,
                  total: contractTotal,
                  contractNumber: contract.contract_number
                };
              }
              return null;
            }).filter(Boolean);
            
            // Recalcular totais da seção
            sectionMonthlyTotals.fill(0);
            categoriesData.forEach(cat => {
              cat.monthlyTotals.forEach((value, index) => {
                sectionMonthlyTotals[index] += value;
              });
            });
            
            console.log(`[License Cost] Final monthly totals:`, sectionMonthlyTotals);
          }


          // Se for seção de Boletos RHID, criar categorias individuais por contrato
          const isBoletoSectionName = (section.name || '').toLowerCase().includes('boleto') && 
            (section.name || '').toLowerCase().includes('rhid');
          if (isBoletoSectionName) {
            const monthlyBoletoValuePerContract = 3.80;
            
            // Criar uma categoria para cada contrato ativo
            categoriesData = contracts.map((c: any) => {
              const contractMonthlyTotals = Array(12).fill(0);
              let contractTotal = 0;
              
              for (let m = 0; m < 12; m++) {
                const date = new Date(year, m, 1);
                const revenue = computeRevenueForDate(c, date);
                
                if (revenue > 0) {
                  contractMonthlyTotals[m] = monthlyBoletoValuePerContract;
                  contractTotal += monthlyBoletoValuePerContract;
                }
              }
              
              // Só retornar contratos que tiveram boletos no ano
              if (contractTotal > 0) {
                // Buscar nome do cliente (pode estar nos contractors)
                const contractorName = c.contractors?.[0]?.name || c.client_name || 'Cliente não identificado';
                return {
                  categoryName: `${contractorName}`,
                  monthlyTotals: contractMonthlyTotals,
                  total: contractTotal,
                  contractNumber: c.contract_number
                };
              }
              return null;
            }).filter(Boolean);
            
            // Recalcular totais da seção
            sectionMonthlyTotals.fill(0);
            categoriesData.forEach(cat => {
              cat.monthlyTotals.forEach((value, index) => {
                sectionMonthlyTotals[index] += value;
              });
            });
          }
          
          // Se for seção de Rateio de Custos, calcular baseado nos custos fixos mensais
          const isCostAllocationSectionName = (section.name || '').toLowerCase().includes('rateio') && 
            ((section.name || '').toLowerCase().includes('custo') || (section.name || '').toLowerCase().includes('custos'));
          if (isCostAllocationSectionName) {
            console.log(`[Rateio Debug] Processing section: ${section.name}`);
            console.log(`[Rateio Debug] Total contracts: ${contracts.length}`);
            
            // Calcular custos fixos mensais (excluindo impostos)
            const monthlyFixedCosts = companyCosts ? companyCosts
              .filter((cost: any) => cost.is_active && cost.category !== 'tax')
              .reduce((sum: number, cost: any) => {
                const costValue = cost.monthly_cost || cost.value || 0;
                console.log(`[Rateio] Adding cost: ${cost.description} - Value: ${costValue}`);
                return sum + costValue;
              }, 0) : 0;
            
            console.log(`[Rateio] Total Monthly Fixed Costs: ${monthlyFixedCosts}`);
            
            // Calcular a SOMA dos rateios individuais de cada contrato
            for (let m = 0; m < 12; m++) {
              const date = new Date(year, m, 1);
              let totalRevenue = 0;
              let sumOfAllocations = 0;
              let activeContractsCount = 0;
              
              console.log(`[Rateio Debug] Processing month ${m + 1}/${year}`);
              
              // Primeiro, calcular a receita total do mês (usando overrides se existirem)
              contracts.forEach((c: any) => {
                const base = computeRevenueForDate(c, date);
                console.log(`[Rateio Debug] Contract ${c.contract_number}: base revenue = ${base}`);
                
                if (base <= 0) {
                  console.log(`[Rateio Debug] Contract ${c.contract_number} not billing in month ${m + 1}`);
                  return; // não fatura neste mês
                }
                
                // Verificar se há overrides para este contrato neste mês
                const overridesForContract = overrides
                  .filter(o => o.contract_id === c.id)
                  .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
                const latest = overridesForContract.reduce((acc, o) => {
                  if (o.year < year || (o.year === year && o.month <= m + 1)) {
                    return o;
                  }
                  return acc;
                }, undefined as any | undefined);
                
                const revenue = latest ? Number(latest.value) || 0 : base;
                console.log(`[Rateio Debug] Contract ${c.contract_number}: final revenue = ${revenue} (override: ${!!latest})`);
                
                if (revenue > 0) {
                  totalRevenue += revenue;
                  activeContractsCount++;
                }
              });
              
              console.log(`[Rateio] Month ${m + 1}: Active contracts: ${activeContractsCount}, Total revenue: ${totalRevenue}`);
              
              // Se há receita, calcular o rateio individual de cada contrato e somar
              if (totalRevenue > 0) {
                contracts.forEach((c: any) => {
                  const base = computeRevenueForDate(c, date);
                  if (base <= 0) return; // não fatura neste mês
                  
                  // Usar overrides se existirem
                  const overridesForContract = overrides
                    .filter(o => o.contract_id === c.id)
                    .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
                  const latest = overridesForContract.reduce((acc, o) => {
                    if (o.year < year || (o.year === year && o.month <= m + 1)) {
                      return o;
                    }
                    return acc;
                  }, undefined as any | undefined);
                  
                  const contractRevenue = latest ? Number(latest.value) || 0 : base;
                  if (contractRevenue > 0) {
                    // Calcular o rateio proporcional: (receita_contrato / receita_total) × custos_fixos
                    const allocatedCost = (contractRevenue / totalRevenue) * monthlyFixedCosts;
                    sumOfAllocations += allocatedCost;
                    console.log(`[Rateio] Contract ${c.contract_number} - Revenue: ${contractRevenue}, Allocated: ${allocatedCost.toFixed(2)}`);
                  }
                });
              } else {
                console.log(`[Rateio] Month ${m + 1}: No revenue, no allocation`);
              }
              
              // O total da seção é a SOMA dos rateios individuais
              sectionMonthlyTotals[m] = sumOfAllocations;
              
              console.log(`[Rateio] Month ${m + 1}: Sum of allocations: ${sumOfAllocations.toFixed(2)} (should equal ${monthlyFixedCosts} if all contracts active)`);
            }
            
            console.log(`[Rateio] Final section monthly totals:`, sectionMonthlyTotals);
          }
          
          const sectionTotal = sectionMonthlyTotals.reduce((sum, value) => sum + value, 0);

          // Determinar tipo da seção baseado no campo revenue_type (se existir) ou nas categorias
          const isRevenueSection = section.revenue_type === true;
          const revenueCount = sectionCategories.filter(c => c.type === 'renda').length;
          const expenseCount = sectionCategories.filter(c => c.type === 'impostos' || c.type === 'despesas').length;
          const sectionType = isRevenueSection || revenueCount > expenseCount ? 'revenue' : 'expense';

          sectionData.push({
            sectionName: section.name,
            sectionType,
            categories: categoriesData,
            monthlyTotals: sectionMonthlyTotals,
            total: sectionTotal
          });
        });

        return sectionData;
      };

      const operationalData = calculateSectionData(operationalSections.map(s => s.id));
      const nonOperationalData = calculateSectionData(nonOperationalSections.map(s => s.id));

      return {
        operational: operationalData,
        nonOperational: nonOperationalData
      };
    },
    enabled: sections.length > 0 && categories.length > 0,
    staleTime: 0, // Sem cache para garantir dados sempre atualizados
    gcTime: 0, // Sem garbage collection para forçar nova busca
    refetchOnWindowFocus: true, // Recarregar ao focar na janela
    refetchOnMount: 'always', // Sempre recarregar ao montar
    refetchInterval: false // Desabilitar atualização automática para controle manual
  });
};