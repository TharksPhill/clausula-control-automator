
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Trash2,
  AlertTriangle,
  History,
  Eye,
  Clock
} from "lucide-react";
import { format, differenceInDays, addYears, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BulkDeleteDialog from "./contracts/BulkDeleteDialog";
import { calculateRenewalDate, formatDateToBrazilian, calculateNextRenewalFromAdjustment } from "@/utils/dateUtils";
import { useContracts } from "@/hooks/useContracts";

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
  start_date?: string;
  contract_status?: string;
  contractor_id?: string;
  adjustment_history?: ContractAdjustment[];
}

interface ContractAdjustment {
  id: string;
  adjustment_date: string;
  adjustment_percentage: number;
  previous_value: string;
  new_value: string;
  reason: string;
  description: string;
  calculated_renewal_date?: string;
}

interface ReajustedContractsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contracts: ReajustedContract[];
}

const ReajustedContractsModal = ({ 
  open, 
  onOpenChange, 
  contracts,
}: ReajustedContractsModalProps) => {
  const { toast } = useToast();
  const { bulkDeleteContracts } = useContracts();
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [contractsWithDetails, setContractsWithDetails] = useState<ReajustedContract[]>([]);
  const [selectedContractHistory, setSelectedContractHistory] = useState<ContractAdjustment[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedContractForHistory, setSelectedContractForHistory] = useState<ReajustedContract | null>(null);

  // Load detailed contract information and calculate proper renewal dates
  useEffect(() => {
    const loadContractDetails = async () => {
      if (!open) return;

      try {
        console.log("Carregando contratos reajustados...");

        // Buscar todos os contratos que têm addons do tipo 'adjustment'
        const { data: adjustmentAddons, error: addonsError } = await supabase
          .from('contract_addons')
          .select(`
            id,
            contract_id,
            addon_type,
            description,
            previous_value,
            new_value,
            request_date,
            created_at,
            contracts (
              id,
              contract_number,
              start_date,
              renewal_date,
              plan_type,
              status,
              monthly_value,
              contractors (
                id,
                name
              )
            )
          `)
          .eq('addon_type', 'adjustment')
          .order('created_at', { ascending: false });

        if (addonsError) {
          console.error("Erro ao buscar addons:", addonsError);
          throw addonsError;
        }

        console.log("Addons encontrados:", adjustmentAddons);

        if (!adjustmentAddons || adjustmentAddons.length === 0) {
          console.log("Nenhum contrato reajustado encontrado");
          setContractsWithDetails([]);
          return;
        }

        // Agrupar addons por contrato para criar histórico
        const contractsMap = new Map<string, any>();
        
        adjustmentAddons.forEach(addon => {
          const contractId = addon.contract_id;
          const contract = addon.contracts;
          
          if (!contract) return;

          if (!contractsMap.has(contractId)) {
            contractsMap.set(contractId, {
              id: contractId,
              contract_number: contract.contract_number,
              contractor_name: contract.contractors?.[0]?.name || 'N/A',
              start_date: contract.start_date,
              plan_type: contract.plan_type || 'mensal',
              contract_status: contract.status || 'Ativo',
              contractor_id: contract.contractors?.[0]?.id || '',
              original_value: contract.monthly_value,
              adjustment_history: []
            });
          }

          // Calcular percentual de reajuste
          const prevValue = parseFloat(addon.previous_value || '0');
          const newValue = parseFloat(addon.new_value || '0');
          const adjustmentPercentage = prevValue > 0 ? ((newValue - prevValue) / prevValue) * 100 : 0;

          // Calcular data de renovação baseada na data de início e data do reajuste
          let calculatedRenewalDate = '';
          if (contract.start_date && addon.created_at) {
            calculatedRenewalDate = calculateNextRenewalFromAdjustment(
              contract.start_date, 
              addon.created_at, 
              12
            );
            
            console.log(`Contrato ${contract.contract_number}: Data início: ${contract.start_date}, Reajuste: ${addon.created_at}, Próxima renovação: ${calculatedRenewalDate}`);
          }

          const adjustmentData = {
            id: addon.id,
            adjustment_date: addon.created_at,
            adjustment_percentage: adjustmentPercentage,
            previous_value: addon.previous_value || '0',
            new_value: addon.new_value,
            reason: addon.description.split(' - ')[0] || 'Reajuste',
            description: addon.description,
            calculated_renewal_date: calculatedRenewalDate
          };

          contractsMap.get(contractId).adjustment_history.push(adjustmentData);
        });

        // Converter map para array e pegar o último reajuste de cada contrato
        const detailedContracts = Array.from(contractsMap.values()).map(contract => {
          // Ordenar histórico por data (mais recente primeiro)
          contract.adjustment_history.sort((a: ContractAdjustment, b: ContractAdjustment) => 
            new Date(b.adjustment_date).getTime() - new Date(a.adjustment_date).getTime()
          );

          const lastAdjustment = contract.adjustment_history[0];
          
          return {
            ...contract,
            previous_value: lastAdjustment.previous_value,
            new_value: lastAdjustment.new_value,
            adjustment_percentage: lastAdjustment.adjustment_percentage,
            adjustment_date: lastAdjustment.adjustment_date,
            next_renewal_date: lastAdjustment.calculated_renewal_date || contract.start_date
          };
        });

        console.log("Contratos processados:", detailedContracts);
        setContractsWithDetails(detailedContracts);

      } catch (error) {
        console.error('Erro ao carregar detalhes dos contratos:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar contratos reajustados",
          variant: "destructive"
        });
        setContractsWithDetails([]);
      }
    };

    loadContractDetails();
  }, [open, toast]);

  // Calculate days until renewal for each contract
  const contractsWithRenewalInfo = useMemo(() => {
    return contractsWithDetails.map(contract => {
      let daysUntilRenewal = 0;
      let urgency = 'low';

      if (contract.next_renewal_date) {
        try {
          const renewalDate = new Date(contract.next_renewal_date);
          const today = new Date();
          daysUntilRenewal = differenceInDays(renewalDate, today);
          
          if (daysUntilRenewal <= 7) urgency = 'high';
          else if (daysUntilRenewal <= 15) urgency = 'medium';
          else urgency = 'low';
        } catch (error) {
          console.warn('Erro ao calcular dias até renovação:', error);
        }
      }

      return {
        ...contract,
        daysUntilRenewal,
        urgency
      };
    });
  }, [contractsWithDetails]);

  // Statistics
  const stats = useMemo(() => {
    const totalContracts = contractsWithDetails.length;
    const totalPreviousValue = contractsWithDetails.reduce((sum, contract) => 
      sum + parseFloat(contract.previous_value || '0'), 0
    );
    const totalNewValue = contractsWithDetails.reduce((sum, contract) => 
      sum + parseFloat(contract.new_value || '0'), 0
    );
    const totalIncrease = totalNewValue - totalPreviousValue;
    const averageIncrease = totalContracts > 0 && totalPreviousValue > 0 ? (totalIncrease / totalPreviousValue) * 100 : 0;

    return { totalContracts, totalPreviousValue, totalNewValue, totalIncrease, averageIncrease };
  }, [contractsWithDetails]);

  const handleSelectContract = (contractId: string, checked: boolean) => {
    if (checked) {
      setSelectedContracts(prev => [...prev, contractId]);
    } else {
      setSelectedContracts(prev => prev.filter(id => id !== contractId));
    }
  };

  const handleSelectAllContracts = (checked: boolean) => {
    if (checked) {
      setSelectedContracts(contractsWithDetails.map(contract => contract.id));
    } else {
      setSelectedContracts([]);
    }
  };

  const handleBulkDelete = async (contractIds: string[]) => {
    try {
      await bulkDeleteContracts(contractIds);
      
      // Atualizar a lista local removendo os contratos excluídos
      setContractsWithDetails(prev => 
        prev.filter(contract => !contractIds.includes(contract.id))
      );
      
      setSelectedContracts([]);
      setShowBulkDeleteDialog(false);
      
      toast({
        title: "Sucesso",
        description: `${contractIds.length} contrato(s) removido(s) da lista de reajustados`,
      });
    } catch (error) {
      console.error("Erro ao excluir contratos:", error);
    }
  };

  const handleViewHistory = (contract: ReajustedContract) => {
    setSelectedContractForHistory(contract);
    setSelectedContractHistory(contract.adjustment_history || []);
    setShowHistoryDialog(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return <AlertTriangle className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <Calendar className="h-3 w-3" />;
      default: return <Calendar className="h-3 w-3" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1400px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Contratos Reajustados - Detalhamento
            </DialogTitle>
            <DialogDescription>
              Lista detalhada dos contratos reajustados com histórico individual, datas e status de renovação
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-green-800 text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Total Reajustado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{stats.totalContracts}</div>
                  <p className="text-xs text-green-700 mt-1">Contratos</p>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-800 text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valor Anterior
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-blue-900">
                    R$ {stats.totalPreviousValue.toFixed(2)}
                  </div>
                  <p className="text-xs text-blue-700 mt-1">Total mensal</p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-800 text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Novo Valor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-purple-900">
                    R$ {stats.totalNewValue.toFixed(2)}
                  </div>
                  <p className="text-xs text-purple-700 mt-1">Total mensal</p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-orange-800 text-sm font-medium flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Aumento Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-orange-900">
                    +R$ {stats.totalIncrease.toFixed(2)}
                  </div>
                  <p className="text-xs text-orange-700 mt-1">
                    ({stats.averageIncrease.toFixed(1)}% médio)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Contratos Reajustados */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Detalhamento dos Contratos Reajustados ({contractsWithRenewalInfo.length})
                  </CardTitle>
                  {selectedContracts.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowBulkDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Selecionados ({selectedContracts.length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {contractsWithRenewalInfo.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <TrendingUp className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato reajustado</h3>
                    <p className="text-gray-500">Não há contratos reajustados para exibir. Os reajustes aparecerão aqui após serem registrados nos addons dos contratos.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedContracts.length === contractsWithRenewalInfo.length && contractsWithRenewalInfo.length > 0}
                              onCheckedChange={handleSelectAllContracts}
                            />
                          </TableHead>
                          <TableHead>Contrato</TableHead>
                          <TableHead>Contratante</TableHead>
                          <TableHead>Data Início</TableHead>
                          <TableHead>Valor Anterior</TableHead>
                          <TableHead>Novo Valor</TableHead>
                          <TableHead>Reajuste</TableHead>
                          <TableHead>Próxima Renovação</TableHead>
                          <TableHead>Dias Restantes</TableHead>
                          <TableHead>Status Renovação</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contractsWithRenewalInfo.map((contract) => (
                          <TableRow key={contract.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedContracts.includes(contract.id)}
                                onCheckedChange={(checked) => handleSelectContract(contract.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{contract.contract_number}</div>
                                <div className="text-sm text-gray-500">
                                  {contract.plan_type || 'mensal'} • {contract.contract_status}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{contract.contractor_name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {contract.start_date ? 
                                  formatDateToBrazilian(contract.start_date) : 
                                  'N/A'
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-red-600 line-through">
                                R$ {parseFloat(contract.previous_value).toFixed(2)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-green-600">
                                R$ {parseFloat(contract.new_value).toFixed(2)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                +{contract.adjustment_percentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">
                                  {contract.next_renewal_date ?
                                    formatDateToBrazilian(contract.next_renewal_date) :
                                    'N/A'
                                  }
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {contract.daysUntilRenewal > 0 ? 
                                  `${contract.daysUntilRenewal} dias` : 
                                  contract.daysUntilRenewal < 0 ? 'Vencido' : 'Hoje'
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`${getUrgencyColor(contract.urgency)} flex items-center gap-1 w-fit`}
                              >
                                {getUrgencyIcon(contract.urgency)}
                                {contract.urgency === 'high' ? 'Urgente' : 
                                 contract.urgency === 'medium' ? 'Médio' : 'Normal'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewHistory(contract)}
                                >
                                  <History className="h-4 w-4 mr-1" />
                                  Histórico
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico de Reajustes */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Reajustes
            </DialogTitle>
            <DialogDescription>
              Histórico completo do contrato {selectedContractForHistory?.contract_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {selectedContractHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum reajuste encontrado para este contrato.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedContractHistory.map((adjustment, index) => (
                  <div key={adjustment.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Reajuste #{selectedContractHistory.length - index}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(adjustment.adjustment_date), "dd/MM/yyyy", { locale: ptBR })}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                      <div>
                        <span className="text-muted-foreground">Valor anterior:</span>
                        <div className="font-medium">R$ {adjustment.previous_value}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Novo valor:</span>
                        <div className="font-medium text-green-600">R$ {adjustment.new_value}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                      <div>
                        <span className="text-muted-foreground">Percentual:</span>
                        <div className="font-medium">+{adjustment.adjustment_percentage.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Próxima renovação:</span>
                        <div className="font-medium text-blue-600">
                          {adjustment.calculated_renewal_date ? 
                            formatDateToBrazilian(adjustment.calculated_renewal_date) : 
                            'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-muted-foreground">Descrição:</span>
                      <div>{adjustment.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão em Massa */}
      <BulkDeleteDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        selectedContracts={selectedContracts}
        contracts={contractsWithDetails}
        onConfirm={handleBulkDelete}
      />
    </>
  );
};

export default ReajustedContractsModal;
