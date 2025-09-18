import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Calendar, ArrowDown, ArrowUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContractStatusHistoryProps {
  contractId: string;
}

interface StatusHistoryEntry {
  id: string;
  contract_id: string;
  user_id: string;
  status: 'Ativo' | 'Inativo';
  status_date: string;
  status_type: 'termination' | 'reactivation';
  created_at: string;
  notes?: string;
}

export const ContractStatusHistory = ({ contractId }: ContractStatusHistoryProps) => {
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchHistory = async () => {
      console.log('🔍 [ContractStatusHistory] Buscando histórico para:', contractId);
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('contract_status_history')
          .select('*')
          .eq('contract_id', contractId)
          .order('status_date', { ascending: true });
        
        if (error) {
          console.error('❌ Erro ao buscar histórico:', error);
        } else {
          console.log('✅ Histórico encontrado:', data);
          console.log('📊 Quantidade de registros:', data?.length || 0);
          setStatusHistory((data || []) as StatusHistoryEntry[]);
        }
      } catch (err) {
        console.error('❌ Erro inesperado:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (contractId) {
      fetchHistory();
    }
    
    // Listener para mudanças de status
    const handleStatusChange = (event: CustomEvent) => {
      console.log('📢 [ContractStatusHistory] Evento recebido:', event.detail);
      if (event.detail?.contractId === contractId) {
        console.log('🔄 [ContractStatusHistory] Recarregando histórico...');
        fetchHistory();
      }
    };
    
    window.addEventListener('contract-status-changed' as any, handleStatusChange);
    
    return () => {
      window.removeEventListener('contract-status-changed' as any, handleStatusChange);
    };
  }, [contractId]);
  
  // Função para calcular períodos inativos
  const getInactivePeriods = () => {
    const periods: Array<{ start: Date; end: Date | null }> = [];
    let inactiveStart: Date | null = null;

    for (const entry of statusHistory) {
      if (entry.status_type === 'termination') {
        inactiveStart = new Date(entry.status_date);
      } else if (entry.status_type === 'reactivation' && inactiveStart) {
        periods.push({
          start: inactiveStart,
          end: new Date(entry.status_date)
        });
        inactiveStart = null;
      }
    }

    if (inactiveStart) {
      periods.push({
        start: inactiveStart,
        end: null
      });
    }

    return periods;
  };
  
  const inactivePeriods = getInactivePeriods();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            <p>Carregando histórico para contrato: {contractId}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statusHistory || statusHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Nenhum histórico de alteração de status encontrado.
          </p>
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>Debug Info:</p>
            <p>Contract ID: {contractId}</p>
            <p>Is Loading: {isLoading ? 'Sim' : 'Não'}</p>
            <p>História Length: {statusHistory?.length || 0}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('🎯 [ContractStatusHistory] Renderizando histórico com', statusHistory.length, 'entradas');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Períodos inativos resumidos */}
        {inactivePeriods.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Períodos Inativos:</p>
            {inactivePeriods.map((period, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(period.start, 'dd/MM/yyyy', { locale: ptBR })} até{' '}
                  {period.end 
                    ? format(period.end, 'dd/MM/yyyy', { locale: ptBR })
                    : 'presente'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Timeline de mudanças */}
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {statusHistory.map((entry, index) => (
              <div key={entry.id} className="flex gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <div className={`absolute h-3 w-3 rounded-full ${
                    entry.status === 'Ativo' 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`} />
                  {entry.status_type === 'termination' ? (
                    <ArrowDown className="h-5 w-5 text-red-500 relative z-10" />
                  ) : (
                    <ArrowUp className="h-5 w-5 text-green-500 relative z-10" />
                  )}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={entry.status === 'Ativo' ? 'default' : 'secondary'}
                      className={entry.status === 'Ativo' 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                      }
                    >
                      {entry.status === 'Ativo' ? 'Reativado' : 'Encerrado'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(entry.status_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground">{entry.notes}</p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Registrado em {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};