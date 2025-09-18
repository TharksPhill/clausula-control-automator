import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContractMonthlyRevenueOverride {
  id: string;
  user_id: string;
  contract_id: string;
  year: number;
  month: number;
  value: number;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useContractMonthlyRevenueOverrides = (year: number) => {
  return useQuery({
    queryKey: ["contract-monthly-revenue-overrides", year],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("contract_monthly_revenue_overrides")
        .select("*")
        .eq("year", year)
        .order("month");

      if (error) throw error;
      return data as unknown as ContractMonthlyRevenueOverride[];
    },
  });
};

export const useContractMonthlyRevenueOverridesUpToYear = (maxYear: number) => {
  return useQuery({
    queryKey: ["contract-monthly-revenue-overrides-up-to", maxYear],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("contract_monthly_revenue_overrides")
        .select("*")
        .lte("year", maxYear)
        .order("year")
        .order("month");

      if (error) throw error;
      return data as unknown as ContractMonthlyRevenueOverride[];
    },
  });
};


export const useCreateOrUpdateContractMonthlyRevenueOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      contract_id: string;
      year: number;
      month: number;
      value: number;
      description?: string;
      notes?: string;
    }) => {
      const { data: existing } = await (supabase as any)
        .from("contract_monthly_revenue_overrides")
        .select("id")
        .eq("contract_id", payload.contract_id)
        .eq("year", payload.year)
        .eq("month", payload.month)
        .single();

      if (existing) {
        const { data, error } = await (supabase as any)
          .from("contract_monthly_revenue_overrides")
          .update({
            value: payload.value,
            description: payload.description,
            notes: payload.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        const { data, error } = await (supabase as any)
          .from("contract_monthly_revenue_overrides")
          .insert({
            user_id: user.id,
            contract_id: payload.contract_id,
            year: payload.year,
            month: payload.month,
            value: payload.value,
            description: payload.description,
            notes: payload.notes,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contract-monthly-revenue-overrides", variables.year] });
      queryClient.invalidateQueries({ queryKey: ["contract-monthly-revenue-overrides-up-to"] });
      toast.success("Faturamento do contrato salvo com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar faturamento do contrato:", error);
      toast.error("Erro ao salvar faturamento do contrato");
    },
  });
};

export const useCreateOrUpdateMultipleContractRevenueOverrides = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      contract_id: string;
      year: number;
      months: number[];
      value: number;
      description?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      for (const month of payload.months) {
        const { data: existing } = await (supabase as any)
          .from("contract_monthly_revenue_overrides")
          .select("id")
          .eq("contract_id", payload.contract_id)
          .eq("year", payload.year)
          .eq("month", month)
          .single();

        if (existing) {
          const { error } = await (supabase as any)
            .from("contract_monthly_revenue_overrides")
            .update({
              value: payload.value,
              description: payload.description,
              notes: payload.notes,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await (supabase as any)
            .from("contract_monthly_revenue_overrides")
            .insert({
              user_id: user.id,
              contract_id: payload.contract_id,
              year: payload.year,
              month,
              value: payload.value,
              description: payload.description,
              notes: payload.notes,
            });
          if (error) throw error;
        }
      }
      return true;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contract-monthly-revenue-overrides", variables.year] });
      queryClient.invalidateQueries({ queryKey: ["contract-monthly-revenue-overrides-up-to"] });
      toast.success(`Faturamento aplicado a ${variables.months.length} meses!`);
    },
    onError: (error) => {
      console.error("Erro ao aplicar faturamento a múltiplos meses:", error);
      toast.error("Erro ao aplicar faturamento");
    },
  });
};

export const useDeleteContractMonthlyRevenueOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { contract_id: string; year: number; month: number }) => {
      const { error } = await (supabase as any)
        .from("contract_monthly_revenue_overrides")
        .delete()
        .eq("contract_id", payload.contract_id)
        .eq("year", payload.year)
        .eq("month", payload.month);
      if (error) throw error;
      return true;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contract-monthly-revenue-overrides", variables.year] });
      queryClient.invalidateQueries({ queryKey: ["contract-monthly-revenue-overrides-up-to"] });
      toast.success("Faturamento removido!");
    },
    onError: (error) => {
      console.error("Erro ao remover faturamento:", error);
      toast.error("Erro ao remover faturamento");
    },
  });
};
