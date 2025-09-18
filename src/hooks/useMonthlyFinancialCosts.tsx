import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface MonthlyFinancialCost {
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

export const useMonthlyFinancialCosts = (year: number) => {
  const queryClient = useQueryClient();
  
  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('monthly-financial-costs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monthly_financial_costs',
          filter: `year=eq.${year}`
        },
        () => {
          // Invalidate the query to refetch data
          queryClient.invalidateQueries({ queryKey: ["monthly-financial-costs", year] });
          queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [year, queryClient]);
  
  return useQuery({
    queryKey: ["monthly-financial-costs", year],
    queryFn: async () => {
      console.log(`[Monthly Financial Costs] Starting fetch for year ${year}`);
      
      // Buscar em chunks para evitar limites
      const allData: any[] = [];
      const chunkSize = 1000;
      let offset = 0;
      let hasMore = true;
      
      while (hasMore) {
        const { data: chunk, error, count } = await (supabase as any)
          .from("monthly_financial_costs")
          .select("*", { count: 'exact' })
          .eq("year", year)
          .order("month")
          .range(offset, offset + chunkSize - 1);

        if (error) {
          console.error("Error fetching monthly financial costs:", error);
          throw error;
        }
        
        if (chunk && chunk.length > 0) {
          allData.push(...chunk);
          offset += chunkSize;
          hasMore = chunk.length === chunkSize;
        } else {
          hasMore = false;
        }
        
        console.log(`[Monthly Financial Costs] Fetched chunk: ${chunk?.length || 0} records, total so far: ${allData.length}`);
      }
      
      console.log(`[Monthly Financial Costs] Total loaded for year ${year}: ${allData.length} costs`);
      
      if (allData.length > 0) {
        // Agrupar por mês para debug
        const costsByMonth = allData.reduce((acc: any, cost: any) => {
          if (!acc[cost.month]) acc[cost.month] = [];
          acc[cost.month].push(cost);
          return acc;
        }, {});
        
        Object.keys(costsByMonth).forEach(month => {
          console.log(`[Monthly Financial Costs] Month ${month}: ${costsByMonth[month].length} costs`);
        });
        
        // Debug específico para categoria TESTE
        const testeCategoryCosts = allData.filter((cost: any) => cost.category_id === 'adae9a51-8aef-4084-a748-a9619ea83703');
        console.log(`[Monthly Financial Costs] TESTE category total: ${testeCategoryCosts.length} costs`);
        
        const testeSeptDec = testeCategoryCosts.filter((c: any) => c.month >= 9);
        console.log(`[Monthly Financial Costs] TESTE Sept-Dec count: ${testeSeptDec.length}`);
        if (testeSeptDec.length > 0) {
          console.log(`[Monthly Financial Costs] TESTE Sept-Dec values:`, testeSeptDec.map((c: any) => ({ month: c.month, value: c.value })));
        }
      }

      return allData as unknown as MonthlyFinancialCost[];
    },
      staleTime: 1000, // 1 segundo ao invés de 0
      gcTime: 5000, // 5 segundos ao invés de 0
    refetchOnWindowFocus: true
  });
};

export const useCreateOrUpdateMonthlyFinancialCost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (costData: {
      category_id: string;
      year: number;
      month: number;
      value: number;
      description?: string;
      notes?: string;
      is_projection?: boolean;
    }) => {
      // Primeiro, verificar se já existe um registro
      const { data: existingCost } = await (supabase as any)
        .from("monthly_financial_costs")
        .select("id")
        .eq("category_id", costData.category_id)
        .eq("year", costData.year)
        .eq("month", costData.month)
        .single();

      if (existingCost) {
        // Atualizar registro existente
        const { data, error } = await (supabase as any)
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
        // Criar novo registro
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await (supabase as any)
          .from("monthly_financial_costs")
          .insert({
            ...costData,
            user_id: user.id,
            is_projection: costData.is_projection ?? false,
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
        queryKey: ["monthly-financial-costs", variables.year] 
      });

      // Snapshot dos dados atuais
      const previousData = queryClient.getQueryData(["monthly-financial-costs", variables.year]);

      // Atualização otimista
      queryClient.setQueryData(["monthly-financial-costs", variables.year], (old: MonthlyFinancialCost[] = []) => {
        const existingIndex = old.findIndex(
          cost => cost.category_id === variables.category_id && 
                  cost.month === variables.month && 
                  cost.year === variables.year
        );

        if (existingIndex >= 0) {
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
        } else {
          // Adicionar novo
          const newCost: MonthlyFinancialCost = {
            id: `temp-${Date.now()}`,
            user_id: 'temp',
            category_id: variables.category_id,
            year: variables.year,
            month: variables.month,
            value: variables.value,
            is_projection: variables.is_projection ?? false,
            description: variables.description,
            notes: variables.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return [...old, newCost];
        }
      });

      // Invalidar queries relacionadas imediatamente para atualizar outras visualizações
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });

      return { previousData };
    },
    onSuccess: (_, variables) => {
      // Invalidar queries para garantir sincronização
      queryClient.invalidateQueries({ 
        queryKey: ["monthly-financial-costs", variables.year] 
      });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Custo mensal salvo com sucesso!");
    },
    onError: (error, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousData) {
        queryClient.setQueryData(["monthly-financial-costs", variables.year], context.previousData);
      }
      console.error("Error saving monthly financial cost:", error);
      toast.error("Erro ao salvar custo mensal");
    },
    onSettled: (_, __, variables) => {
      // Garantir sincronização final
      queryClient.invalidateQueries({ 
        queryKey: ["monthly-financial-costs", variables.year] 
      });
    },
  });
};

// Nova função para salvar em múltiplos meses
export const useCreateOrUpdateMultipleMonthlyFinancialCosts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category_id: string;
      year: number;
      months: number[];
      value: number;
      description?: string;
      notes?: string;
      is_projection?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const results = [];

      for (const month of data.months) {
        // Verificar se já existe um registro
        const { data: existingCost } = await (supabase as any)
          .from("monthly_financial_costs")
          .select("id")
          .eq("category_id", data.category_id)
          .eq("year", data.year)
          .eq("month", month)
          .single();

        if (existingCost) {
          // Atualizar registro existente
          const { data: updatedData, error } = await (supabase as any)
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
          const { data: newData, error } = await (supabase as any)
            .from("monthly_financial_costs")
            .insert({
              category_id: data.category_id,
              year: data.year,
              month,
              value: data.value,
              description: data.description,
              notes: data.notes,
              user_id: user.id,
              is_projection: data.is_projection ?? false,
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
        queryKey: ["monthly-financial-costs", variables.year] 
      });
      toast.success(`Custo aplicado a ${variables.months.length} meses com sucesso!`);
    },
    onError: (error) => {
      console.error("Error saving multiple monthly financial costs:", error);
      toast.error("Erro ao salvar custos mensais");
    },
  });
};

export const useDeleteMonthlyFinancialCost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      category_id,
      year,
      month,
    }: {
      category_id: string;
      year: number;
      month: number;
    }) => {
      const { error } = await (supabase as any)
        .from("monthly_financial_costs")
        .delete()
        .eq("category_id", category_id)
        .eq("year", year)
        .eq("month", month);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["monthly-financial-costs", variables.year] 
      });
      toast.success("Custo mensal removido com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting monthly financial cost:", error);
      toast.error("Erro ao remover custo mensal");
    },
  });
};