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
  fuel_consumption: number;
  annual_mileage: number;
  depreciation_rate: number;
  fuel_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useVehicleSettingsList = () => {
  const [vehicles, setVehicles] = useState<VehicleSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchVehicles = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vehicle_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVehicles(data || []);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de veículos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicle_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVehicles(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Sucesso!",
        description: "Veículo removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir veículo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir veículo",
        variant: "destructive",
      });
    }
  };

  const toggleActiveStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('vehicle_settings')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === id ? { ...vehicle, is_active: isActive } : vehicle
      ));
      
      toast({
        title: "Sucesso!",
        description: `Veículo ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao alterar status do veículo:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do veículo",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user?.id]);

  return {
    vehicles,
    loading,
    deleteVehicle,
    toggleActiveStatus,
    refreshVehicles: fetchVehicles
  };
};