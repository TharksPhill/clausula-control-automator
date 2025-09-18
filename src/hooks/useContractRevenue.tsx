
import { useMemo } from "react";
import { useCostPlans } from "./useCostPlans";
import { useContractAdjustments } from "./useContractAdjustments";
import { useContractStatusHistory } from "./useContractStatusHistory";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface ContractRevenueCalculation {
  contractId: string;
  contractNumber: string;
  baseValue: number;
  addonValue: number;
  totalValue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  planType: string;
  status: string;
  startDate: Date | null;
  renewalDate: Date | null;
  contractor: any;
  employeeCount: number;
  cnpjCount: number;
}

export const useContractRevenue = (contracts: any[], analysisDate: Date) => {
  const { contractAddons } = useCostPlans();
  const { getEffectiveValueForContract } = useContractAdjustments();
  
  // Buscar histórico de status para todos os contratos
  const { data: allStatusHistory } = useQuery({
    queryKey: ['all-contract-status-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_status_history')
        .select('*')
        .order('status_date', { ascending: true });

      if (error) {
        console.error('Erro ao buscar histórico de status:', error);
        return [];
      }

      return data;
    },
  });

  // Função para calcular quando o cliente começa a ser cobrado (após período de teste)
  const getClientBillingStartDate = (contractStartDate: Date, trialDays: number): Date => {
    const billingStart = new Date(contractStartDate);
    billingStart.setDate(billingStart.getDate() + trialDays);
    return billingStart;
  };

  // Função para verificar se o cliente está sendo cobrado no mês analisado
  const isClientBeingBilled = (contractStartDate: Date, trialDays: number, analysisDate: Date): boolean => {
    const billingStartDate = getClientBillingStartDate(contractStartDate, trialDays);
    
    // Comparar apenas ano e mês para determinar se está sendo cobrado no mês da análise
    const analysisYear = analysisDate.getFullYear();
    const analysisMonth = analysisDate.getMonth();
    const billingYear = billingStartDate.getFullYear();
    const billingMonth = billingStartDate.getMonth();
    
    // Cliente só é cobrado se o mês de análise for posterior ou igual ao mês de início da cobrança
    const isBeingBilled = (analysisYear > billingYear) || (analysisYear === billingYear && analysisMonth >= billingMonth);
    
    console.log(`🔍 Verificação de cobrança:`, {
      contrato: contractStartDate.toISOString().slice(0, 10),
      diasTeste: trialDays,
      inicioCobranca: billingStartDate.toISOString().slice(0, 10),
      mesAnalise: `${analysisYear}-${(analysisMonth + 1).toString().padStart(2, '0')}`,
      mesCobranca: `${billingYear}-${(billingMonth + 1).toString().padStart(2, '0')}`,
      estaCobrando: isBeingBilled
    });
    
    return isBeingBilled;
  };

  // Função para calcular valor dos addons de um contrato específico
  const calculateAddonValue = (contractId: string, baseValue: number): number => {
    if (!contractAddons) return 0;

    const contractAddonsList = contractAddons.filter(addon => addon.contract_id === contractId);
    
    let totalAddonValue = 0;
    
    contractAddonsList.forEach(addon => {
      if (addon.addon_type === 'adjustment') {
        // Para reajustes, não somar como addon, pois já está refletido no valor base
        return;
      }
      
      // Para outros tipos de addon, somar o valor
      const addonValue = parseFloat(addon.new_value || '0');
      totalAddonValue += addonValue;
    });

    console.log(`💰 Cálculo de addons para contrato ${contractId}:`, {
      valor_base: baseValue,
      addons_encontrados: contractAddonsList.length,
      valor_addons_calculado: totalAddonValue,
      detalhes_addons: contractAddonsList.map(addon => ({
        tipo: addon.addon_type,
        valor: addon.new_value,
        descricao: addon.description
      }))
    });

    return totalAddonValue;
  };

  const contractRevenues = useMemo((): ContractRevenueCalculation[] => {
    if (!contracts) return [];

    console.log("📊 RECALCULANDO RECEITAS DOS CONTRATOS (MÚLTIPLAS INATIVAÇÕES):", {
      total_contratos: contracts.length,
      contratos_ativos: contracts.filter(c => c.status === 'Ativo').length,
      total_addons: contractAddons?.length || 0,
      data_analise: analysisDate.toISOString().slice(0, 7),
      historico_total: allStatusHistory?.length || 0
    });

    return contracts
      .filter(contract => {
        // Buscar histórico de status para este contrato específico
        const contractHistory = allStatusHistory?.filter(h => h.contract_id === contract.id) || [];
        
        // Se há histórico, usar ele para determinar o status na data de análise
        if (contractHistory.length > 0) {
          // Ordenar histórico por data (garante ordem cronológica ESTRITA)
          const sortedHistory = [...contractHistory].sort((a, b) => {
            const dateA = new Date(a.status_date);
            const dateB = new Date(b.status_date);
            // Comparação precisa de datas
            const diff = dateA.getTime() - dateB.getTime();
            // Se mesma data, termination vem antes de reactivation
            if (diff === 0) {
              if (a.status_type === 'termination' && b.status_type === 'reactivation') return -1;
              if (a.status_type === 'reactivation' && b.status_type === 'termination') return 1;
            }
            return diff;
          });
          
          // Determinar status na data de análise baseado no histórico completo
          let currentStatus: 'Ativo' | 'Inativo' = 'Ativo'; // Assume ativo inicialmente
          let lastProcessedDate: Date | null = null;
          
          // Processar cada entrada do histórico em ordem cronológica
          for (let i = 0; i < sortedHistory.length; i++) {
            const entry = sortedHistory[i];
            const statusDate = new Date(entry.status_date);
            
            // Se a data do status é posterior à data analisada, parar
            if (statusDate > analysisDate) {
              break;
            }
            
            // Atualizar o status atual baseado no tipo de evento
            // O último evento válido antes da data de análise determina o status
            if (entry.status_type === 'termination') {
              currentStatus = 'Inativo';
              console.log(`   🔴 ${entry.status_date}: INATIVADO`);
            } else if (entry.status_type === 'reactivation') {
              currentStatus = 'Ativo';
              console.log(`   🟢 ${entry.status_date}: REATIVADO`);
            }
          }
          
          console.log(`📅 [${contract.contract_number}] Status em ${analysisDate.toISOString().slice(0, 10)}:`, {
            statusCalculado: currentStatus,
            totalEventos: sortedHistory.length,
            historicoDetalhado: sortedHistory.map(h => ({
              data: h.status_date,
              tipo: h.status_type,
              status: h.status,
              resultado: h.status_type === 'termination' ? '🔴 INATIVADO' : '🟢 REATIVADO'
            }))
          });
          
          // Incluir contrato APENAS se estava ativo na data de análise
          return currentStatus === 'Ativo';
        }
        
        // Se não há histórico, usar status atual do contrato
        console.log(`📅 [${contract.contract_number}] Sem histórico, usando status atual: ${contract.status}`);
        return contract.status === 'Ativo';
      })
      .map(contract => {
        // Parse valores base do contrato
        const originalBaseValue = parseFloat(contract.monthly_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
        
        // CORREÇÃO: Aplicar reajustes baseados na data de análise para média mensal
        const adjustedBaseValue = getEffectiveValueForContract(contract.id, originalBaseValue, analysisDate);
        
        const planType = contract.plan_type || 'mensal';
        const employeeCount = parseInt(contract.employee_count || '1');
        const cnpjCount = parseInt(contract.cnpj_count || '1');
        const trialDays = parseInt(contract.trial_days || '30');
        const contractStartDate = contract.start_date ? new Date(contract.start_date) : null;
        
        // Calcular addons (excluindo reajustes que já estão no valor base)
        const addonValue = calculateAddonValue(contract.id, adjustedBaseValue);
        
        // Valor total = valor base ajustado + addons reais (não reajustes)
        const totalValue = adjustedBaseValue + addonValue;
        
        console.log(`🔧 CORREÇÃO - Aplicando ajustes na média mensal:`, {
          contrato: contract.contract_number,
          valorOriginal: originalBaseValue,
          valorAjustado: adjustedBaseValue,
          diferenca: adjustedBaseValue - originalBaseValue,
          dataAnalise: analysisDate.toISOString().slice(0, 7)
        });

        let monthlyRevenue = 0;
        let annualRevenue = 0;

        // Verificar se o cliente está sendo cobrado no mês da análise
        if (contractStartDate) {
          const isBeingBilled = isClientBeingBilled(contractStartDate, trialDays, analysisDate);
          
          if (isBeingBilled) {
            // Cliente está sendo cobrado - calcular receita normal
            if (planType === 'anual') {
              monthlyRevenue = totalValue / 12;
              annualRevenue = totalValue;
            } else if (planType === 'semestral') {
              monthlyRevenue = totalValue / 6;
              annualRevenue = totalValue * 2;
            } else {
              monthlyRevenue = totalValue;
              annualRevenue = totalValue * 12;
            }
            
            console.log(`💰 Contrato ${contract.contract_number} SENDO COBRADO:`, {
              valor_base: adjustedBaseValue,
              receita_mensal: monthlyRevenue,
              tipo_plano: planType
            });
          } else {
            // Cliente em período de teste - receita zero
            console.log(`🆓 Contrato ${contract.contract_number} EM PERÍODO DE TESTE:`, {
              data_inicio: contractStartDate.toISOString().slice(0, 10),
              dias_teste: trialDays,
              receita_mensal: 0
            });
          }
        } else {
          // Se não tem data de início, calcular receita normalmente (fallback para contratos antigos)
          if (planType === 'anual') {
            monthlyRevenue = totalValue / 12;
            annualRevenue = totalValue;
          } else if (planType === 'semestral') {
            monthlyRevenue = totalValue / 6;
            annualRevenue = totalValue * 2;
          } else {
            monthlyRevenue = totalValue;
            annualRevenue = totalValue * 12;
          }
        }

        return {
          contractId: contract.id,
          contractNumber: contract.contract_number,
          baseValue: adjustedBaseValue,
          addonValue,
          totalValue,
          monthlyRevenue,
          annualRevenue,
          planType,
          status: contract.status,
          startDate: contractStartDate,
          renewalDate: contract.renewal_date ? new Date(contract.renewal_date) : null,
          contractor: contract.contractors?.[0] || null,
          employeeCount,
          cnpjCount
        };
      });
  }, [contracts, contractAddons, analysisDate]);

  return {
    contractRevenues,
    calculateAddonValue
  };
};
