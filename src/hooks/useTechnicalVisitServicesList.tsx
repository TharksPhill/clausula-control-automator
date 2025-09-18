import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface TechnicalVisitService {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  pricing_type: string;
  fixed_price?: number;
  estimated_hours?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTechnicalVisitServicesList = () => {
  const [services, setServices] = useState<TechnicalVisitService[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchServices = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('technical_visit_services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setServices(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar serviços de visita técnica",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('technical_visit_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Sucesso!",
        description: "Serviço removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir serviço",
        variant: "destructive",
      });
    }
  };

  const toggleActiveStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('technical_visit_services')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setServices(prev => prev.map(service => 
        service.id === id ? { ...service, is_active: isActive } : service
      ));
      
      toast({
        title: "Sucesso!",
        description: `Serviço ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao alterar status do serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do serviço",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchServices();
  }, [user?.id]);

  return {
    services,
    loading,
    deleteService,
    toggleActiveStatus,
    refreshServices: fetchServices
  };
};