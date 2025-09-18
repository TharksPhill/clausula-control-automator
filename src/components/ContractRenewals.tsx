import React, { useState, useMemo } from "react";
import { useContracts } from "@/hooks/useContracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Calendar, Clock, TrendingUp, History, RefreshCw, Percent, DollarSign, FileText, Plus, Trash2, Eye, CheckCircle, Lock } from "lucide-react";
import { format, differenceInDays, parseISO, addMonths, addYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReajustedContractsModal from "./ReajustedContractsModal";
import BulkAdjustmentModal from "./contracts/BulkAdjustmentModal";
import AdjustmentLockControl from "./contracts/AdjustmentLockControl";
import ContractAdjustmentModal from "./ContractAdjustmentModal";
import ContractAdjustmentHistoryModal from "./contracts/ContractAdjustmentHistoryModal";
import { calculateNextRenewalFromAdjustment } from "@/utils/dateUtils";
interface ContractAdjustment {
  id: string;
  contract_id: string;
  adjustment_date: string;
  adjustment_percentage: number;
  previous_value: string;
  new_value: string;
  reason: string;
  applied_by: string;
  created_at: string;
  description: string;
}
interface ReajustedContract {
  id: string;
  contract_number: string;
  contractor_name: string;
  previous_value: string;
  new_value: string;
  adjustment_percentage: number;
  adjustment_date: string;
  next_renewal_date: string;
  plan_type: string;
}
const ContractRenewals = () => {
  const {
    contracts,
    refetchContracts
  } = useContracts();
  const {
    toast
  } = useToast();
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [bulkAdjustmentDialog, setBulkAdjustmentDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [adjustmentHistoryOpen, setAdjustmentHistoryOpen] = useState(false);
  const [contractHistoryDialog, setContractHistoryDialog] = useState(false);
  const [reajustedContractsDialog, setReajustedContractsDialog] = useState(false);
  const [adjustmentPercentage, setAdjustmentPercentage] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [adjustmentHistory, setAdjustmentHistory] = useState<ContractAdjustment[]>([]);
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [deletingContracts, setDeletingContracts] = useState(false);
  const [reajustedContracts, setReajustedContracts] = useState<ReajustedContract[]>([]);

  // Novo estado para controlar bloqueios
  const [lockedContracts, setLockedContracts] = useState<Set<string>>(new Set());

  // Verificar bloqueios dos contratos ao carregar
  React.useEffect(() => {
    const checkLocks = async () => {
      if (!contracts || contracts.length === 0) return;
      const currentYear = new Date().getFullYear();
      const contractIds = contracts.map(c => c.id);
      try {
        const {
          data: locks,
          error
        } = await supabase.from('contract_adjustment_locks').select('contract_id, is_locked').in('contract_id', contractIds).eq('renewal_year', currentYear).eq('is_locked', true);
        if (error) {
          console.error('Erro ao verificar bloqueios:', error);
          return;
        }
        const lockedIds = new Set(locks?.map(lock => lock.contract_id) || []);
        setLockedContracts(lockedIds);
      } catch (error) {
        console.error('Erro ao verificar bloqueios:', error);
      }
    };
    checkLocks();
  }, [contracts]);
  const calculateNextRenewalDate = (currentRenewalDate: Date, planType: string) => {
    switch (planType?.toLowerCase()) {
      case 'mensal':
        return addMonths(currentRenewalDate, 1);
      case 'semestral':
        return addMonths(currentRenewalDate, 6);
      case 'anual':
        return addYears(currentRenewalDate, 1);
      default:
        return addMonths(currentRenewalDate, 1);
      // padrão mensal
    }
  };
  const renewalContracts = useMemo(() => {
    if (!contracts) return [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return contracts.filter(contract => {
      if (contract.status !== "Ativo" || !contract.renewal_date) return false;
      let renewalDate: Date | null = null;
      if (contract.renewal_date.includes('-')) {
        renewalDate = new Date(contract.renewal_date);
      } else if (contract.renewal_date.includes('/')) {
        const parts = contract.renewal_date.split('/');
        if (parts.length === 3) {
          renewalDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      return renewalDate && !isNaN(renewalDate.getTime()) && renewalDate <= thirtyDaysFromNow && renewalDate >= now;
    }).map(contract => {
      let renewalDate: Date | null = null;
      if (contract.renewal_date.includes('-')) {
        renewalDate = new Date(contract.renewal_date);
      } else if (contract.renewal_date.includes('/')) {
        const parts = contract.renewal_date.split('/');
        if (parts.length === 3) {
          renewalDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      const daysUntilRenewal = renewalDate ? differenceInDays(renewalDate, new Date()) : 0;
      const contractor = contract.contractors?.[0];
      const isLocked = lockedContracts.has(contract.id);
      return {
        ...contract,
        renewalDate,
        daysUntilRenewal,
        contractor,
        urgency: daysUntilRenewal <= 7 ? 'high' : daysUntilRenewal <= 15 ? 'medium' : 'low',
        isLocked
      };
    }).sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
  }, [contracts, lockedContracts]);
  const stats = useMemo(() => {
    const urgent = renewalContracts.filter(c => c.urgency === 'high').length;
    const medium = renewalContracts.filter(c => c.urgency === 'medium').length;
    const low = renewalContracts.filter(c => c.urgency === 'low').length;
    const locked = renewalContracts.filter(c => c.isLocked).length;
    return {
      urgent,
      medium,
      low,
      locked,
      total: renewalContracts.length
    };
  }, [renewalContracts]);
  const selectedContractsData = useMemo(() => {
    return renewalContracts.filter(contract => selectedContracts.includes(contract.id));
  }, [renewalContracts, selectedContracts]);
  const handleApplyAdjustment = async () => {
    if (!selectedContract || !adjustmentPercentage || !adjustmentReason) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Verificar se o contrato está bloqueado
    if (lockedContracts.has(selectedContract.id)) {
      toast({
        title: "Contrato Bloqueado",
        description: "Este contrato está com o período de reajuste bloqueado. Desbloqueie primeiro para aplicar reajustes.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const currentValue = parseFloat(selectedContract.monthly_value || '0');
      const percentage = parseFloat(adjustmentPercentage);
      const newValue = currentValue * (1 + percentage / 100);

      // Criar registro do reajuste
      const {
        error: adjustmentError
      } = await supabase.from('contract_addons').insert({
        contract_id: selectedContract.id,
        addon_type: 'adjustment',
        description: `Reajuste de ${percentage}% - ${adjustmentReason}`,
        previous_value: currentValue.toFixed(2),
        new_value: newValue.toFixed(2),
        requested_by: 'company'
      });
      if (adjustmentError) throw adjustmentError;

      // Atualizar valor do contrato
      const {
        error: contractError
      } = await supabase.from('contracts').update({
        monthly_value: newValue.toFixed(2),
        updated_at: new Date().toISOString()
      }).eq('id', selectedContract.id);
      if (contractError) throw contractError;

      // Calcular nova data de renovação usando a nova função que considera o reajuste
      const newRenewalDate = calculateNextRenewalFromAdjustment(selectedContract.start_date, new Date().toISOString(), 12);

      // Atualizar data de renovação
      const {
        error: renewalError
      } = await supabase.from('contracts').update({
        renewal_date: newRenewalDate
      }).eq('id', selectedContract.id);
      if (renewalError) throw renewalError;

      // Criar notificação automática para a próxima renovação
      const {
        error: notificationError
      } = await supabase.from('notifications').insert({
        user_id: selectedContract.user_id,
        contract_id: selectedContract.id,
        type: 'renewal_reminder',
        title: `Renovação programada - Contrato ${selectedContract.contract_number}`,
        message: `O contrato ${selectedContract.contract_number} está programado para renovação em ${format(new Date(newRenewalDate), "dd/MM/yyyy", {
          locale: ptBR
        })}`,
        expires_at: format(new Date(newRenewalDate), 'yyyy-MM-dd HH:mm:ss')
      });
      if (notificationError) {
        console.warn('Erro ao criar notificação:', notificationError);
      }

      // Adicionar contrato à lista de reajustados
      const reajustedContract: ReajustedContract = {
        id: selectedContract.id,
        contract_number: selectedContract.contract_number,
        contractor_name: selectedContract.contractor?.name || 'N/A',
        previous_value: currentValue.toFixed(2),
        new_value: newValue.toFixed(2),
        adjustment_percentage: percentage,
        adjustment_date: new Date().toISOString(),
        next_renewal_date: newRenewalDate,
        plan_type: selectedContract.plan_type || 'mensal'
      };
      setReajustedContracts(prev => [...prev, reajustedContract]);
      toast({
        title: "Reajuste Aplicado",
        description: `Reajuste de ${percentage}% aplicado com sucesso. Próxima renovação: ${format(new Date(newRenewalDate), "dd/MM/yyyy", {
          locale: ptBR
        })}`
      });
      setAdjustmentModalOpen(false);
      setAdjustmentPercentage("");
      setAdjustmentReason("");
      setSelectedContract(null);
      setReajustedContractsDialog(true);
      await refetchContracts();
    } catch (error) {
      console.error('Erro ao aplicar reajuste:', error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar reajuste. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleViewHistory = async (contract: any) => {
    setSelectedContract(contract);
    setAdjustmentHistoryOpen(true);
  };
  const handleViewContractHistory = (contract: any) => {
    setSelectedContract(contract);
    setContractHistoryDialog(true);
  };
  const handleSelectContract = (contractId: string, checked: boolean) => {
    if (checked) {
      setSelectedContracts(prev => [...prev, contractId]);
    } else {
      setSelectedContracts(prev => prev.filter(id => id !== contractId));
    }
  };
  const handleSelectAllContracts = (checked: boolean) => {
    if (checked) {
      setSelectedContracts(renewalContracts.map(contract => contract.id));
    } else {
      setSelectedContracts([]);
    }
  };
  const handleBulkDelete = async () => {
    if (selectedContracts.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos um contrato para excluir",
        variant: "destructive"
      });
      return;
    }
    setDeletingContracts(true);
    try {
      // Excluir contratos selecionados
      const {
        error
      } = await supabase.from('contracts').delete().in('id', selectedContracts);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: `${selectedContracts.length} contrato(s) excluído(s) com sucesso`
      });
      setSelectedContracts([]);
      setShowBulkDeleteDialog(false);
      await refetchContracts();
    } catch (error) {
      console.error('Erro ao excluir contratos:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir contratos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setDeletingContracts(false);
    }
  };
  const handleDeleteReajustedContracts = async (contractIds: string[]) => {
    try {
      // Remover os contratos da lista de reajustados
      setReajustedContracts(prev => prev.filter(contract => !contractIds.includes(contract.id)));
      toast({
        title: "Sucesso",
        description: `${contractIds.length} contrato(s) removido(s) da lista de reajustados`
      });
    } catch (error) {
      console.error('Erro ao remover contratos:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover contratos da lista. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  const handleLockStatusChange = (contractId: string, isLocked: boolean) => {
    setLockedContracts(prev => {
      const newSet = new Set(prev);
      if (isLocked) {
        newSet.add(contractId);
      } else {
        newSet.delete(contractId);
      }
      return newSet;
    });
  };
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };
  return <div className="space-y-6">
      {/* Header no mesmo estilo das Assinaturas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Renovações de Contratos</h2>
          <p className="text-muted-foreground mt-1">Controle visual padronizado com o menu de Assinaturas</p>
        </div>
        <Button onClick={refetchContracts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas (estilo idêntico aos cards de Assinaturas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="border border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Urgente (≤ 7 dias)</p>
                <p className="text-2xl font-bold text-foreground">{stats.urgent}</p>
              </div>
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Médio (8-15 dias)</p>
                <p className="text-2xl font-bold text-foreground">{stats.medium}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-500/10">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Baixo (16-30 dias)</p>
                <p className="text-2xl font-bold text-foreground">{stats.low}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Bloqueados</p>
                <p className="text-2xl font-bold text-foreground">{stats.locked}</p>
              </div>
              <div className="p-3 rounded-full bg-muted">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Callout - Contratos Reajustados (padronizado) */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            Contratos Reajustados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Visualize todos os contratos que já foram reajustados com seus históricos e datas de renovação
              </p>
              <Button onClick={() => setReajustedContractsDialog(true)} variant="default">
                <CheckCircle className="h-4 w-4 mr-2" />
                Ver Todos os Contratos Reajustados
              </Button>
            </div>
            {reajustedContracts.length > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">{reajustedContracts.length}</div>
                <p className="text-xs text-muted-foreground">Reajustados hoje</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Contratos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Contratos para Renovação (Próximos 30 Dias)
            </CardTitle>
            {selectedContracts.length > 0 && <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setBulkAdjustmentDialog(true)} disabled={selectedContracts.length === 0}>
                  <Percent className="h-4 w-4 mr-2" />
                  Reajustar ({selectedContracts.length})
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Selecionados ({selectedContracts.length})
                </Button>
              </div>}
          </div>
        </CardHeader>
        <CardContent>
          {renewalContracts.length === 0 ? <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <RefreshCw className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato para renovar</h3>
              <p className="text-gray-500">Não há contratos com vencimento nos próximos 30 dias.</p>
            </div> : <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox checked={selectedContracts.length === renewalContracts.length} onCheckedChange={handleSelectAllContracts} />
                    </TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Contratante</TableHead>
                    <TableHead>Valor Atual</TableHead>
                    <TableHead>Data de Renovação</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Urgência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bloqueio</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renewalContracts.map(contract => <TableRow key={contract.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox checked={selectedContracts.includes(contract.id)} onCheckedChange={checked => handleSelectContract(contract.id, checked as boolean)} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contract.contract_number}</div>
                          <div className="text-sm text-gray-500">
                            Plano: {contract.plan_type || 'mensal'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contract.contractor?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{contract.contractor?.cnpj || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          R$ {parseFloat(contract.monthly_value || '0').toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.renewalDate ? format(contract.renewalDate, "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR
                  }) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getUrgencyColor(contract.urgency)}>
                          {contract.daysUntilRenewal} dia{contract.daysUntilRenewal !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getUrgencyColor(contract.urgency)} flex items-center gap-1 w-fit`}>
                          {getUrgencyIcon(contract.urgency)}
                          {contract.urgency === 'high' ? 'Urgente' : contract.urgency === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AdjustmentLockControl contractId={contract.id} renewalYear={new Date().getFullYear()} onLockStatusChange={isLocked => handleLockStatusChange(contract.id, isLocked)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                      setSelectedContract(contract);
                      setAdjustmentModalOpen(true);
                    }} disabled={contract.isLocked}>
                            <Percent className="h-4 w-4 mr-1" />
                            Reajustar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleViewHistory(contract)}>
                            <History className="h-4 w-4 mr-1" />
                            Histórico
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleViewContractHistory(contract)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Contrato
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </CardContent>
      </Card>

      {/* Modal de Reajuste - usando o mesmo modal da Análise de Lucro */}
      <ContractAdjustmentModal
        contract={selectedContract}
        open={adjustmentModalOpen}
        onOpenChange={(open) => {
          setAdjustmentModalOpen(open);
          if (!open) setSelectedContract(null);
        }}
        analysisDate={new Date()}
      />

      {/* Histórico de Reajustes - novo modal conectado à tabela contract_adjustments */}
      <ContractAdjustmentHistoryModal
        open={adjustmentHistoryOpen}
        onOpenChange={(open) => {
          setAdjustmentHistoryOpen(open);
          if (!open) setSelectedContract(null);
        }}
        contract={selectedContract}
      />

      {/* Dialog de Histórico do Contrato */}
      <Dialog open={contractHistoryDialog} onOpenChange={setContractHistoryDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico do Contrato
            </DialogTitle>
            <DialogDescription>
              Histórico completo do contrato {selectedContract?.contract_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-96">
            {selectedContract && <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Número:</span> {selectedContract.contract_number}</div>
                      <div><span className="font-medium">Status:</span> {selectedContract.status}</div>
                      <div><span className="font-medium">Tipo de Plano:</span> {selectedContract.plan_type}</div>
                      <div><span className="font-medium">Valor Mensal:</span> R$ {parseFloat(selectedContract.monthly_value || '0').toFixed(2)}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Datas</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Data de Início:</span> {selectedContract.start_date}</div>
                      <div><span className="font-medium">Data de Renovação:</span> {selectedContract.renewal_date}</div>
                      <div><span className="font-medium">Dia de Pagamento:</span> {selectedContract.payment_day}</div>
                      <div><span className="font-medium">Período de Teste:</span> {selectedContract.trial_days} dias</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Contratante</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Nome:</span> {selectedContract.contractor?.name || 'N/A'}</div>
                    <div><span className="font-medium">CNPJ:</span> {selectedContract.contractor?.cnpj || 'N/A'}</div>
                    <div><span className="font-medium">Responsável:</span> {selectedContract.contractor?.responsible_name || 'N/A'}</div>
                    <div><span className="font-medium">CPF:</span> {selectedContract.contractor?.responsible_cpf || 'N/A'}</div>
                    <div><span className="font-medium">Email:</span> {selectedContract.contractor?.email || 'N/A'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Detalhes do Contrato</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Quantidade de Funcionários:</span> {selectedContract.employee_count}</div>
                    <div><span className="font-medium">Quantidade de CNPJs:</span> {selectedContract.cnpj_count}</div>
                    <div><span className="font-medium">Desconto Semestral:</span> {selectedContract.semestral_discount}%</div>
                    <div><span className="font-medium">Desconto Anual:</span> {selectedContract.anual_discount}%</div>
                  </div>
                </div>
              </div>}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractHistoryDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão em Massa */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmar Exclusão em Massa
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {selectedContracts.length} contrato(s) selecionado(s)?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)} disabled={deletingContracts}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={deletingContracts}>
              {deletingContracts ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Reajuste em Massa */}
      <BulkAdjustmentModal open={bulkAdjustmentDialog} onOpenChange={setBulkAdjustmentDialog} selectedContracts={selectedContractsData} onSuccess={refetchContracts} />

      {/* Modal de Contratos Reajustados */}
      <ReajustedContractsModal open={reajustedContractsDialog} onOpenChange={setReajustedContractsDialog} contracts={reajustedContracts} />
    </div>;
};
export default ContractRenewals;