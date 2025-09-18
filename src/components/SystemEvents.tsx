import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  Calendar,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, parseISO, addDays, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SystemEvent {
  id: string;
  type: 'contract_created' | 'contract_expiring' | 'trial_expiring' | 'contract_expired' | 'trial_expired';
  title: string;
  description: string;
  date: Date;
  contractNumber?: string;
  daysRemaining?: number;
  priority: 'high' | 'medium' | 'low';
}

export default function SystemEvents() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<string>("week");

  const getDateRange = (period: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(today);
    
    switch (period) {
      case "day":
        startDate = startOfDay(today);
        break;
      case "week":
        startDate = startOfWeek(today, { locale: ptBR });
        endDate = endOfWeek(today, { locale: ptBR });
        break;
      case "month":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "3months":
        startDate = startOfMonth(subDays(today, 90));
        break;
      default:
        startDate = startOfWeek(today, { locale: ptBR });
    }
    
    return { startDate, endDate };
  };

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const { startDate, endDate } = getDateRange(filterPeriod);

      // Buscar contratos
      const { data: contracts } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id);

      if (!contracts) return;

      const newEvents: SystemEvent[] = [];

      contracts.forEach(contract => {
        // Contratos criados no período
        const createdDate = parseISO(contract.created_at);
        if (createdDate >= startDate && createdDate <= endDate) {
          newEvents.push({
            id: `created-${contract.id}`,
            type: 'contract_created',
            title: 'Novo Contrato Criado',
            description: `Contrato ${contract.contract_number} foi criado`,
            date: createdDate,
            contractNumber: contract.contract_number,
            priority: 'low'
          });
        }

        // Contratos para vencer dentro do período selecionado
        if (contract.renewal_date) {
          const renewalDate = parseISO(contract.renewal_date);
          const daysUntilRenewal = differenceInDays(renewalDate, today);
          
          // Contratos que vencem dentro do período
          if (renewalDate >= startDate && renewalDate <= endDate && contract.status === 'Ativo') {
            if (daysUntilRenewal > 0) {
              newEvents.push({
                id: `expiring-${contract.id}`,
                type: 'contract_expiring',
                title: 'Contrato Próximo do Vencimento',
                description: `Contrato ${contract.contract_number} vence em ${daysUntilRenewal} dias`,
                date: renewalDate,
                contractNumber: contract.contract_number,
                daysRemaining: daysUntilRenewal,
                priority: daysUntilRenewal <= 3 ? 'high' : 'medium'
              });
            } else {
              newEvents.push({
                id: `expired-${contract.id}`,
                type: 'contract_expired',
                title: 'Contrato Vencido',
                description: `Contrato ${contract.contract_number} venceu há ${Math.abs(daysUntilRenewal)} dias`,
                date: renewalDate,
                contractNumber: contract.contract_number,
                daysRemaining: daysUntilRenewal,
                priority: 'high'
              });
            }
          }
        }

        // Período de teste
        if (contract.trial_days && contract.start_date) {
          const trialStartDate = parseISO(contract.start_date);
          const trialEndDate = addDays(trialStartDate, parseInt(contract.trial_days));
          const daysUntilTrialEnd = differenceInDays(trialEndDate, today);

          // Testes que terminam dentro do período
          if (trialEndDate >= startDate && trialEndDate <= endDate) {
            if (daysUntilTrialEnd > 0) {
              newEvents.push({
                id: `trial-expiring-${contract.id}`,
                type: 'trial_expiring',
                title: 'Período de Teste Expirando',
                description: `Teste do contrato ${contract.contract_number} termina em ${daysUntilTrialEnd} dias`,
                date: trialEndDate,
                contractNumber: contract.contract_number,
                daysRemaining: daysUntilTrialEnd,
                priority: daysUntilTrialEnd <= 3 ? 'high' : 'medium'
              });
            } else {
              newEvents.push({
                id: `trial-expired-${contract.id}`,
                type: 'trial_expired',
                title: 'Período de Teste Expirado',
                description: `Teste do contrato ${contract.contract_number} expirou há ${Math.abs(daysUntilTrialEnd)} dias`,
                date: trialEndDate,
                contractNumber: contract.contract_number,
                daysRemaining: daysUntilTrialEnd,
                priority: 'high'
              });
            }
          }
        }
      });

      // Ordenar eventos por prioridade e data
      newEvents.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.date.getTime() - a.date.getTime();
      });

      setEvents(newEvents);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filterPeriod]);

  useEffect(() => {
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);

    // Escutar mudanças em contratos
    const channel = supabase
      .channel('contracts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts'
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const getEventIcon = (type: SystemEvent['type']) => {
    switch (type) {
      case 'contract_created':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'contract_expiring':
      case 'trial_expiring':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'contract_expired':
      case 'trial_expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: SystemEvent['priority']) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;

    const labels = {
      high: 'Urgente',
      medium: 'Atenção',
      low: 'Info'
    };

    return (
      <Badge variant={variants[priority]} className="text-xs">
        {labels[priority]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Acontecimentos do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">Carregando eventos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[500px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Acontecimentos do Sistema
          </div>
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="3months">Últimos 3 Meses</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[350px] text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum evento importante nos próximos 10 dias
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-1">{getEventIcon(event.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium">{event.title}</h4>
                      {getPriorityBadge(event.priority)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-3 w-3 text-primary" />
                      <p className="text-sm font-semibold text-primary">
                        {format(event.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}