import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MonthlyFinancialCost {
  id: string;
  user_id: string;
  category_id: string;
  year: number;
  month: number;
  value: number;
  is_projection: boolean;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useMonthlyFinancialCostsBySection = (sectionId: string, year: number) => {
    return useQuery({
      queryKey: ["monthly-financial-costs-by-section", sectionId, year],
      queryFn: async () => {
        console.log(`📊 Buscando custos financeiros mensais - Seção: ${sectionId}, Ano: ${year}`);
      // Primeiro, buscar categorias ativas para esta seção
      const { data: categories, error: categoriesError } = await supabase
        .from("financial_categories")
        .select("id")
        .eq("section_id", sectionId)
        .eq("is_active", true);

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
        throw categoriesError;
      }

      if (!categories || categories.length === 0) {
        console.log(`[Section ${sectionId}] No active categories found`);
        return [];
      }

      const categoryIds = categories.map(cat => cat.id);
      console.log(`[Section ${sectionId}] Found ${categoryIds.length} active categories`);

      // Buscar custos em lotes para evitar timeout
      const batchSize = 10;
      const allCosts: MonthlyFinancialCost[] = [];
      
      for (let i = 0; i < categoryIds.length; i += batchSize) {
        const batch = categoryIds.slice(i, i + batchSize);
        
        const { data: costs, error: costsError } = await supabase
          .from("monthly_financial_costs")
          .select("*")
          .in("category_id", batch)
          .eq("year", year)
          .order("month");

        if (costsError) {
          console.error("Error fetching costs for batch:", costsError);
          throw costsError;
        }

        if (costs) {
          allCosts.push(...costs);
        }
      }

      console.log(`[Section ${sectionId}] Loaded ${allCosts.length} costs for year ${year}`);
      
      // Debug específico para 2025
      if (year === 2025 && allCosts.length > 0) {
        const septDec = allCosts.filter(cost => cost.month >= 9 && cost.month <= 12);
        console.log(`🔍 [DEBUG 2025] Seção ${sectionId} - Custos Set-Dez:`, septDec);
        console.log(`🔍 [DEBUG 2025] Total custos Set-Dez: ${septDec.length}`);
        
        if (septDec.length === 0) {
          console.warn(`⚠️ [DEBUG 2025] Nenhum custo encontrado para Set-Dez na seção ${sectionId}`);
        }
      }
      
      return allCosts as MonthlyFinancialCost[];
    },
    staleTime: 1000, // 1 segundo ao invés de 0
    gcTime: 5000, // 5 segundos ao invés de 0
    refetchOnWindowFocus: true
  });
};

export const useCreateOrUpdateSectionCost = (sectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (costData: {
      category_id: string;
      year: number;
      month: number;
      value: number;
      description?: string;
      notes?: string;
    }) => {
      // Verificar se já existe um registro
      const { data: existingCost } = await supabase
        .from("monthly_financial_costs")
        .select("id")
        .eq("category_id", costData.category_id)
        .eq("year", costData.year)
        .eq("month", costData.month)
        .single();

      if (existingCost) {
        // Se o valor for 0, deletar o registro
        if (costData.value === 0) {
          const { error } = await supabase
            .from("monthly_financial_costs")
            .delete()
            .eq("id", existingCost.id);

          if (error) throw error;
          return { deleted: true };
        }

        // Atualizar registro existente
        const { data, error } = await supabase
          .from("monthly_financial_costs")
          .update({
            value: costData.value,
            description: costData.description,
            notes: costData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCost.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Se o valor for 0, não criar registro
        if (costData.value === 0) {
          return { skipped: true };
        }

        // Criar novo registro
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
          .from("monthly_financial_costs")
          .insert({
            ...costData,
            user_id: user.id,
            is_projection: false,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onMutate: async (variables) => {
      // Cancelar queries em execução
      await queryClient.cancelQueries({ 
        queryKey: ["monthly-financial-costs-by-section", sectionId, variables.year] 
      });

      // Snapshot dos dados atuais
      const previousData = queryClient.getQueryData(["monthly-financial-costs-by-section", sectionId, variables.year]);

      // Atualização otimista
      queryClient.setQueryData(["monthly-financial-costs-by-section", sectionId, variables.year], (old: MonthlyFinancialCost[] = []) => {
        const existingIndex = old.findIndex(
          cost => cost.category_id === variables.category_id && 
                  cost.month === variables.month && 
                  cost.year === variables.year
        );

        if (existingIndex >= 0) {
          if (variables.value === 0) {
            // Remover da lista se o valor for 0
            return old.filter((_, index) => index !== existingIndex);
          } else {
            // Atualizar existente
            const updated = [...old];
            updated[existingIndex] = {
              ...updated[existingIndex],
              value: variables.value,
              description: variables.description,
              notes: variables.notes,
              updated_at: new Date().toISOString(),
            };
            return updated;
          }
        } else if (variables.value > 0) {
          // Adicionar novo
          const newCost: MonthlyFinancialCost = {
            id: `temp-${Date.now()}`,
            user_id: 'temp',
            category_id: variables.category_id,
            year: variables.year,
            month: variables.month,
            value: variables.value,
            is_projection: false,
            description: variables.description,
            notes: variables.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return [...old, newCost];
        }
        
        return old;
      });

      return { previousData };
    },
    onSuccess: (_, variables) => {
      // Invalidar queries para garantir sincronização
      queryClient.invalidateQueries({ 
        queryKey: ["monthly-financial-costs-by-section", sectionId, variables.year] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["monthly-financial-costs", variables.year] 
      });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Valor salvo com sucesso!");
    },
    onError: (error, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousData) {
        queryClient.setQueryData(["monthly-financial-costs-by-section", sectionId, variables.year], context.previousData);
      }
      console.error("Error saving monthly financial cost:", error);
      toast.error("Erro ao salvar valor");
    },
    onSettled: (_, __, variables) => {
      // Garantir sincronização final
      queryClient.invalidateQueries({ 
        queryKey: ["monthly-financial-costs-by-section", sectionId, variables.year] 
      });
    },
  });
};

// Nova função para salvar em múltiplos meses para uma seção
export const useCreateOrUpdateMultipleSectionCosts = (sectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category_id: string;
      year: number;
      months: number[];
      value: number;
      description?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const results = [];

      for (const month of data.months) {
        // Verificar se já existe um registro
        const { data: existingCost } = await supabase
          .from("monthly_financial_costs")
          .select("id")
          .eq("category_id", data.category_id)
          .eq("year", data.year)
          .eq("month", month)
          .single();

        if (existingCost) {
          // Atualizar registro existente
          const { data: updatedData, error } = await supabase
            .from("monthly_financial_costs")
            .update({
              value: data.value,
              description: data.description,
              notes: data.notes,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingCost.id)
            .select()
            .single();

          if (error) throw error;
          results.push(updatedData);
        } else {
          // Criar novo registro
          const { data: newData, error } = await supabase
            .from("monthly_financial_costs")
            .insert({
              category_id: data.category_id,
              year: data.year,
              month,
              value: data.value,
              description: data.description,
              notes: data.notes,
              user_id: user.id,
              is_projection: false,
            })
            .select()
            .single();

          if (error) throw error;
          results.push(newData);
        }
      }

      return results;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["monthly-financial-costs-by-section", sectionId, variables.year] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["monthly-financial-costs", variables.year] 
      });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success(`Valor aplicado a ${variables.months.length} meses com sucesso!`);
    },
    onError: (error) => {
      console.error("Error saving multiple monthly financial costs:", error);
      toast.error("Erro ao salvar valores mensais");
    },
  });
};