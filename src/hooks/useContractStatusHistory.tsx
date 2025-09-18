import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface ContractStatusHistoryEntry {
  id: string;
  contract_id: string;
  user_id: string;
  status: 'Ativo' | 'Inativo';
  status_date: string;
  status_type: 'termination' | 'reactivation';
  created_at: string;
  created_by?: string;
  notes?: string;
}

export const useContractStatusHistory = (contractId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: statusHistory, isLoading, error, refetch } = useQuery({
    queryKey: ['contract-status-history', contractId],
    queryFn: async () => {
      if (!contractId) return [];
      
      console.log('🔍 [DEBUG] Buscando histórico para contrato:', contractId);
      
      const { data, error } = await supabase
        .from('contract_status_history')
        .select('*')
        .eq('contract_id', contractId)
        .order('status_date', { ascending: true });

      if (error) {
        console.error('❌ [DEBUG] Erro ao buscar histórico de status:', error);
        throw error;
      }

      console.log('📋 [DEBUG] Histórico encontrado:', data);
      console.log('📋 [DEBUG] Quantidade de registros:', data?.length || 0);
      
      // Vamos garantir que retornamos os dados mesmo que seja um array vazio
      return (data || []) as ContractStatusHistoryEntry[];
    },
    enabled: !!contractId,
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnMount: true, // Sempre buscar quando o componente montar
    refetchOnWindowFocus: true, // Buscar quando a janela ganhar foco
  });

  // Escutar eventos de mudança de status para recarregar os dados
  useEffect(() => {
    const handleStatusChange = (event: CustomEvent) => {
      console.log('📢 [DEBUG] Evento contract-status-changed recebido:', event.detail);
      if (event.detail?.contractId === contractId) {
        console.log('🔄 [DEBUG] Invalidando cache do histórico para contrato:', contractId);
        queryClient.invalidateQueries({ queryKey: ['contract-status-history', contractId] });
      }
    };

    window.addEventListener('contract-status-changed' as any, handleStatusChange);
    
    return () => {
      window.removeEventListener('contract-status-changed' as any, handleStatusChange);
    };
  }, [contractId, queryClient]);

  // Função para verificar se o contrato está inativo em uma data específica
  const isContractInactiveOnDate = (date: Date): boolean => {
    if (!statusHistory || statusHistory.length === 0) return false;

    // Percorrer o histórico e determinar o status na data especificada
    let currentStatus: 'Ativo' | 'Inativo' = 'Ativo'; // Assume ativo por padrão
    
    for (const entry of statusHistory) {
      const statusDate = new Date(entry.status_date);
      
      // Se a data do status é posterior à data analisada, parar
      if (statusDate > date) break;
      
      // Atualizar o status atual baseado no tipo
      currentStatus = entry.status;
    }
    
    return currentStatus === 'Inativo';
  };

  // Função para obter todos os períodos inativos
  const getInactivePeriods = (): Array<{ start: Date; end: Date | null }> => {
    if (!statusHistory || statusHistory.length === 0) return [];

    const periods: Array<{ start: Date; end: Date | null }> = [];
    let inactiveStart: Date | null = null;

    for (const entry of statusHistory) {
      if (entry.status_type === 'termination') {
        // Início de período inativo
        inactiveStart = new Date(entry.status_date);
      } else if (entry.status_type === 'reactivation' && inactiveStart) {
        // Fim de período inativo
        periods.push({
          start: inactiveStart,
          end: new Date(entry.status_date)
        });
        inactiveStart = null;
      }
    }

    // Se há um período inativo aberto (sem reativação)
    if (inactiveStart) {
      periods.push({
        start: inactiveStart,
        end: null
      });
    }

    return periods;
  };

  // Função para verificar se um mês específico está em período inativo
  const isMonthInactive = (year: number, month: number): boolean => {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0); // Último dia do mês
    
    const inactivePeriods = getInactivePeriods();
    
    for (const period of inactivePeriods) {
      const periodStart = period.start;
      const periodEnd = period.end || new Date(9999, 11, 31); // Se não tem fim, assume futuro distante
      
      // Verificar se há sobreposição entre o mês e o período inativo
      if (periodStart <= monthEnd && periodEnd >= monthStart) {
        return true;
      }
    }
    
    return false;
  };

  return {
    statusHistory,
    isLoading,
    error,
    refetch,
    isContractInactiveOnDate,
    getInactivePeriods,
    isMonthInactive
  };
};