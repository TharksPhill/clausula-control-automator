import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface EmployeeCost {
  id: string;
  name: string;
  position: string;
  salary: number;
  benefits: number;
  taxes: number;
  total_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Novos campos para cálculos detalhados
  department?: string;
  hourly_rate?: number;
  monthly_hours?: number;
  transport_allowance?: number;
  meal_allowance?: number;
  medical_allowance?: number;
  // Encargos trabalhistas
  vacation_provision?: number;
  thirteenth_salary_provision?: number;
  vacation_bonus_provision?: number;
  // Encargos sociais
  inss_rate?: number;
  fgts_rate?: number;
  fgts_provision_rate?: number;
  education_salary_rate?: number;
  incra_sest_sebrae_rate?: number;
  // Totais calculados
  total_labor_charges?: number;
  total_social_charges?: number;
  total_charges_percentage?: number;
}

export interface CompanyCost {
  id: string;
  user_id: string;
  category: string;
  description: string;
  monthly_cost: number;
  cost_type: string;
  is_active: boolean;
  projection_start_date?: string;
  projection_end_date?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyCostProjection {
  id: string;
  user_id: string;
  company_cost_id: string;
  year: number;
  month: number;
  projected_cost: number;
  actual_cost: number | null;
  is_edited: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractProfitAnalysis {
  id: string;
  contract_id: string;
  license_cost: number;
  allocated_employee_costs: number;
  allocated_company_costs: number;
  total_costs: number;
  contract_value: number;
  gross_profit: number;
  profit_margin: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const useCosts = () => {
  const [employeeCosts, setEmployeeCosts] = useState<EmployeeCost[]>([]);
  const [companyCosts, setCompanyCosts] = useState<CompanyCost[]>([]);
  const [costProjections, setCostProjections] = useState<CompanyCostProjection[]>([]);
  const [profitAnalyses, setProfitAnalyses] = useState<ContractProfitAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Função para calcular encargos trabalhistas
  const calculateLaborCharges = (salary: number) => {
    const vacationProvision = salary * 0.1111; // 11,11%
    const thirteenthSalaryProvision = salary * 0.0833; // 8,33%
    const vacationBonusProvision = salary * 0.0233; // 2,33%
    
    return {
      vacation_provision: vacationProvision,
      thirteenth_salary_provision: thirteenthSalaryProvision,
      vacation_bonus_provision: vacationBonusProvision,
      total_labor_charges: vacationProvision + thirteenthSalaryProvision + vacationBonusProvision
    };
  };

  // Função para calcular encargos sociais
  const calculateSocialCharges = (salary: number) => {
    const inss = salary * 0.20; // 20%
    const fgts = salary * 0.08; // 8%
    const fgtsProvision = salary * 0.04; // 4%
    
    return {
      inss: inss,
      fgts: fgts,
      fgts_provision: fgtsProvision,
      total_social_charges: inss + fgts + fgtsProvision
    };
  };

  // Buscar custos de funcionários
  const fetchEmployeeCosts = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("employee_costs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployeeCosts(data || []);
    } catch (error) {
      console.error("Erro ao buscar custos de funcionários:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar custos de funcionários",
        variant: "destructive",
      });
    }
  };

  // Buscar custos da empresa
  const fetchCompanyCosts = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("company_costs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompanyCosts((data || []) as CompanyCost[]);
    } catch (error) {
      console.error("Erro ao buscar custos da empresa:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar custos da empresa",
        variant: "destructive",
      });
    }
  };

  // Buscar análises de lucro
  const fetchProfitAnalyses = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("contract_profit_analysis")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfitAnalyses(data || []);
    } catch (error) {
      console.error("Erro ao buscar análises de lucro:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar análises de lucro",
        variant: "destructive",
      });
    }
  };

  // Salvar custo de funcionário
  const saveEmployeeCost = async (cost: Omit<EmployeeCost, 'id' | 'total_cost' | 'created_at' | 'updated_at'>) => {
    try {
      if (!user) throw new Error("Usuário não encontrado");

      const { data, error } = await supabase
        .from("employee_costs")
        .insert({
          ...cost,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Custo de funcionário salvo com sucesso",
      });

      await fetchEmployeeCosts();
      return data;
    } catch (error) {
      console.error("Erro ao salvar custo de funcionário:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar custo de funcionário",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Atualizar custo de funcionário
  const updateEmployeeCost = async (id: string, cost: Partial<EmployeeCost>) => {
    try {
      const { error } = await supabase
        .from("employee_costs")
        .update(cost)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Custo de funcionário atualizado com sucesso",
      });

      await fetchEmployeeCosts();
    } catch (error) {
      console.error("Erro ao atualizar custo de funcionário:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar custo de funcionário",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Deletar custo de funcionário
  const deleteEmployeeCost = async (id: string) => {
    try {
      const { error } = await supabase
        .from("employee_costs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Custo de funcionário excluído com sucesso",
      });

      await fetchEmployeeCosts();
    } catch (error) {
      console.error("Erro ao excluir custo de funcionário:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir custo de funcionário",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Salvar custo da empresa
  const saveCompanyCost = async (cost: Omit<CompanyCost, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!user) throw new Error("Usuário não encontrado");

      const { data, error } = await supabase
        .from("company_costs")
        .insert({
          ...cost,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Custo da empresa salvo com sucesso",
      });

      await fetchCompanyCosts();
      return data;
    } catch (error) {
      console.error("Erro ao salvar custo da empresa:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar custo da empresa",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Atualizar custo da empresa
  const updateCompanyCost = async (id: string, cost: Partial<CompanyCost>) => {
    try {
      const { error } = await supabase
        .from("company_costs")
        .update(cost)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Custo da empresa atualizado com sucesso",
      });

      await fetchCompanyCosts();
    } catch (error) {
      console.error("Erro ao atualizar custo da empresa:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar custo da empresa",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Deletar custo da empresa
  const deleteCompanyCost = async (id: string) => {
    try {
      const { error } = await supabase
        .from("company_costs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Custo da empresa excluído com sucesso",
      });

      await fetchCompanyCosts();
    } catch (error) {
      console.error("Erro ao excluir custo da empresa:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir custo da empresa",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Buscar projeções de custos
  const fetchCostProjections = async (year?: number) => {
    try {
      if (!user) return;

      let query = supabase
        .from("company_cost_projections")
        .select("*")
        .eq("user_id", user.id)
        .order("year", { ascending: true })
        .order("month", { ascending: true });

      if (year) {
        query = query.eq("year", year);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCostProjections(data || []);
    } catch (error) {
      console.error("Erro ao buscar projeções de custos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar projeções de custos",
        variant: "destructive",
      });
    }
  };

  // Gerar projeções para um custo
  const generateProjections = async (
    companyCostId: string, 
    startYear: number = new Date().getFullYear(),
    endYear: number = new Date().getFullYear() + 1,
    months: number[] = [1,2,3,4,5,6,7,8,9,10,11,12]
  ) => {
    try {
      if (!user) throw new Error("Usuário não encontrado");

      const { error } = await supabase.rpc('generate_company_cost_projections', {
        p_company_cost_id: companyCostId,
        p_user_id: user.id,
        p_start_year: startYear,
        p_end_year: endYear,
        p_months: months
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Projeções geradas com sucesso",
      });

      await fetchCostProjections();
    } catch (error) {
      console.error("Erro ao gerar projeções:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar projeções",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Atualizar projeção individual (só para frente)
  const updateProjection = async (id: string, projectedCost: number, notes?: string) => {
    try {
      const { error } = await supabase.rpc('update_projection_forward_only', {
        p_projection_id: id,
        p_new_cost: projectedCost,
        p_notes: notes
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Projeção atualizada com sucesso (aplicada para meses futuros)",
      });

      await fetchCostProjections();
    } catch (error) {
      console.error("Erro ao atualizar projeção:", error);
      const errorMessage = (error as any)?.message || "Erro ao atualizar projeção";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Atualizar custo real de uma projeção
  const updateActualCost = async (id: string, actualCost: number) => {
    try {
      const { error } = await supabase
        .from("company_cost_projections")
        .update({
          actual_cost: actualCost
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Custo real atualizado com sucesso",
      });

      await fetchCostProjections();
    } catch (error) {
      console.error("Erro ao atualizar custo real:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar custo real",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Gerar projeções com período específico de datas (versão inteligente)
  const generateProjectionsWithDates = async (
    costId: string, 
    startDate: string, 
    endDate: string, 
    updateFutureOnly: boolean = true
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('generate_company_cost_projections_smart', {
        p_company_cost_id: costId,
        p_user_id: user.id,
        p_start_date: startDate,
        p_end_date: endDate,
        p_update_future_only: updateFutureOnly
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Projeções geradas com sucesso${updateFutureOnly ? ' (apenas para meses futuros)' : ''}`,
      });

      await fetchCostProjections();
    } catch (error) {
      console.error("Erro ao gerar projeções com datas:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar projeções",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Buscar custos por período (com vencimento)
  const getCostsByPeriod = async (year: number, month: number) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.rpc('get_company_costs_by_period_with_due_date', {
        p_user_id: user.id,
        p_year: year,
        p_month: month
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar custos por período:", error);
      return [];
    }
  };

  // Obter resumo mensal de custos
  const getMonthlyCostSummary = (year: number, month: number) => {
    const monthProjections = costProjections.filter(p => p.year === year && p.month === month);
    
    const projected = monthProjections.reduce((sum, p) => sum + p.projected_cost, 0);
    const actual = monthProjections.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
    
    return {
      projected,
      actual,
      variance: actual - projected,
      hasActualData: monthProjections.some(p => p.actual_cost !== null)
    };
  };

  // Salvar análise de lucro
  const saveProfitAnalysis = async (analysis: Omit<ContractProfitAnalysis, 'id' | 'total_costs' | 'gross_profit' | 'profit_margin' | 'created_at' | 'updated_at'>) => {
    try {
      if (!user) throw new Error("Usuário não encontrado");

      const { data, error } = await supabase
        .from("contract_profit_analysis")
        .insert({
          ...analysis,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Análise de lucro salva com sucesso",
      });

      await fetchProfitAnalyses();
      return data;
    } catch (error) {
      console.error("Erro ao salvar análise de lucro:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar análise de lucro",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Atualizar análise de lucro
  const updateProfitAnalysis = async (id: string, analysis: Partial<ContractProfitAnalysis>) => {
    try {
      const { error } = await supabase
        .from("contract_profit_analysis")
        .update(analysis)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Análise de lucro atualizada com sucesso",
      });

      await fetchProfitAnalyses();
    } catch (error) {
      console.error("Erro ao atualizar análise de lucro:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar análise de lucro",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Deletar análise de lucro
  const deleteProfitAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contract_profit_analysis")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Análise de lucro excluída com sucesso",
      });

      await fetchProfitAnalyses();
    } catch (error) {
      console.error("Erro ao excluir análise de lucro:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir análise de lucro",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Carregar todos os dados
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployeeCosts(),
        fetchCompanyCosts(),
        fetchProfitAnalyses()
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
    // Data
    employeeCosts,
    companyCosts,
    costProjections,
    profitAnalyses,
    loading,

    // Employee costs
    saveEmployeeCost,
    updateEmployeeCost,
    deleteEmployeeCost,
    fetchEmployeeCosts,
    calculateLaborCharges,
    calculateSocialCharges,

    // Company costs
    saveCompanyCost,
    updateCompanyCost,
    deleteCompanyCost,
    fetchCompanyCosts,

    // Cost projections
    fetchCostProjections,
    generateProjections,
    generateProjectionsWithDates,
    getCostsByPeriod,
    updateProjection,
    updateActualCost,
    getMonthlyCostSummary,

    // Profit analysis
    saveProfitAnalysis,
    updateProfitAnalysis,
    deleteProfitAnalysis,
    fetchProfitAnalyses,

    // General
    loadAllData
  };
};
