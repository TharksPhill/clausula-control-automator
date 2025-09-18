import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface BankSlipConfiguration {
  id: string;
  user_id: string;
  institution_name: string;
  slip_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractBankSlipCost {
  id: string;
  user_id: string;
  contract_id: string;
  bank_slip_config_id: string;
  monthly_cost: number;
  billing_start_month: number;
  is_recurring: boolean;
  applied_at: string;
  created_at: string;
  updated_at: string;
}

export const useBankSlipConfigurations = () => {
  const [configurations, setConfigurations] = useState<BankSlipConfiguration[]>([]);
  const [contractCosts, setContractCosts] = useState<ContractBankSlipCost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConfigurations = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("bank_slip_configurations")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConfigurations(data || []);
    } catch (error) {
      console.error("Erro ao buscar configurações de boleto:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de boleto",
        variant: "destructive",
      });
    }
  };

  const fetchContractCosts = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("contract_bank_slip_costs")
        .select(`
          *,
          bank_slip_configurations(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContractCosts(data || []);
    } catch (error) {
      console.error("Erro ao buscar custos de boleto por contrato:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar custos de boleto",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchConfigurations(), fetchContractCosts()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const saveConfiguration = async (data: Omit<BankSlipConfiguration, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user?.id) return;

    try {
      // Desativar configurações existentes
      await supabase
        .from("bank_slip_configurations")
        .update({ is_active: false })
        .eq("user_id", user.id);

      // Criar nova configuração
      const { error } = await supabase
        .from("bank_slip_configurations")
        .insert({
          ...data,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração de boleto salva com sucesso",
      });

      fetchConfigurations();
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração de boleto",
        variant: "destructive",
      });
    }
  };

  const applyToContracts = async (configId: string, contractIds: string[]) => {
    if (!user?.id) return;

    try {
      // Buscar a configuração
      const { data: config, error: configError } = await supabase
        .from("bank_slip_configurations")
        .select("*")
        .eq("id", configId)
        .single();

      if (configError) throw configError;

      // Buscar contratos para determinar o tipo de plano
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("id, plan_type")
        .in("id", contractIds)
        .eq("user_id", user.id);

      if (contractsError) throw contractsError;

      // Preparar dados para inserção
      const costsToInsert = contracts.map(contract => {
        const planType = contract.plan_type || 'mensal';
        const isRecurring = planType === 'mensal';
        
        return {
          user_id: user.id,
          contract_id: contract.id,
          bank_slip_config_id: configId,
          monthly_cost: config.slip_value,
          billing_start_month: 2, // Sempre segundo mês
          is_recurring: isRecurring,
        };
      });

      // Remover custos existentes para estes contratos
      await supabase
        .from("contract_bank_slip_costs")
        .delete()
        .eq("user_id", user.id)
        .in("contract_id", contractIds);

      // Inserir novos custos
      const { error } = await supabase
        .from("contract_bank_slip_costs")
        .insert(costsToInsert);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Boleto aplicado a ${contractIds.length} contrato(s)`,
      });

      fetchContractCosts();
    } catch (error) {
      console.error("Erro ao aplicar boleto aos contratos:", error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar boleto aos contratos",
        variant: "destructive",
      });
    }
  };

  const removeFromContract = async (contractId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("contract_bank_slip_costs")
        .delete()
        .eq("user_id", user.id)
        .eq("contract_id", contractId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Boleto removido do contrato",
      });

      fetchContractCosts();
    } catch (error) {
      console.error("Erro ao remover boleto do contrato:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover boleto do contrato",
        variant: "destructive",
      });
    }
  };

  return {
    configurations,
    contractCosts,
    loading,
    saveConfiguration,
    applyToContracts,
    removeFromContract,
    refresh: fetchData,
  };
};