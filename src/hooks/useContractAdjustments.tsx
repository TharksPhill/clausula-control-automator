import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useContracts } from "./useContracts";

export interface ContractAdjustment {
  id: string;
  contract_id: string;
  user_id: string;
  adjustment_type: 'value' | 'percentage';
  adjustment_value: number;
  renewal_date: string;
  previous_value: number;
  new_value: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  effective_date: string;
}

export interface CreateAdjustmentData {
  contract_id: string;
  adjustment_type: 'value' | 'percentage';
  adjustment_value: number;
  renewal_date: string;
  previous_value: number;
  new_value: number;
  notes?: string;
  effective_date: string;
}

export function useContractAdjustments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { contracts } = useContracts();

  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ["contract-adjustments"],
    queryFn: async () => {
      console.log("🔍 HOOK - Buscando ajustes do banco de dados...");
      
      const { data, error } = await supabase
        .from("contract_adjustments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ HOOK - Erro ao buscar ajustes:", error);
        throw error;
      }
      
      console.log("✅ HOOK - Ajustes carregados do banco:", {
        quantidade: data?.length || 0,
        ajustes: data?.map(adj => ({
          id: adj.id,
          contract_id: adj.contract_id,
          effective_date: adj.effective_date,
          new_value: adj.new_value,
          previous_value: adj.previous_value
        }))
      });
      
      return data as ContractAdjustment[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (adjustmentData: CreateAdjustmentData) => {
      console.log("🚀 HOOK - INICIANDO criação de ajuste:", adjustmentData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("❌ HOOK - Usuário não autenticado");
        throw new Error("User not authenticated");
      }

      console.log("👤 HOOK - Usuário autenticado:", user.id);

      // Verificar se é uma mudança de plano automática para recalcular custos de licença
      const isAutomaticPlanChange = adjustmentData.notes?.includes('Mudança de plano automática:');
      
      let costPlanUpdateData = null;
      if (isAutomaticPlanChange) {
        console.log("🔄 HOOK - Detectada mudança de plano automática, recalculando custos...");
        
        // Extrair dados da mudança de plano das notas
        const match = adjustmentData.notes.match(/(\d+) funcionários, (\d+) CNPJs, plano (\w+)/);
        if (match) {
          const [, employees, cnpjs, planType] = match;
          console.log("📊 HOOK - Dados extraídos:", {
            funcionarios: employees,
            cnpjs: cnpjs,
            tipo_plano: planType
          });
          
          // Buscar planos e addons disponíveis
          const [plansResult, addonsResult] = await Promise.all([
            supabase
              .from("plans")
              .select("*")
              .eq("user_id", user.id)
              .eq("is_active", true),
            supabase
              .from("plan_addons")
              .select("*")
              .eq("user_id", user.id)
              .eq("is_active", true)
          ]);

          if (plansResult.data && addonsResult.data) {
            const plansData = plansResult.data;
            const addonsData = addonsResult.data;
            
            // Calcular custo de licença baseado no novo plano
            const employeeCount = parseInt(employees);
            const cnpjCount = parseInt(cnpjs);
            
            // Encontrar plano base
            const matchingPlans = plansData.filter(plan => {
              const [min, max] = plan.employee_range.split('-').map(Number);
              return employeeCount >= min && employeeCount <= max;
            });
            
            let basePlan;
            if (matchingPlans.length > 0) {
              basePlan = matchingPlans.reduce((cheapest, current) => 
                current.monthly_price < cheapest.monthly_price ? current : cheapest
              );
            } else {
              // Fallback para o plano mais barato
              basePlan = plansData.reduce((cheapest, current) => 
                current.monthly_price < cheapest.monthly_price ? current : cheapest
              );
            }
            
            if (basePlan) {
              // Calcular funcionários e CNPJs extras
              const [, maxEmployees] = basePlan.employee_range.split('-').map(Number);
              const extraEmployees = Math.max(0, employeeCount - maxEmployees);
              const extraEmployeeGroups = Math.ceil(extraEmployees / 100);
              const extraCnpjs = Math.max(0, cnpjCount - basePlan.allowed_cnpjs);
              
              // Calcular custos extras
              const employeeAddon = addonsData.find(addon => 
                addon.name.toLowerCase().includes('funcionários') || 
                addon.name.toLowerCase().includes('employee')
              );
              const cnpjAddon = addonsData.find(addon => 
                addon.name.toLowerCase().includes('cnpj')
              );
              
              const extraEmployeeCost = extraEmployeeGroups * (employeeAddon?.license_cost || 0);
              const extraCnpjCost = extraCnpjs * (cnpjAddon?.license_cost || 0);
              
              // Custo total de licença = custo base do plano + custos extras
              const totalLicenseCost = (basePlan.license_cost || 0) + extraEmployeeCost + extraCnpjCost;
              
              console.log("💰 HOOK - Novo custo de licença calculado:", {
                plano_base: basePlan.name,
                custo_base_licenca: basePlan.license_cost,
                funcionarios_extras: extraEmployees,
                grupos_extras: extraEmployeeGroups,
                custo_funcionarios_extras: extraEmployeeCost,
                cnpjs_extras: extraCnpjs,
                custo_cnpjs_extras: extraCnpjCost,
                custo_total_licenca: totalLicenseCost
              });
              
              costPlanUpdateData = {
                contract_id: adjustmentData.contract_id,
                new_license_cost: totalLicenseCost,
                plan_details: {
                  plan_name: basePlan.name,
                  base_license_cost: basePlan.license_cost,
                  extra_employee_cost: extraEmployeeCost,
                  extra_cnpj_cost: extraCnpjCost,
                  total_license_cost: totalLicenseCost
                }
              };
            }
          }
        }
      }

      const dataToInsert = {
        ...adjustmentData,
        user_id: user.id,
      };

      console.log("💾 HOOK - Dados que serão inseridos no banco:", dataToInsert);

      const { data, error } = await supabase
        .from("contract_adjustments")
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error("❌ HOOK - Erro ao inserir no banco:", error);
        console.error("❌ HOOK - Detalhes do erro:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log("✅ HOOK - Ajuste SALVO NO BANCO com sucesso:", data);
      
      // Retornar dados do ajuste junto com informações de custo se disponível
      return { 
        adjustment: data as ContractAdjustment,
        costPlanUpdate: costPlanUpdateData
      };
    },
    onSuccess: async (data) => {
      console.log("🎉 HOOK - Sucesso na criação, invalidando queries...");
      
      // Invalidar múltiplas queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["contract-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["profit-analysis"] });
      queryClient.invalidateQueries({ queryKey: ["contract-revenue"] });
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      queryClient.invalidateQueries({ queryKey: ["cost-plans"] });
      
      // Forçar refetch das queries principais para garantir atualização imediata
      await queryClient.refetchQueries({ queryKey: ["contracts"] });
      await queryClient.refetchQueries({ queryKey: ["profit-analysis"] });
      await queryClient.refetchQueries({ queryKey: ["contract-revenue"] });
      
      console.log("🔄 HOOK - Queries invalidadas e recarregadas, dados devem estar atualizados");
      
      // Se houve atualização de custo de licença, mostrar informação relevante
      if (data.costPlanUpdate) {
        console.log("💰 HOOK - Novo custo de licença calculado:", data.costPlanUpdate);
        toast({
          title: "✅ Mudança de plano aplicada",
          description: `Novo custo de licença: R$ ${data.costPlanUpdate.new_license_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        });
      } else {
        toast({
          title: "✅ Reajuste aplicado",
          description: `Reajuste criado com sucesso. Novo valor: R$ ${data.adjustment.new_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        });
      }
    },
    onError: (error) => {
      console.error("❌ HOOK - Erro completo na criação:", error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao aplicar reajuste",
        description: `Não foi possível salvar o reajuste. Erro: ${error.message}`,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("🗑️ HOOK - Removendo ajuste:", id);
      
      const { error } = await supabase
        .from("contract_adjustments")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ HOOK - Erro ao remover ajuste:", error);
        throw error;
      }
      
      console.log("✅ HOOK - Ajuste removido com sucesso");
    },
    onSuccess: () => {
      console.log("🔄 HOOK - Removido com sucesso, invalidando queries...");
      
      queryClient.invalidateQueries({ queryKey: ["contract-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["profit-analysis"] });
      
      toast({
        title: "🗑️ Reajuste removido",
        description: "O reajuste foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error("❌ HOOK - Erro ao remover ajuste:", error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao remover reajuste",
        description: "Não foi possível remover o reajuste.",
      });
    },
  });

  const getAdjustmentsForContract = (contractId: string) => {
    const contractAdjustments = adjustments.filter(adj => adj.contract_id === contractId);
    
    console.log(`🔍 HOOK - Buscando ajustes para contrato ${contractId}:`, {
      totalAjustes: adjustments.length,
      ajustesDoContrato: contractAdjustments.length,
      ajustes: contractAdjustments.map(adj => ({
        id: adj.id,
        effective_date: adj.effective_date,
        new_value: adj.new_value
      }))
    });
    
    return contractAdjustments;
  };

  const getEffectiveValueForContract = (contractId: string, baseValue: number, asOfDate?: Date) => {
    const contractAdjustments = getAdjustmentsForContract(contractId);
    
    if (contractAdjustments.length === 0) {
      console.log(`📊 HOOK - Nenhum ajuste encontrado para contrato ${contractId}, usando valor base: ${baseValue}`);
      return baseValue;
    }

    // Se não especificou data, usar data atual
    const targetDate = asOfDate || new Date();
    
    // Buscar o contrato para verificar o tipo de plano
    const contract = contracts?.find(c => c.id === contractId);
    const planType = contract?.plan_type?.toLowerCase() || 'mensal';
    
    console.log(`🔍 HOOK - CALCULANDO valor efetivo para contrato ${contractId}:`, {
      valorBase: baseValue,
      dataAlvo: targetDate.toISOString().split('T')[0],
      tipoPlan: planType,
      ajustesDisponiveis: contractAdjustments.length,
      ajustes: contractAdjustments.map(adj => ({
        id: adj.id,
        dataEfetiva: adj.effective_date,
        valorNovo: adj.new_value,
        valorAnterior: adj.previous_value,
        dataCriacao: adj.created_at
      }))
    });
    
    // Filtrar apenas ajustes efetivos até a data alvo
    const validAdjustments = contractAdjustments
      .filter(adj => {
        const effectiveDate = new Date(adj.effective_date);
        let isEffective = false;
        
        // Para contratos anuais e semestrais, considerar ajustes do mesmo mês/ano como válidos
        if (planType === 'anual' || planType === 'semestral') {
          // Se o ajuste é do mesmo mês e ano ou anterior, considerar válido
          const targetMonth = targetDate.getMonth();
          const targetYear = targetDate.getFullYear();
          const effectiveMonth = effectiveDate.getMonth();
          const effectiveYear = effectiveDate.getFullYear();
          
          isEffective = effectiveYear < targetYear || 
                       (effectiveYear === targetYear && effectiveMonth <= targetMonth);
        } else {
          // Para contratos mensais, usar comparação de data completa
          isEffective = effectiveDate <= targetDate;
        }
        
        console.log(`📅 HOOK - Verificando ajuste ${adj.id}:`, {
          dataEfetiva: adj.effective_date,
          dataAlvo: targetDate.toISOString().split('T')[0],
          tipoPlan: planType,
          estaEfetivo: isEffective,
          valorNovo: adj.new_value
        });
        return isEffective;
      })
      // Ordenar por data efetiva (mais antigo primeiro) e depois por data de criação (mais recente primeiro para desempate)
      .sort((a, b) => {
        const dateA = new Date(a.effective_date);
        const dateB = new Date(b.effective_date);
        if (dateA.getTime() === dateB.getTime()) {
          // Se mesma data efetiva, ordenar por data de criação (mais recente primeiro)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return dateA.getTime() - dateB.getTime();
      });

    console.log(`📅 HOOK - Ajustes válidos encontrados (ordenados):`, {
      quantidade: validAdjustments.length,
      ajustes: validAdjustments.map(adj => ({
        id: adj.id,
        dataEfetiva: adj.effective_date,
        dataCriacao: adj.created_at,
        valorNovo: adj.new_value,
        valorAnterior: adj.previous_value
      }))
    });

    // Se não há ajustes válidos, usar valor base
    if (validAdjustments.length === 0) {
      console.log(`⚠️ HOOK - Nenhum ajuste válido encontrado, usando valor base: ${baseValue}`);
      return baseValue;
    }

    // Remover duplicatas por data efetiva (manter apenas o mais recente de cada data)
    const uniqueAdjustments = validAdjustments.reduce((acc, current) => {
      const existingIndex = acc.findIndex(adj => adj.effective_date === current.effective_date);
      if (existingIndex >= 0) {
        // Se já existe um ajuste para esta data, manter o mais recente (já ordenado)
        return acc;
      } else {
        acc.push(current);
        return acc;
      }
    }, [] as ContractAdjustment[]);

    console.log(`🔄 HOOK - Ajustes únicos após remoção de duplicatas:`, {
      quantidade: uniqueAdjustments.length,
      ajustes: uniqueAdjustments.map(adj => ({
        id: adj.id,
        dataEfetiva: adj.effective_date,
        valorNovo: adj.new_value
      }))
    });

    // Aplicar ajustes sequencialmente, sempre usando o new_value do último ajuste válido
    let currentValue = baseValue;
    
    for (const adjustment of uniqueAdjustments) {
      const previousValue = currentValue;
      currentValue = adjustment.new_value; // Usar sempre o new_value
      
      console.log(`🔄 HOOK - Aplicando ajuste sequencial:`, {
        ajusteId: adjustment.id,
        valorAnterior: previousValue,
        valorNovo: currentValue,
        dataEfetiva: adjustment.effective_date
      });
    }

    console.log(`✅ HOOK - Valor final calculado:`, {
      valorInicial: baseValue,
      valorFinal: currentValue,
      ajustesAplicados: uniqueAdjustments.length,
      dataCalculada: targetDate.toISOString().split('T')[0]
    });

    return currentValue;
  };

  return {
    adjustments,
    isLoading,
    createAdjustment: createMutation.mutate,
    deleteAdjustment: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    getAdjustmentsForContract,
    getEffectiveValueForContract,
  };
}
