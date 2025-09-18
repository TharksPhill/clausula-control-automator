
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GoogleMapsConfig {
  id: string;
  user_id: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useGoogleMapsConfig = () => {
  const [config, setConfig] = useState<GoogleMapsConfig | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['google-maps-config'],
    queryFn: async () => {
      console.log('🔍 Buscando configuração do Google Maps...');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ Usuário não autenticado');
        return null;
      }

      console.log('👤 Usuário autenticado:', user.id);

      const { data, error } = await supabase
        .from('google_maps_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Erro ao buscar configuração:', error);
        return null;
      }

      console.log('📋 Dados encontrados:', data);
      
      return data && data.length > 0 ? data[0] as GoogleMapsConfig : null;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (data) {
      console.log('✅ Configuração carregada:', data);
      setConfig(data);
    } else {
      console.log('⚠️ Nenhuma configuração encontrada');
      setConfig(null);
    }
  }, [data]);

  const saveConfig = async (apiKey: string): Promise<boolean> => {
    try {
      console.log('💾 Iniciando salvamento da configuração...');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ Usuário não autenticado');
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return false;
      }

      console.log('👤 Salvando para usuário:', user.id);

      // First, deactivate existing configurations
      const { error: updateError } = await supabase
        .from('google_maps_configurations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('⚠️ Erro ao desativar configurações antigas:', updateError);
      }

      // Insert new configuration
      const { data: newConfig, error: insertError } = await supabase
        .from('google_maps_configurations')
        .insert({
          user_id: user.id,
          api_key: apiKey,
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir nova configuração:', insertError);
        toast({
          title: "Erro",
          description: "Erro ao salvar configuração: " + insertError.message,
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Configuração salva com sucesso:', newConfig);
      
      // Update local state immediately
      setConfig(newConfig as GoogleMapsConfig);
      
      // Invalidate and reload queries
      await queryClient.invalidateQueries({ queryKey: ['google-maps-config'] });
      await refetch();
      
      toast({
        title: "Sucesso!",
        description: "Configuração do Google Maps salva com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar configuração.",
        variant: "destructive",
      });
      return false;
    }
  };

  const hasValidConfig = !!(config?.api_key);

  console.log('🔧 Hook status:', {
    isLoading,
    hasConfig: !!config,
    hasValidConfig,
    apiKeyLength: config?.api_key?.length || 0
  });

  return {
    config,
    isLoading,
    error,
    saveConfig,
    hasValidConfig,
    refetch
  };
};
