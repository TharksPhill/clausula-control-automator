import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeleteMultipleSectionCosts = (sectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category_id: string;
      year: number;
      months: number[];
    }) => {
      const results = [];

      for (const month of data.months) {
        const { error } = await supabase
          .from("monthly_financial_costs")
          .delete()
          .eq("category_id", data.category_id)
          .eq("year", data.year)
          .eq("month", month);

        if (error) throw error;
        results.push({ month, deleted: true });
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
      toast.success(`Valores removidos de ${variables.months.length} meses com sucesso!`);
    },
    onError: (error) => {
      console.error("Error deleting multiple monthly financial costs:", error);
      toast.error("Erro ao remover valores mensais");
    },
  });
};