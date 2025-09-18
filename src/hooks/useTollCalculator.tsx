
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TollData {
  totalCost: number;
  tollStations: Array<{
    name: string;
    cost: number;
    location: string;
  }>;
  route: string;
  isSimulated?: boolean;
  error?: string;
}

export const useTollCalculator = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const calculateTolls = async (
    origin: string,
    destination: string,
    distanceKm?: number
  ): Promise<TollData | null> => {
    setLoading(true);
    
    try {
      console.log('🛣️ Iniciando cálculo de pedágios via Google Routes:', {
        origin,
        destination,
        distanceKm
      });

      // Validar entradas
      if (!origin?.trim() || !destination?.trim()) {
        throw new Error('Origem e destino são obrigatórios');
      }

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.warn('⚠️ Usuário não autenticado, usando simulação');
        return getFallbackTollData(origin, destination, 'Usuário não autenticado');
      }

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('google-routes-tolls', {
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

      // Determinar tipo de toast baseado no resultado
      if (data.isSimulated) {
        let errorMessage = "Os valores de pedágio são estimados.";
        
        if (data.error) {
          if (data.error.includes('não encontrada') || data.error.includes('inválida')) {
            errorMessage = "Configure uma API key válida da Google Routes API nas configurações.";
          } else if (data.debug?.apiWorking === false) {
            errorMessage = "Erro na comunicação com a Google Routes API. Verifique sua API key.";
          } else {
            errorMessage = `${data.error} - Usando valores estimados.`;
          }
        } else if (data.debug?.apiWorking === true) {
          errorMessage = "API funcionando, mas sem informações de pedágio disponíveis para esta rota.";
        }

        toast({
          title: "⚠️ Valores Estimados",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Pedágios Calculados",
          description: `Custos precisos via Google Routes API: R$ ${data.totalCost.toFixed(2)} • ${data.tollStations.length} praça(s)`,
        });
      }
      
      return data;
      
    } catch (error) {
      console.error('❌ Erro ao calcular pedágios:', error);
      
      const fallbackResult = getFallbackTollData(origin, destination, error instanceof Error ? error.message : 'Erro desconhecido');

      toast({
        title: "❌ Erro na Conexão",
        description: `${error instanceof Error ? error.message : 'Erro desconhecido'}. Usando valores estimados.`,
        variant: "destructive",
      });
      
      return fallbackResult;
    } finally {
      setLoading(false);
    }
  };

  const getFallbackTollData = (origin: string, destination: string, errorMessage: string): TollData => {
    // Estimar pedágio baseado na rota
    let estimatedCost = 15; // Valor padrão
    
    if (origin.toLowerCase().includes('araraquara') && destination.toLowerCase().includes('ribeirão')) {
      estimatedCost = 12.80;
    } else if (origin.toLowerCase().includes('são paulo') || destination.toLowerCase().includes('são paulo')) {
      estimatedCost = 20;
    }

    return {
      totalCost: estimatedCost,
      tollStations: [
        {
          name: "Pedágio Estimado",
          cost: estimatedCost,
          location: "Valor estimado - Configure API key para valores precisos"
        }
      ],
      route: "Rota estimada",
      isSimulated: true,
      error: errorMessage
    };
  };

  return {
    calculateTolls,
    loading
  };
};
