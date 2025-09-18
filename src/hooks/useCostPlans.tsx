import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface CostPlan {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  base_license_cost: number;
  billing_type: 'monthly' | 'semiannual' | 'annual';
  early_payment_discount_percentage: number;
  exemption_period_months: number;
  min_employees?: number;
  max_employees?: number;
  max_cnpjs?: number;
  is_active: boolean;
  projected_quantity?: number;
  projected_plan_value?: number;
  created_at: string;
  updated_at: string;
}

export interface ContractCostConfiguration {
  id: string;
  user_id: string;
  contract_id: string;
  cost_plan_id: string;
  tax_percentage: number;
  labor_cost_percentage: number;
  fixed_cost_percentage: number;
  client_trial_period_days: number;
  created_at: string;
  updated_at: string;
  cost_plan?: CostPlan;
}

export interface CostPlanChange {
  id: string;
  cost_plan_id: string;
  contract_id?: string;
  changed_by_user_id: string;
  previous_cost?: number;
  new_cost: number;
  change_reason?: string;
  effective_date: string;
  created_at: string;
}

export interface ContractProfitCalculation {
  contractId: string;
  contractNumber: string;
  contractValue: number;
  grossRevenue: number;
  totalCosts: number;
  licenseCost: number;
  taxCost: number;
  laborCost: number;
  fixedCost: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  netProfitMargin: number;
  supplierTrialImpact: number;
  clientTrialImpact: number;
  roiTimeMonths?: number;
}

export interface ContractMatch {
  id: string;
  contract_number: string;
  employee_count: number;
  cnpj_count: number;
  monthly_value: number;
  matches: boolean;
  reason?: string;
}

export const useCostPlans = () => {
  const [costPlans, setCostPlans] = useState<CostPlan[]>([]);
  const [contractConfigurations, setContractConfigurations] = useState<ContractCostConfiguration[]>([]);
  const [costPlanChanges, setCostPlanChanges] = useState<CostPlanChange[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractAddons, setContractAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Buscar contratos para análise
  const fetchContracts = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          contractors:contractors(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("Erro ao buscar contratos:", error);
    }
  };

  // Buscar addons de contratos
  const fetchContractAddons = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("contract_addons")
        .select(`
          *,
          contract:contracts!inner(
            id,
            contract_number,
            user_id,
            status
          )
        `)
        .eq("contract.user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContractAddons(data || []);
    } catch (error) {
      console.error("Erro ao buscar addons de contratos:", error);
    }
  };

  // Calcular valor adicional total por contrato (addons ativos)
  const getContractAddonValue = (contractId: string): number => {
    const contractAddonsList = contractAddons.filter(addon => 
      addon.contract_id === contractId && 
      addon.addon_type !== 'plan_change' // Excluir mudanças de plano, focar em adicionais
    );

    return contractAddonsList.reduce((total, addon) => {
      // Converter new_value para número
      const addonValue = parseFloat(addon.new_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
      return total + addonValue;
    }, 0);
  };

  // Calcular receita real do contrato incluindo addons
  const getContractTotalRevenue = (contract: any): number => {
    const baseValue = parseFloat(contract.monthly_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
    const addonValue = getContractAddonValue(contract.id);
    
    console.log(`💰 Receita do contrato ${contract.contract_number}:`, {
      valor_base: baseValue,
      valor_addons: addonValue,
      total: baseValue + addonValue
    });
    
    return baseValue + addonValue;
  };

  // Verificar quais contratos se encaixam em um plano de custo (considerando addons)
  const getMatchingContracts = (costPlan: Partial<CostPlan>): ContractMatch[] => {
    return contracts.map(contract => {
      const employeeCount = parseInt(contract.employee_count) || 0;
      const cnpjCount = parseInt(contract.cnpj_count) || 0;
      
      // Calcular funcionários e CNPJs adicionais dos addons
      const addons = contractAddons.filter(addon => addon.contract_id === contract.id);
      let additionalEmployees = 0;
      let additionalCnpjs = 0;
      
      addons.forEach(addon => {
        if (addon.description?.toLowerCase().includes('funcionário') || addon.description?.toLowerCase().includes('employee')) {
          additionalEmployees += parseInt(addon.new_value) || 0;
        }
        if (addon.description?.toLowerCase().includes('cnpj')) {
          additionalCnpjs += parseInt(addon.new_value) || 0;
        }
      });

      const totalEmployees = employeeCount + additionalEmployees;
      const totalCnpjs = cnpjCount + additionalCnpjs;
      const totalRevenue = getContractTotalRevenue(contract);

      let matches = true;
      let reasons: string[] = [];

      // Verificar limite de funcionários
      if (costPlan.min_employees && totalEmployees < costPlan.min_employees) {
        matches = false;
        reasons.push(`Mín. ${costPlan.min_employees} funcionários`);
      }
      
      if (costPlan.max_employees && totalEmployees > costPlan.max_employees) {
        matches = false;
        reasons.push(`Máx. ${costPlan.max_employees} funcionários`);
      }

      // Verificar limite de CNPJs
      if (costPlan.max_cnpjs && totalCnpjs > costPlan.max_cnpjs) {
        matches = false;
        reasons.push(`Máx. ${costPlan.max_cnpjs} CNPJs`);
      }

      return {
        id: contract.id,
        contract_number: contract.contract_number,
        employee_count: totalEmployees,
        cnpj_count: totalCnpjs,
        monthly_value: totalRevenue,
        matches,
        reason: reasons.length > 0 ? reasons.join(', ') : undefined
      };
    });
  };

  // Associar automaticamente contratos a um plano de custo
  const autoAssociateContracts = async (costPlanId: string) => {
    try {
      const costPlan = costPlans.find(plan => plan.id === costPlanId);
      if (!costPlan) return;

      const matchingContracts = getMatchingContracts(costPlan).filter(match => match.matches);
      
      for (const contract of matchingContracts) {
        // Verificar se já existe configuração para este contrato
        const existingConfig = contractConfigurations.find(
          config => config.contract_id === contract.id
        );

        if (!existingConfig) {
          await saveContractConfiguration({
            contract_id: contract.id,
            cost_plan_id: costPlanId,
            tax_percentage: 17.5, // Valor padrão
            labor_cost_percentage: 0,
            fixed_cost_percentage: 0,
            client_trial_period_days: 0
          });
        }
      }

      toast({
        title: "Sucesso",
        description: `${matchingContracts.length} contratos foram associados automaticamente`,
      });

      await fetchContractConfigurations();
    } catch (error) {
      console.error("Erro ao associar contratos:", error);
      toast({
        title: "Erro",
        description: "Erro ao associar contratos automaticamente",
        variant: "destructive",
      });
    }
  };

  // Buscar planos de custo
  const fetchCostPlans = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("cost_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCostPlans((data || []) as CostPlan[]);
    } catch (error) {
      console.error("Erro ao buscar planos de custo:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos de custo",
        variant: "destructive",
      });
    }
  };

  // Buscar configurações de custo por contrato
  const fetchContractConfigurations = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("contract_cost_configurations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContractConfigurations((data || []) as ContractCostConfiguration[]);
    } catch (error) {
      console.error("Erro ao buscar configurações de contrato:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de contrato",
        variant: "destructive",
      });
    }
  };

  // Buscar histórico de mudanças
  const fetchCostPlanChanges = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("cost_plan_changes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setCostPlanChanges(data || []);
    } catch (error) {
      console.error("Erro ao buscar histórico de mudanças:", error);
    }
  };

  // Calcular projeção total de receita baseada nos valores de venda dos planos + addons
  const getProjectedTotalRevenue = (): number => {
    // Receita base dos planos
    const basePlanRevenue = costPlans.reduce((total, plan) => {
      if (!plan.is_active || !plan.projected_quantity || !plan.projected_plan_value) return total;
      
      const planRevenue = plan.projected_plan_value * plan.projected_quantity;
      console.log(`📊 Plano ${plan.name}: R$ ${plan.projected_plan_value} × ${plan.projected_quantity} = R$ ${planRevenue}`);
      
      return total + planRevenue;
    }, 0);

    // Receita adicional dos addons de contratos ativos
    const addonsRevenue = contracts
      .filter(contract => contract.status === 'Ativo')
      .reduce((total, contract) => {
        const addonValue = getContractAddonValue(contract.id);
        return total + addonValue;
      }, 0);

    console.log(`💰 RECEITA TOTAL PROJETADA:`, {
      receita_base_planos: basePlanRevenue,
      receita_addons: addonsRevenue,
      total: basePlanRevenue + addonsRevenue
    });

    return basePlanRevenue + addonsRevenue;
  };

  // Calcular custos operacionais projetados incluindo custos de addons
  const getProjectedOperationalCosts = (): number => {
    const baseCosts = costPlans.reduce((total, plan) => {
      if (!plan.is_active || !plan.projected_quantity) return total;
      
      const monthlyLicenseCost = getMonthlyLicenseCost(plan);
      return total + (monthlyLicenseCost * plan.projected_quantity);
    }, 0);

    // Calcular custos adicionais baseados nos addons
    const addonsCosts = contracts
      .filter(contract => contract.status === 'Ativo')
      .reduce((total, contract) => {
        const addons = contractAddons.filter(addon => addon.contract_id === contract.id);
        
        return total + addons.reduce((addonTotal, addon) => {
          // Estimar custo do addon baseado no tipo
          if (addon.description?.toLowerCase().includes('funcionário') || addon.description?.toLowerCase().includes('employee')) {
            const additionalEmployees = parseInt(addon.new_value) || 0;
            // Custo adicional por funcionário (pode ser configurável)
            return addonTotal + (additionalEmployees * 50); // R$ 50 por funcionário adicional
          }
          if (addon.description?.toLowerCase().includes('cnpj')) {
            const additionalCnpjs = parseInt(addon.new_value) || 0;
            // Custo adicional por CNPJ (pode ser configurável)
            return addonTotal + (additionalCnpjs * 100); // R$ 100 por CNPJ adicional
          }
          return addonTotal;
        }, 0);
      }, 0);

    console.log(`💸 CUSTOS OPERACIONAIS PROJETADOS:`, {
      custos_base: baseCosts,
      custos_addons: addonsCosts,
      total: baseCosts + addonsCosts
    });

    return baseCosts + addonsCosts;
  };

  // Obter faturamento projetado por plano individual incluindo addons
  const getProjectedRevenueByPlan = (planId: string): number => {
    const plan = costPlans.find(p => p.id === planId);
    if (!plan || !plan.projected_quantity || !plan.projected_plan_value) return 0;
    
    const baseRevenue = plan.projected_plan_value * plan.projected_quantity;
    
    // Somar addons de contratos que usam este plano
    const planAddonsRevenue = contracts
      .filter(contract => {
        const config = contractConfigurations.find(c => c.contract_id === contract.id);
        return config?.cost_plan_id === planId && contract.status === 'Ativo';
      })
      .reduce((total, contract) => {
        return total + getContractAddonValue(contract.id);
      }, 0);

    return baseRevenue + planAddonsRevenue;
  };

  // Salvar plano de custo
  const saveCostPlan = async (plan: Omit<CostPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!user) throw new Error("Usuário não encontrado");

      const { data, error } = await supabase
        .from("cost_plans")
        .insert({
          ...plan,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano de custo salvo com sucesso",
      });

      await fetchCostPlans();
      
      // Auto-associar contratos compatíveis
      if (data) {
        await autoAssociateContracts(data.id);
      }
      
      return data;
    } catch (error) {
      console.error("Erro ao salvar plano de custo:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar plano de custo",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Atualizar plano de custo
  const updateCostPlan = async (id: string, plan: Partial<CostPlan>) => {
    try {
      const { error } = await supabase
        .from("cost_plans")
        .update(plan)
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano de custo atualizado com sucesso",
      });

      await fetchCostPlans();
    } catch (error) {
      console.error("Erro ao atualizar plano de custo:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano de custo",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Excluir plano de custo
  const deleteCostPlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from("cost_plans")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano de custo excluído com sucesso",
      });

      await fetchCostPlans();
    } catch (error) {
      console.error("Erro ao excluir plano de custo:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir plano de custo",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Salvar configuração de contrato
  const saveContractConfiguration = async (config: Omit<ContractCostConfiguration, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'cost_plan'>) => {
    try {
      if (!user) throw new Error("Usuário não encontrado");

      const { data, error } = await supabase
        .from("contract_cost_configurations")
        .upsert({
          ...config,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração de contrato salva com sucesso",
      });

      await fetchContractConfigurations();
      return data;
    } catch (error) {
      console.error("Erro ao salvar configuração de contrato:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração de contrato",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Calcular custo efetivo considerando desconto
  const calculateEffectiveCost = (costPlan: CostPlan) => {
    const baseCost = costPlan.base_license_cost;
    const discount = costPlan.early_payment_discount_percentage / 100;
    return baseCost * (1 - discount);
  };

  // Calcular conversão de custo para mensal
  const getMonthlyLicenseCost = (costPlan: CostPlan) => {
    const effectiveCost = calculateEffectiveCost(costPlan);
    
    switch (costPlan.billing_type) {
      case 'annual':
        return effectiveCost / 12;
      case 'semiannual':
        return effectiveCost / 6;
      default:
        return effectiveCost;
    }
  };

  // Calcular lucro detalhado do contrato incluindo addons
  const calculateContractProfit = (
    contractValue: number,
    costPlan: CostPlan,
    config: ContractCostConfiguration,
    employeeCosts: number = 0,
    fixedCosts: number = 0,
    contractId?: string
  ): ContractProfitCalculation => {
    // Incluir valor dos addons na receita
    const addonValue = contractId ? getContractAddonValue(contractId) : 0;
    const totalRevenue = contractValue + addonValue;
    
    const monthlyLicenseCost = getMonthlyLicenseCost(costPlan);
    const grossRevenue = totalRevenue;
    
    // Custos base
    let licenseCost = monthlyLicenseCost;
    
    // Adicionar custos dos addons se houver contrato
    if (contractId) {
      const addons = contractAddons.filter(addon => addon.contract_id === contractId);
      addons.forEach(addon => {
        if (addon.description?.toLowerCase().includes('funcionário')) {
          const additionalEmployees = parseInt(addon.new_value) || 0;
          licenseCost += additionalEmployees * 50; // Custo adicional por funcionário
        }
        if (addon.description?.toLowerCase().includes('cnpj')) {
          const additionalCnpjs = parseInt(addon.new_value) || 0;
          licenseCost += additionalCnpjs * 100; // Custo adicional por CNPJ
        }
      });
    }
    
    const taxCost = grossRevenue * (config.tax_percentage / 100);
    const laborCost = grossRevenue * (config.labor_cost_percentage / 100);
    const fixedCost = grossRevenue * (config.fixed_cost_percentage / 100);
    
    const totalCosts = licenseCost + taxCost + laborCost + fixedCost;
    const grossProfit = grossRevenue - totalCosts;
    const netProfit = grossProfit;
    
    const profitMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
    const netProfitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    
    // Impacto dos períodos de teste
    const supplierTrialImpact = costPlan.exemption_period_months * monthlyLicenseCost;
    const clientTrialImpact = (config.client_trial_period_days / 30) * totalRevenue;
    
    // Tempo de ROI
    let roiTimeMonths: number | undefined;
    if (netProfit > 0) {
      const initialInvestment = supplierTrialImpact + clientTrialImpact;
      if (initialInvestment > 0) {
        roiTimeMonths = initialInvestment / netProfit;
      }
    }

    console.log(`📊 Análise de lucro do contrato ${contractId}:`, {
      receita_base: contractValue,
      valor_addons: addonValue,
      receita_total: totalRevenue,
      custo_licenca_base: monthlyLicenseCost,
      custo_licenca_total: licenseCost,
      lucro_bruto: grossProfit,
      margem: profitMargin
    });

    return {
      contractId: contractId || '',
      contractNumber: '',
      contractValue: totalRevenue,
      grossRevenue: totalRevenue,
      totalCosts,
      licenseCost,
      taxCost,
      laborCost,
      fixedCost,
      grossProfit,
      netProfit,
      profitMargin,
      netProfitMargin,
      supplierTrialImpact,
      clientTrialImpact,
      roiTimeMonths
    };
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCostPlans(),
        fetchContractConfigurations(),
        fetchCostPlanChanges(),
        fetchContracts(),
        fetchContractAddons()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  return {
    costPlans,
    contractConfigurations,
    costPlanChanges,
    contracts,
    contractAddons,
    loading,
    saveCostPlan,
    updateCostPlan,
    deleteCostPlan,
    saveContractConfiguration,
    calculateEffectiveCost,
    getMonthlyLicenseCost,
    calculateContractProfit,
    getMatchingContracts,
    autoAssociateContracts,
    getProjectedTotalRevenue,
    getProjectedOperationalCosts,
    getProjectedRevenueByPlan,
    getContractAddonValue,
    getContractTotalRevenue,
    loadAllData
  };
};
