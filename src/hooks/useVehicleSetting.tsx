import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface VehicleSettingsFormData {
  brand: string;
  model: string;
  year: number;
  license_plate?: string;
  vehicle_type: string;
  fuel_type: string;
  purchase_value: number;
  current_estimated_value: number;
  annual_ipva: number;
  annual_insurance: number;
  annual_maintenance: number;
  fuel_consumption: number;
  annual_mileage: number;
  depreciation_rate: number;
  fuel_price: number;
}

export const useVehicleSetting = (vehicleId?: string) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSettings = async () => {
    if (!vehicleId || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vehicle_settings')
        .select('*')
        .eq('id', vehicleId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Erro ao carregar veículo:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do veículo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsData: VehicleSettingsFormData) => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Se editando um veículo existente
      if (vehicleId && settings?.id) {
        const { data, error } = await supabase
          .from('vehicle_settings')
          .update({
            ...settingsData,
            updated_at: new Date().toISOString()
          })
          .eq('id', vehicleId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        setSettings(data);
        toast({
          title: "Sucesso!",
          description: "Veículo atualizado com sucesso",
        });

        return data;
      } else {
        // Criando um novo veículo
        const { data, error } = await supabase
          .from('vehicle_settings')
          .insert({
            user_id: user.id,
            ...settingsData
          })
          .select()
          .single();

        if (error) throw error;

        setSettings(data);
        toast({
          title: "Sucesso!",
          description: "Veículo criado com sucesso",
        });

        return data;
      }
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar veículo: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    if (vehicleId) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [vehicleId, user?.id]);

  return {
    settings,
    loading,
    saveSettings,
    refreshSettings: fetchSettings
  };
};