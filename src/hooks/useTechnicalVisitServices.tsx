import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface TechnicalVisitService {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  pricing_type: 'hourly' | 'fixed';
  fixed_price?: number;
  estimated_hours?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  pricing_type: 'hourly' | 'fixed';
  fixed_price?: number;
  estimated_hours?: number;
}

export const useTechnicalVisitServices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar serviços
  const { data: services, isLoading } = useQuery({
    queryKey: ['technical-visit-services'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('technical_visit_services')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as TechnicalVisitService[];
    },
    enabled: !!user,
  });

  // Criar serviço
  const createService = useMutation({
    mutationFn: async (serviceData: CreateServiceData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('technical_visit_services')
        .insert({
          ...serviceData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-visit-services'] });
      toast({
        title: "Sucesso",
        description: "Serviço criado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar serviço. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Atualizar serviço
  const updateService = useMutation({
    mutationFn: async ({ id, ...serviceData }: Partial<TechnicalVisitService> & { id: string }) => {
      const { data, error } = await supabase
        .from('technical_visit_services')
        .update(serviceData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-visit-services'] });
      toast({
        title: "Sucesso",
        description: "Serviço atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar serviço. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Deletar serviço (desativar)
  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('technical_visit_services')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-visit-services'] });
      toast({
        title: "Sucesso",
        description: "Serviço removido com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao remover serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover serviço. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    services: services || [],
    isLoading,
    createService,
    updateService,
    deleteService,
  };
};