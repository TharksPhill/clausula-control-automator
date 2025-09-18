import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface VehicleSettings {
  id: string;
  user_id: string;
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
  fuel_consumption: number; // km/L
  annual_mileage: number;
  depreciation_rate: number; // %
  fuel_price: number; // R$ por litro
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

export const useVehicleSettings = () => {
  const [settings, setSettings] = useState<VehicleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSettings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('Buscando configurações de veículo para usuário:', user.id);

      const { data, error } = await supabase
        .from('vehicle_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Erro ao buscar configurações:', error);
        throw error;
      }

      console.log('Configurações de veículo encontradas:', data);
      setSettings(data);
    } catch (error) {
      console.error('Erro ao carregar configurações de veículo:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de veículo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (settingsData: VehicleSettingsFormData) => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    try {
      console.log('Atualizando configurações de veículo com dados:', settingsData);

      // Se já existem configurações, fazer UPDATE
      if (settings?.id) {
        const { data, error } = await supabase
          .from('vehicle_settings')
          .update({
            ...settingsData,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;

        console.log('Configurações de veículo atualizadas:', data);
        setSettings(data);
        
        toast({
          title: "Sucesso!",
          description: "Configurações de veículo atualizadas com sucesso",
        });

        return data;
      } else {
        // Se não existem configurações, fazer INSERT
        const { data, error } = await supabase
          .from('vehicle_settings')
          .insert({
            user_id: user.id,
            ...settingsData
          })
          .select()
          .single();

        if (error) throw error;

        console.log('Configurações de veículo criadas:', data);
        setSettings(data);
        
        toast({
          title: "Sucesso!",
          description: "Configurações de veículo criadas com sucesso",
        });

        return data;
      }
    } catch (error) {
      console.error('Erro ao salvar configurações de veículo:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar configurações: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
      return null;
    }
  };

  // Função para calcular custos por km (sem pedágio - será calculado na calculadora)
  const calculateCostPerKm = () => {
    if (!settings) return 0;

    const fuelCostPerKm = settings.fuel_price / settings.fuel_consumption;
    const ipvaCostPerKm = settings.annual_ipva / settings.annual_mileage;
    const insuranceCostPerKm = settings.annual_insurance / settings.annual_mileage;
    const maintenanceCostPerKm = settings.annual_maintenance / settings.annual_mileage;
    const depreciationCostPerKm = (settings.purchase_value * (settings.depreciation_rate / 100)) / settings.annual_mileage;
    
    return fuelCostPerKm + ipvaCostPerKm + insuranceCostPerKm + maintenanceCostPerKm + depreciationCostPerKm;
  };

  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  return {
    settings,
    loading,
    updateSettings,
    refreshSettings: fetchSettings,
    calculateCostPerKm
  };
};