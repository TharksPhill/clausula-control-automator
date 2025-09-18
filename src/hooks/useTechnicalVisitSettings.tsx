
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

export interface TechnicalVisitSettingsFormData {
  visit_cost: number;
  km_cost: number;
}

export const useTechnicalVisitSettings = () => {
  const [settings, setSettings] = useState<TechnicalVisitSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSettings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('Buscando configurações de visita técnica para usuário:', user.id);

      const { data, error } = await supabase
        .from('technical_visit_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar configurações:', error);
        throw error;
      }

      console.log('Configurações encontradas:', data);
      setSettings(data);
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

  const updateSettings = async (settingsData: TechnicalVisitSettingsFormData) => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    try {
      console.log('Atualizando configurações com dados:', settingsData);

      // Se já existem configurações, fazer UPDATE
      if (settings?.id) {
        const { data, error } = await supabase
          .from('technical_visit_settings')
          .update({
            visit_cost: settingsData.visit_cost,
            km_cost: settingsData.km_cost,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;

        console.log('Configurações atualizadas:', data);
        setSettings(data);
        
        toast({
          title: "Sucesso!",
          description: "Configurações de visita técnica atualizadas com sucesso",
        });

        return data;
      } else {
        // Se não existem configurações, fazer INSERT
        const { data, error } = await supabase
          .from('technical_visit_settings')
          .insert({
            user_id: user.id,
            visit_cost: settingsData.visit_cost,
            km_cost: settingsData.km_cost
          })
          .select()
          .single();

        if (error) throw error;

        console.log('Configurações criadas:', data);
        setSettings(data);
        
        toast({
          title: "Sucesso!",
          description: "Configurações de visita técnica criadas com sucesso",
        });

        return data;
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar configurações: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  return {
    settings,
    loading,
    updateSettings,
    refreshSettings: fetchSettings
  };
};
