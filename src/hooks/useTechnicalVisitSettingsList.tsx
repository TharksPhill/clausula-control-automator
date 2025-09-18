import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface TechnicalVisitSettings {
  id: string;
  user_id: string;
  visit_cost: number;
  km_cost: number;
  created_at: string;
  updated_at: string;
}

export const useTechnicalVisitSettingsList = () => {
  const [settings, setSettings] = useState<TechnicalVisitSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSettings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('technical_visit_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSettings(data || []);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de visita técnica",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSettings = async (id: string) => {
    try {
      const { error } = await supabase
        .from('technical_visit_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSettings(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Sucesso!",
        description: "Configuração removida com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir configuração:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir configuração",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  return {
    settings,
    loading,
    deleteSettings,
    refreshSettings: fetchSettings
  };
};