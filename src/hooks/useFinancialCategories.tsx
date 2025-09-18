import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CategoryType = "renda" | "impostos" | "despesas";

export interface FinancialCategory {
  id: string;
  name: string;
  type: CategoryType;
  user_id: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  display_order?: number;
  section_id?: string; // Nova coluna para relacionar com seções personalizadas
  created_at: string;
  updated_at: string;
}

export const useFinancialCategories = (categoryType?: CategoryType) => {
  return useQuery({
    queryKey: ["financial-categories", categoryType],
    queryFn: async () => {
      let query = supabase
        .from("financial_categories" as any)
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (categoryType) {
        query = query.eq("type", categoryType);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching financial categories:", error);
        throw error;
      }

      return data as unknown as FinancialCategory[];
    },
  });
};

// Hook específico para buscar categorias de uma seção específica
export const useFinancialCategoriesBySection = (sectionId?: string) => {
  return useQuery({
    queryKey: ["financial-categories-by-section", sectionId],
    queryFn: async () => {
      let query = supabase
        .from("financial_categories" as any)
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (sectionId) {
        query = query.eq("section_id", sectionId);
      } else {
        // Se não há sectionId, buscar categorias globais (sem section_id)
        query = query.is("section_id", null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching financial categories by section:", error);
        throw error;
      }

      return data as unknown as FinancialCategory[];
    },
    enabled: sectionId !== undefined, // Só executa se sectionId for fornecido
  });
};

export const useCreateFinancialCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: {
      name: string;
      type: CategoryType;
      sectionId?: string; // Opcional para seções personalizadas
    }) => {
      const { data, error } = await (supabase as any)
        .from("financial_categories")
        .insert({
          name: categoryData.name,
          type: categoryData.type,
          section_id: categoryData.sectionId || null,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      queryClient.invalidateQueries({ queryKey: ["financial-categories-by-section"] });
      toast.success("Categoria criada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating category:", error);
      toast.error("Erro ao criar categoria");
    },
  });
};

export const useUpdateFinancialCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<FinancialCategory>;
    }) => {
      const { data, error } = await (supabase as any)
        .from("financial_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      queryClient.invalidateQueries({ queryKey: ["financial-categories-by-section"] });
      toast.success("Categoria atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating category:", error);
      toast.error("Erro ao atualizar categoria");
    },
  });
};

export const useDeleteFinancialCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("financial_categories")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      queryClient.invalidateQueries({ queryKey: ["financial-categories-by-section"] });
      toast.success("Categoria removida com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting category:", error);
      toast.error("Erro ao remover categoria");
    },
  });
};