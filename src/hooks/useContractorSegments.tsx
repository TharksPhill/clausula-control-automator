import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ContractorSegment {
  id: string;
  name: string;
  cnpj: string;
  cnae_principal: string | null;
  cnae_descricao: string | null;
  segmento: string | null;
  city: string;
  state: string;
  contract_id: string;
  contract_number: string;
  monthly_value: string;
  status: string;
}

interface SegmentStats {
  name: string;
  count: number;
  totalRevenue: number;
  averageTicket: number;
  contractors: ContractorSegment[];
  description: string;
}

export const useContractorSegments = () => {
  const queryClient = useQueryClient();

  // Buscar contractors com dados de segmentação
  const { data: contractorsWithSegments, isLoading, refetch } = useQuery({
    queryKey: ['contractors-segments'],
    queryFn: async () => {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          monthly_value,
          status,
          contractors (
            id,
            name,
            cnpj,
            cnae_principal,
            cnae_descricao,
            segmento,
            city,
            state
          )
        `)
        .eq('status', 'Ativo')
        .order('contract_number', { ascending: false });

      if (error) {
        console.error('Erro ao buscar contratos:', error);
        throw error;
      }

      // Processar dados para estrutura plana
      const flatContractors: ContractorSegment[] = [];
      
      contracts?.forEach(contract => {
        contract.contractors?.forEach((contractor: any) => {
          flatContractors.push({
            ...contractor,
            contract_id: contract.id,
            contract_number: contract.contract_number,
            monthly_value: contract.monthly_value,
            status: contract.status
          });
        });
      });

      return flatContractors;
    }
  });

  // Agrupar contractors por segmento
  const segmentStats: SegmentStats[] = [];
  
  if (contractorsWithSegments) {
    const segmentMap = new Map<string, SegmentStats>();
    
    contractorsWithSegments.forEach(contractor => {
      const segment = contractor.segmento || 'Outros';
      
      if (!segmentMap.has(segment)) {
        segmentMap.set(segment, {
          name: segment,
          count: 0,
          totalRevenue: 0,
          averageTicket: 0,
          contractors: [],
          description: contractor.cnae_descricao || ''
        });
      }
      
      const stats = segmentMap.get(segment)!;
      stats.count++;
      stats.totalRevenue += parseFloat(contractor.monthly_value) || 0;
      stats.contractors.push(contractor);
    });
    
    // Calcular ticket médio
    segmentMap.forEach(stats => {
      stats.averageTicket = stats.count > 0 ? stats.totalRevenue / stats.count : 0;
      segmentStats.push(stats);
    });
    
    // Ordenar por quantidade de contratos
    segmentStats.sort((a, b) => b.count - a.count);
  }

  // Mutation para atualizar CNAEs em massa
  const updateCNAEsMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('update-cnae-data', {
        body: {}
      });
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Atualização concluída",
        description: `${data.updated} empresas foram atualizadas com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['contractors-segments'] });
    },
    onError: (error) => {
      toast({
        title: "Erro na atualização",
        description: "Não foi possível atualizar os CNAEs. Tente novamente.",
        variant: "destructive"
      });
      console.error('Erro ao atualizar CNAEs:', error);
    }
  });

  return {
    contractorsWithSegments,
    segmentStats,
    isLoading,
    refetch,
    updateCNAEs: updateCNAEsMutation.mutate,
    isUpdatingCNAEs: updateCNAEsMutation.isPending
  };
};