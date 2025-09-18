import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlans } from "./usePlans";
import { usePlanAddons } from "./usePlanAddons";
import { useEffect } from "react";
import { useContractStatusHistory } from "./useContractStatusHistory";

interface ContractLicenseCost {
  contractId: string;
  contractNumber: string;
  licenseCost: number;
  employeeCount: number;
  cnpjCount: number;
  planType: string;
  startDate: string;
  trialDays: number;
  exemptionMonths: number;
  terminationDate?: string;
}

export const useContractLicenseCosts = () => {
  const { plans = [] } = usePlans();
  const { planAddons = [] } = usePlanAddons();
  const queryClient = useQueryClient();

  // Atualizar automaticamente quando contratos são criados ou modificados
  useEffect(() => {
    const channel = supabase
      .channel('contracts-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'contracts' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['contract-license-costs'] });
          queryClient.invalidateQueries({ queryKey: ['contract-monthly-license-costs'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['contract-license-costs', plans, planAddons],
    queryFn: async () => {
      // Buscar todos os contratos (ativos e encerrados) para considerar custos históricos
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('*')
        .in('status', ['Ativo', 'Encerrado']);

      if (error) throw error;
      if (!contracts) return [];

      // Calcular o custo de licença para cada contrato usando a mesma lógica da análise de lucro
      const contractCosts: ContractLicenseCost[] = contracts.map(contract => {
        const employeeCount = parseInt(contract.employee_count || '0');
        const cnpjCount = parseInt(contract.cnpj_count || '0');
        const trialDays = parseInt(contract.trial_days || '30');

        // Calcular custo da licença usando EXATAMENTE a mesma lógica da análise de lucro
        const licenseCost = calculateLicenseCostFromPlans(
          parseFloat(contract.monthly_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0'),
          employeeCount,
          cnpjCount,
          contract.plan_type || 'mensal'
        );

        // Buscar o plano correspondente para obter meses de isenção
        const matchingPlan = plans.find(p => {
          if (!p.employee_range) return false;
          const [minEmp, maxEmp] = p.employee_range.split('-').map(n => parseInt(n.trim(), 10));
          return employeeCount >= minEmp && employeeCount <= maxEmp && p.is_active;
        });

        return {
          contractId: contract.id,
          contractNumber: contract.contract_number,
          licenseCost,
          employeeCount,
          cnpjCount,
          planType: contract.plan_type || 'mensal',
          startDate: contract.start_date || '',
          trialDays,
          exemptionMonths: matchingPlan?.license_exemption_months || 0,
          terminationDate: contract.termination_date || undefined
        };
      });

      return contractCosts;
    },
    enabled: plans.length > 0
  });

  // Função auxiliar para calcular custo da licença (IDÊNTICA à da análise de lucro)
  function calculateLicenseCostFromPlans(
    contractValue: number,
    employeeCount: number,
    cnpjCount: number,
    planType: string
  ): number {
    if (!plans || plans.length === 0) return 0;

    // Custos de licença dos adicionais (definidos pelo usuário)
    const cnpjAddon = planAddons?.find(a => a.is_active && /cnpj/i.test(a.name));
    const cnpjAddonLicense = cnpjAddon?.license_cost ?? 0;

    const employeesAddon = planAddons?.find(a => a.is_active && /funcion[áa]rio/i.test(a.name));
    const employeesAddonLicense = employeesAddon?.license_cost ?? 0;
    const employeesIncrement = employeesAddon?.package_increment ?? 100;

    console.log(`🎯 Calculando custo da licença com planos + adicionais | contrato=R$ ${contractValue}, func=${employeeCount}, cnpjs=${cnpjCount}, tipo=${planType}`);

    const activePlans = plans.filter(p => p.is_active);

    // Mapear todos os candidatos para obter o MENOR custo total da licença
    const candidates = activePlans.map(p => {
      if (!p.employee_range) return null;
      
      const [minEmp, maxEmp] = p.employee_range.split('-').map(n => parseInt(n.trim(), 10));
      const inRange = employeeCount >= minEmp && employeeCount <= maxEmp;

      // CNPJs extras acima do permitido pelo plano
      const extraCnpjs = Math.max(0, cnpjCount - (p.allowed_cnpjs || 0));
      const cnpjExtraCost = extraCnpjs * cnpjAddonLicense;

      // Funcionários extras caso o número ultrapasse o máximo da faixa do plano
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
    }).filter(Boolean);

    if (candidates.length === 0) {
      console.log(`❌ Nenhum plano ativo encontrado`);
      return 0;
    }

    // Preferir planos cuja faixa de funcionários atenda diretamente; em seguida, o menor custo total
    let subset = candidates.filter(c => c.inRange);
    if (subset.length === 0) subset = candidates;

    subset.sort((a, b) => {
      if (a.totalLicenseCost !== b.totalLicenseCost) return a.totalLicenseCost - b.totalLicenseCost;
      // Desempate: preferir plano que já cobre os CNPJs (menos extras)
      if (a.extraCnpjs !== b.extraCnpjs) return a.extraCnpjs - b.extraCnpjs;
      // Por fim, menor custo base de licença
      return (a.plan.license_cost || 0) - (b.plan.license_cost || 0);
    });

    const chosen = subset[0];
    console.log(`✅ Plano para custo de licença: ${chosen.plan.name} | base=R$ ${chosen.plan.license_cost} | extras: CNPJ=${chosen.extraCnpjs} x R$ ${cnpjAddonLicense}, FUNC=${chosen.extraEmployeesUnits} x R$ ${employeesAddonLicense} | total=R$ ${chosen.totalLicenseCost}`);
    return chosen.totalLicenseCost;
  }
};

// Hook para obter dados mensais de custo de licença para um contrato específico
export const useContractMonthlyLicenseCosts = (year: number) => {
  const { data: contractCosts = [] } = useContractLicenseCosts();
  const queryClient = useQueryClient();
  
  // Buscar histórico de status de contratos
  const { data: statusHistories } = useQuery({
    queryKey: ['contract-status-histories-for-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_status_history')
        .select('*')
        .order('status_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000 // Atualizar a cada 5 segundos para pegar mudanças recentes
  });

  // Atualizar automaticamente quando há mudanças
  useEffect(() => {
    const channels = ['contracts', 'plans', 'plan_addons', 'contract_status_history'].map(table => 
      supabase
        .channel(`${table}-changes-monthly`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table
          }, 
          () => {
            queryClient.invalidateQueries({ queryKey: ['contract-monthly-license-costs'] });
            queryClient.invalidateQueries({ queryKey: ['contract-status-histories-for-costs'] });
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['contract-monthly-license-costs', year, contractCosts, statusHistories],
    queryFn: async () => {
      if (contractCosts.length === 0) return [];

      // Para cada contrato, calcular o custo mensal considerando período de isenção e histórico de status
      return contractCosts.map(contract => {
        // Buscar histórico específico do contrato
        const contractHistory = (statusHistories || []).filter(h => h.contract_id === contract.contractId);
        
        const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => {
          const currentDate = new Date(year, monthIndex, 1);
          const currentMonthEnd = new Date(year, monthIndex + 1, 0);
          
          // Parse da data de início
          let startDate: Date;
          try {
            if (contract.startDate?.includes('/')) {
              const [d, m, y] = contract.startDate.split('/');
              startDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            } else if (contract.startDate?.includes('-')) {
              startDate = new Date(contract.startDate);
            } else {
              return 0;
            }
          } catch {
            return 0;
          }

          // Verificar se o contrato ainda não começou neste mês
          if (currentMonthEnd < startDate) {
            return 0;
          }

          // Calcular quando termina o período de isenção
          const exemptionEnd = new Date(startDate);
          exemptionEnd.setMonth(exemptionEnd.getMonth() + contract.exemptionMonths);
          
          // Ajustar para o primeiro dia do mês seguinte ao fim da isenção
          // (para começar a cobrar no mês correto)
          const billingStartMonth = new Date(exemptionEnd.getFullYear(), exemptionEnd.getMonth(), 1);

          // Se o mês atual é anterior ao início da cobrança, não há custo
          if (currentDate < billingStartMonth) {
            console.log(`[License Cost] Contract ${contract.contractNumber} - Month ${monthIndex + 1}/${year}: Still in exemption period`);
            return 0;
          }
          
          // Verificar se o contrato está inativo usando o histórico de status
          // IMPORTANTE: Verificar o status no FINAL do mês, não no início
          let currentStatus = 'active';
          
          // Ordenar histórico por data para garantir ordem cronológica
          const sortedHistory = [...contractHistory].sort((a, b) => {
            const dateA = new Date(a.status_date);
            const dateB = new Date(b.status_date);
            const diff = dateA.getTime() - dateB.getTime();
            // Se mesma data, termination vem antes de reactivation
            if (diff === 0) {
              if (a.status_type === 'termination' && b.status_type === 'reactivation') return -1;
              if (a.status_type === 'reactivation' && b.status_type === 'termination') return 1;
            }
            return diff;
          });
          
          // Processar cada entrada do histórico em ordem cronológica
          // para determinar o status no FINAL do mês
          for (const event of sortedHistory) {
            const eventDate = new Date(event.status_date);
            
            // Se o evento é posterior ao fim do mês atual, parar
            if (eventDate > currentMonthEnd) {
              break;
            }
            
            // Atualizar o status baseado no tipo de evento
            // O último evento até o fim do mês determina o status
            if (event.status_type === 'termination') {
              currentStatus = 'terminated';
            } else if (event.status_type === 'reactivation') {
              currentStatus = 'active';
            }
          }
          
          // Se o contrato está terminado NO FINAL DESTE MÊS, não cobrar licença
          if (currentStatus === 'terminated') {
            return 0;
          }
          
          // Após o período de isenção e se o contrato está ativo, aplicar o custo mensal da licença
          return contract.licenseCost;

          // Após o período de isenção e se o contrato está ativo, aplicar o custo mensal da licença
          return contract.licenseCost;
        });

        const totalValue = monthlyBreakdown.reduce((sum, value) => sum + value, 0);
        
        // Para o valor mensal, usar o valor fixo do custo de licença (não a média)
        // Se o contrato tem custo de licença, esse é o valor mensal recorrente
        const monthlyEstimate = contract.licenseCost;

        return {
          contractId: contract.contractId,
          contractNumber: contract.contractNumber,
          monthlyBreakdown,
          totalValue,
          monthlyEstimate, // Valor mensal fixo do custo de licença
          annualEstimate: totalValue
        };
      });
    },
    enabled: contractCosts.length > 0,
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });
};