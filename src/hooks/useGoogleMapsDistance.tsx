
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DistanceResult {
  distance: string;
  distanceValue: number;
  duration: string;
  durationValue: number;
  isSimulated?: boolean;
  error?: string;
}

export const useGoogleMapsDistance = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const calculateDistance = async (
    origin: string,
    destination: string
  ): Promise<DistanceResult | null> => {
    setLoading(true);
    
    try {
      console.log('🗺️ Iniciando cálculo de distância via Edge Function:', {
        origin,
        destination
      });

      // Validar entradas
      if (!origin?.trim() || !destination?.trim()) {
        throw new Error('Origem e destino são obrigatórios');
      }

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.warn('⚠️ Usuário não autenticado, usando simulação');
        
        const estimatedDistance = Math.floor(Math.random() * 80) + 40;
        const estimatedDuration = Math.floor(estimatedDistance / 50 * 60);
        
        const mockResult: DistanceResult = {
          distance: `${estimatedDistance} km`,
          distanceValue: estimatedDistance,
          duration: `${Math.floor(estimatedDuration / 60)}h ${estimatedDuration % 60}min`,
          durationValue: estimatedDuration,
          isSimulated: true
        };

        toast({
          title: "⚠️ Usuário não autenticado",
          description: "Faça login para usar a API do Google Maps. Usando valores simulados.",
          variant: "destructive",
        });
        
        return mockResult;
      }

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('google-maps-distance', {
        body: {
          origin: origin.trim(),
          destination: destination.trim()
        }
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        throw new Error(error.message || 'Erro na chamada da função');
      }

      console.log('📊 Resultado da Edge Function:', data);

      if (data.isSimulated) {
        console.log('🎲 Usando valores simulados');
        
        let errorMessage = "Configure uma API key válida do Google Maps para obter distâncias precisas.";
        if (data.error) {
          if (data.error.includes('não encontrado') || data.error.includes('NOT_FOUND')) {
            errorMessage = `Endereço não encontrado: ${data.error}`;
          } else if (data.error.includes('API Key')) {
            errorMessage = `Problema com API Key: ${data.error}`;
          } else if (data.error.includes('REQUEST_DENIED')) {
            errorMessage = "API Key inválida ou sem permissão. Verifique as configurações no Google Cloud Console.";
          } else {
            errorMessage = `Erro: ${data.error}`;
          }
        }

        toast({
          title: "⚠️ Usando Valores Simulados",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Sucesso!",
          description: `Distância calculada: ${data.distance} • Tempo: ${data.duration}`,
        });
      }
      
      return data;
      
    } catch (error) {
      console.error('❌ Erro ao calcular distância:', error);
      
      // Fallback para simulação em caso de erro
      const estimatedDistance = Math.floor(Math.random() * 80) + 40;
      const estimatedDuration = Math.floor(estimatedDistance / 50 * 60);
      
      const fallbackResult: DistanceResult = {
        distance: `${estimatedDistance} km`,
        distanceValue: estimatedDistance,
        duration: `${Math.floor(estimatedDuration / 60)}h ${estimatedDuration % 60}min`,
        durationValue: estimatedDuration,
        isSimulated: true
      };

      toast({
        title: "❌ Erro na Conexão",
        description: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}. Usando valores simulados.`,
        variant: "destructive",
      });
      
      return fallbackResult;
    } finally {
      setLoading(false);
    }
  };

  return {
    calculateDistance,
    loading
  };
};
