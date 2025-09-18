import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FinancialSection } from "@/types/financial-sections";

export const useFinancialSections = () => {
  return useQuery({
    queryKey: ["financial-sections"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("financial_sections")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (error) {
        console.error("Error fetching financial sections:", error);
        throw error;
      }

      return data as FinancialSection[];
    },
  });
};

export const useCreateFinancialSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sectionData: {
      name: string;
      color_scheme: string;
      operation_type?: string;
      order_index?: number;
      revenue_type?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Se não especificou order_index, pegar o próximo disponível
      let orderIndex = sectionData.order_index;
      if (!orderIndex) {
        const { data: existingSections } = await (supabase as any)
          .from("financial_sections")
          .select("order_index")
          .eq("user_id", user.id)
          .order("order_index", { ascending: false })
          .limit(1);

        orderIndex = existingSections && existingSections.length > 0 
          ? existingSections[0].order_index + 1 
          : 1;
      }

      const { data, error } = await (supabase as any)
        .from("financial_sections")
        .insert({
          ...sectionData,
          user_id: user.id,
          order_index: orderIndex,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-sections"] });
      toast.success("Seção financeira criada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating financial section:", error);
      toast.error("Erro ao criar seção financeira");
    },
  });
};

export const useUpdateFinancialSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<FinancialSection>;
    }) => {
      const { data, error } = await (supabase as any)
        .from("financial_sections")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-sections"] });
      toast.success("Seção financeira atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating financial section:", error);
      toast.error("Erro ao atualizar seção financeira");
    },
  });
};

export const useDeleteFinancialSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("financial_sections")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-sections"] });
      toast.success("Seção financeira removida com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting financial section:", error);
      toast.error("Erro ao remover seção financeira");
    },
  });
};