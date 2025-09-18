import React, { useState, useMemo } from 'react';
import { useContracts } from '@/hooks/useContracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TrialContractsListProps {
  onEditContract?: (contract: any) => void;
}

export const TrialContractsList = ({ onEditContract }: TrialContractsListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [showBulkRemoveDialog, setShowBulkRemoveDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const { contracts, fetchContracts } = useContracts();

  const contractsWithTrial = contracts?.filter(contract => {
    const trialDays = parseInt(contract.trial_days || '0');
    return trialDays > 0;
  }) || [];

  const trialContracts = useMemo(() => {
    return contractsWithTrial.map(contract => {
      const trialDays = parseInt(contract.trial_days || '0');
      let startDate: Date | null = null;
      
      if (contract.start_date) {
        if (contract.start_date.includes('-')) {
          startDate = new Date(contract.start_date);
        } else if (contract.start_date.includes('/')) {
          const parts = contract.start_date.split('/');
          if (parts.length === 3) {
            startDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
      }
      
      let endDate: Date | null = null;
      let daysRemaining = 0;
      let isExpired = false;
      
      if (startDate && !isNaN(startDate.getTime())) {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + trialDays);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startDateOnly = new Date(startDate);
        startDateOnly.setHours(0, 0, 0, 0);
        
        const endDateOnly = new Date(endDate);
        endDateOnly.setHours(0, 0, 0, 0);
        
        if (startDateOnly > today) {
          daysRemaining = trialDays;
          isExpired = false;
        } else if (today >= startDateOnly && today <= endDateOnly) {
          const daysPassed = Math.floor((today.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24));
          daysRemaining = Math.max(0, trialDays - daysPassed);
          isExpired = daysRemaining <= 0;
        } else {
          daysRemaining = 0;
          isExpired = true;
        }
      }
      
      const contractor = contract.contractors?.[0];
      
      return {
        ...contract,
        contractor,
        startDate,
        endDate,
        daysRemaining,
        isExpired,
        trialDays
      };
    });
  }, [contractsWithTrial]);

  // Paginação
  const totalItems = trialContracts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContracts = trialContracts.slice(startIndex, endIndex);

  const activeTrialContracts = trialContracts.filter(contract => !contract.isExpired);
  const expiredContracts = trialContracts.filter(contract => contract.isExpired);
  const expiringSoon = trialContracts.filter(contract => contract.daysRemaining > 0 && contract.daysRemaining <= 7);

  const handleSelectContract = (contractId: string) => {
    setSelectedContracts(prev => 
      prev.includes(contractId) 
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContracts.length === currentContracts.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(currentContracts.map(c => c.id));
    }
  };

  const handleRemoveTrialPeriod = async (contractId: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ trial_days: '0' })
        .eq('id', contractId);

      if (error) throw error;

      toast.success('Período de teste removido com sucesso');
      fetchContracts();
    } catch (error) {
      console.error('Erro ao remover período de teste:', error);
      toast.error('Erro ao remover período de teste');
    }
  };

  const handleBulkRemoveTrialPeriod = async () => {
    setIsRemoving(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ trial_days: '0' })
        .in('id', selectedContracts);

      if (error) throw error;

      toast.success(`Período de teste removido de ${selectedContracts.length} contratos`);
      setSelectedContracts([]);
      setShowBulkRemoveDialog(false);
      fetchContracts();
    } catch (error) {
      console.error('Erro ao remover período de teste em massa:', error);
      toast.error('Erro ao remover período de teste dos contratos selecionados');
    } finally {
      setIsRemoving(false);
    }
  };

  const selectedContractDetails = currentContracts.filter(c => selectedContracts.includes(c.id));

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-transparent border-orange-500/50 border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-orange-400 text-sm font-medium">Total em Teste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-300">{activeTrialContracts.length}</div>
              <p className="text-xs text-orange-400 mt-1">Contratos ativos</p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-red-500/50 border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-400 text-sm font-medium">Expirando em Breve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-300">{expiringSoon.length}</div>
              <p className="text-xs text-red-400 mt-1">Próximos 7 dias</p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-gray-500/50 border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-400 text-sm font-medium">Expirado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-300">{expiredContracts.length}</div>
              <p className="text-xs text-gray-400 mt-1">Contratos expirados</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-background border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Contratos em Período de Teste
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Lista completa de contratos com período de teste configurado
                </CardDescription>
              </div>
              
              {selectedContracts.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkRemoveDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover Período de Teste ({selectedContracts.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {trialContracts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-primary mb-2">Nenhum contrato com período de teste</h3>
                <p className="text-muted-foreground">Não há contratos configurados com período de teste no momento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedContracts.length === currentContracts.length && currentContracts.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Número do Contrato</TableHead>
                      <TableHead>Nome do Contratante</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Período de Teste</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentContracts.map(contract => (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedContracts.includes(contract.id)}
                            onCheckedChange={() => handleSelectContract(contract.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {contract.contract_number}
                        </TableCell>
                        <TableCell>
                          {contract.contractor?.name || 'Não informado'}
                        </TableCell>
                        <TableCell>
                          {contract.contractor?.cnpj || 'Não informado'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {contract.trialDays} dias
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Início: {contract.startDate ? contract.startDate.toLocaleDateString('pt-BR') : 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Fim: {contract.endDate ? contract.endDate.toLocaleDateString('pt-BR') : 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {contract.isExpired ? (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">
                              ⏰ Expirado
                            </Badge>
                          ) : contract.daysRemaining <= 7 ? (
                            <Badge variant="destructive" className="bg-destructive/20 text-destructive">
                              ⚠️ {contract.daysRemaining} dia{contract.daysRemaining !== 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              ✅ {contract.daysRemaining} dia{contract.daysRemaining !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTrialPeriod(contract.id);
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/20"
                            title="Remover período de teste"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalItems > 0 && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} contratos
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Itens por página:</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="h-8 px-3"
                        >
                          Anterior
                        </Button>

                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNumber}
                                variant={currentPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNumber)}
                                className="h-8 w-8 p-0"
                              >
                                {pageNumber}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="h-8 px-3"
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showBulkRemoveDialog} onOpenChange={setShowBulkRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Período de Teste</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o período de teste dos contratos selecionados? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <p className="text-sm text-muted-foreground mb-2">
              Contratos selecionados ({selectedContractDetails.length}):
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {selectedContractDetails.map(contract => (
                <div key={contract.id} className="text-sm">
                  • {contract.contract_number} - {contract.contractor?.name || 'Sem nome'}
                </div>
              ))}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRemoveTrialPeriod}
              disabled={isRemoving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRemoving ? 'Removendo...' : 'Remover Período de Teste'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};