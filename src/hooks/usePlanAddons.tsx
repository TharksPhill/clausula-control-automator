
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PlanAddon, PlanAddonFromDB } from "@/types/plan-addons";
import { useAuth } from "@/hooks/useAuth";

export const usePlanAddons = () => {
  const [planAddons, setPlanAddons] = useState<PlanAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Ordem fixa dos adicionais para manter consistência
  const ADDON_ORDER = [
    'Funcionários Extras',
    'CNPJs Extras', 
    'Reconhecimento Facial',
    'Notificações Premium'
  ];

  const convertDbDataToPlanAddon = (dbData: PlanAddonFromDB[]): PlanAddon[] => {
    console.log('=== CONVERTENDO DADOS DO DB ===');
    console.log('Dados recebidos do DB:', dbData);
    
    const converted = dbData.map(item => {
      const converted: PlanAddon = {
        ...item,
        pricing_type: (item.pricing_type === 'per_unit' || item.pricing_type === 'package') 
          ? item.pricing_type as 'per_unit' | 'package'
          : 'per_unit',
        package_ranges: Array.isArray(item.package_ranges) 
          ? item.package_ranges 
          : (typeof item.package_ranges === 'string' 
            ? JSON.parse(item.package_ranges) 
            : []),
        license_cost: item.license_cost || 0
      };
      console.log(`Convertido ${item.name}:`, converted);
      console.log(`Preço de ${item.name}:`, converted.price_per_unit);
      return converted;
    });
    
    // Ordenar os adicionais de acordo com a ordem fixa definida
    const orderedAddons = converted.sort((a, b) => {
      const indexA = ADDON_ORDER.indexOf(a.name);
      const indexB = ADDON_ORDER.indexOf(b.name);
      
      // Se ambos estão na lista de ordem, usar a ordem definida
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Se apenas um está na lista, colocar o que está na lista primeiro
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // Se nenhum está na lista, manter ordem alfabética
      return a.name.localeCompare(b.name);
    });
    
    console.log('Dados convertidos e ordenados:', orderedAddons);
    console.log('==============================');
    return orderedAddons;
  };


  const fetchPlanAddons = async () => {
    if (!user?.id) {
      console.log('Usuário não logado, definindo loading como false');
      setLoading(false);
      return;
    }
    
    try {
      console.log('=== BUSCANDO PLAN ADDONS ===');
      console.log('Buscando plan addons para usuário:', user.id);
      
      // Buscar addons existentes
      const { data: existingAddons, error } = await supabase
        .from('plan_addons')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Erro ao buscar addons:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar adicionais de planos",
          variant: "destructive",
        });
        setPlanAddons([]);
      } else if (!existingAddons || existingAddons.length === 0) {
        console.log('Nenhum adicional encontrado. Lista vazia para conta nova.');
        // Não criar addons padrão - deixar vazio para contas novas
        setPlanAddons([]);
      } else {
        console.log('Addons encontrados:', existingAddons);
        const converted = convertDbDataToPlanAddon(existingAddons);
        setPlanAddons(converted);
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar plan addons:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar adicionais de planos",
        variant: "destructive",
      });
      
      setPlanAddons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== useEffect EXECUTADO ===');
    console.log('user?.id:', user?.id);
    if (user?.id) {
      fetchPlanAddons();
    } else {
      console.log('Usuário não está definido ainda, aguardando...');
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    console.log('=== ESTADO planAddons MUDOU ===');
    console.log('Novo estado planAddons:', planAddons);
    console.log('Quantidade de addons:', planAddons.length);
    planAddons.forEach((addon, index) => {
      console.log(`Addon ${index + 1}:`, {
        name: addon.name,
        price_per_unit: addon.price_per_unit,
        tipo: typeof addon.price_per_unit,
        unit_type: addon.unit_type
      });
    });
    console.log('===============================');
  }, [planAddons]);

  useEffect(() => {
    console.log('=== USUÁRIO MUDOU ===');
    console.log('Novo usuário:', user);
    console.log('==================');
  }, [user]);

  return {
    planAddons,
    loading,
    refreshPlanAddons: fetchPlanAddons
  };
};
