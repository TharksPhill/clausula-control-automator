
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plan } from "@/types/plans";
import { useAuth } from "@/hooks/useAuth";

export const usePlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();


  const fetchPlans = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('Buscando planos para usuário:', user.id);
      
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });

      if (error) {
        console.error('Erro ao buscar planos:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar planos",
          variant: "destructive",
        });
      } else if (!data || data.length === 0) {
        console.log('Nenhum plano encontrado. Lista vazia para conta nova.');
        // Não criar planos padrão - deixar vazio para contas novas
        setPlans([]);
      } else {
        console.log('Planos encontrados:', data);
        // Garantir que todos os planos tenham o campo allowed_cnpjs
        const plansWithAllowedCnpjs = data.map(plan => ({
          ...plan,
          allowed_cnpjs: plan.allowed_cnpjs || 1
        }));
        setPlans(plansWithAllowedCnpjs);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData: Omit<Plan, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('plans')
        .insert({
          name: planData.name,
          employee_range: planData.employee_range,
          monthly_price: planData.monthly_price,
          semestral_price: planData.semestral_price,
          annual_price: planData.annual_price,
          allowed_cnpjs: planData.allowed_cnpjs,
          license_cost: planData.license_cost || 0,
          license_exemption_months: planData.license_exemption_months || 0,
          is_active: planData.is_active,
          features: planData.features || [],
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Plano criado com sucesso",
      });

      fetchPlans();
      return data;
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar plano",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePlan = async (id: string, planData: Partial<Plan>) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({
          name: planData.name,
          employee_range: planData.employee_range,
          monthly_price: planData.monthly_price,
          semestral_price: planData.semestral_price,
          annual_price: planData.annual_price,
          allowed_cnpjs: planData.allowed_cnpjs,
          license_cost: planData.license_cost || 0,
          license_exemption_months: planData.license_exemption_months || 0,
          is_active: planData.is_active,
          features: planData.features || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Plano atualizado com sucesso",
      });

      fetchPlans();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano",
        variant: "destructive",
      });
      return null;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Plano removido com sucesso",
      });

      fetchPlans();
    } catch (error) {
      console.error('Erro ao remover plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover plano",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [user?.id]);

  return {
    plans,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    refreshPlans: fetchPlans
  };
};
