import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useContracts } from '@/hooks/useContracts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, X, Search, Filter, Power, Calendar, FileText, ChevronLeft, ChevronRight, MoreHorizontal, XCircle, CheckCircle } from 'lucide-react';

export function TerminateContractsList() {
  const { contracts, refetchContracts } = useContracts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [terminationDate, setTerminationDate] = useState('');
  const [activationDate, setActivationDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrar todos os contratos (ativos e inativos)
  const allContracts = contracts;

  const filteredContracts = allContracts.filter(contract => {
    const matchesSearch = 
      contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractors?.[0]?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractors?.[0]?.cnpj?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesPlan = planFilter === 'all' || 
      (planFilter === 'mensal' && contract.plan_type === 'mensal') ||
      (planFilter === 'semestral' && contract.plan_type === 'semestral') ||
      (planFilter === 'anual' && contract.plan_type === 'anual');
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Paginação
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, startIndex + itemsPerPage);

  // Estatísticas
  const activeContracts = allContracts.filter(c => c.status === 'Ativo' || c.status === 'Revisado');
  const inactiveContracts = allContracts.filter(c => c.status === 'Inativo');
  
  const stats = {
    active: activeContracts.length,
    inactive: inactiveContracts.length,
    terminated_today: inactiveContracts.filter(c => {
      if (!c.termination_date) return false;
      const today = new Date();
      const terminationDate = new Date(c.termination_date);
      return terminationDate.toDateString() === today.toDateString();
    }).length,
    total: allContracts.length
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContracts(paginatedContracts.map(c => c.id));
    } else {
      setSelectedContracts([]);
    }
  };

  const handleSelectContract = (contractId: string, checked: boolean) => {
    if (checked) {
      setSelectedContracts([...selectedContracts, contractId]);
    } else {
      setSelectedContracts(selectedContracts.filter(id => id !== contractId));
    }
  };

  const handleOpenTerminateDialog = (contract: any) => {
    setSelectedContract(contract);
    setTerminationDate('');
    setShowTerminateDialog(true);
  };

  const handleTerminateContract = async () => {
    if (!selectedContract || !terminationDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data de encerramento.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ 
          status: 'Inativo',
          termination_date: terminationDate 
        })
        .eq('id', selectedContract.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contrato encerrado com sucesso.",
      });

      setShowTerminateDialog(false);
      refetchContracts();
    } catch (error) {
      console.error('Erro ao encerrar contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível encerrar o contrato.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenActivateDialog = (contract: any) => {
    setSelectedContract(contract);
    setActivationDate('');
    setShowActivateDialog(true);
  };

  const handleActivateContract = async () => {
    if (!selectedContract || !activationDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data de ativação.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ 
          status: 'Ativo',
          reactivation_date: activationDate,
          termination_date: null
        })
        .eq('id', selectedContract.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contrato ativado com sucesso.",
      });

      setShowActivateDialog(false);
      refetchContracts();
    } catch (error) {
      console.error('Erro ao ativar contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ativar o contrato.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return format(new Date(Number(year), Number(month) - 1, Number(day)), 'dd/MM/yyyy', { locale: ptBR });
      }
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Ativo') {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          Ativo
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-gray-500 border-gray-500">
        {status}
      </Badge>
    );
  };

  const getPlanBadge = (planType: string) => {
    const planColors = {
      mensal: 'text-blue-600 border-blue-600',
      semestral: 'text-purple-600 border-purple-600',
      anual: 'text-amber-600 border-amber-600'
    };
    
    const color = planColors[planType as keyof typeof planColors] || 'text-gray-500 border-gray-500';
    
    return (
      <Badge variant="outline" className={color}>
        {planType?.charAt(0).toUpperCase() + planType?.slice(1) || 'Mensal'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contratos Ativos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Em funcionamento</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contratos Inativos</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground mt-1">Encerrados</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Encerrados Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.terminated_today}</div>
            <p className="text-xs text-muted-foreground mt-1">Encerramentos recentes</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Contratos</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Todos os contratos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por número, CNPJ ou razão social..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 bg-background" 
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Revisado">Revisado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Todos os Planos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="bg-background border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedContracts.length === paginatedContracts.length && paginatedContracts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Número do Contrato</TableHead>
                <TableHead>Nome do Contratante</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Data de Encerramento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum contrato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedContracts.map((contract) => (
                  <TableRow key={contract.id} className="hover:bg-muted/50 border-border">
                    <TableCell>
                      <Checkbox
                        checked={selectedContracts.includes(contract.id)}
                        onCheckedChange={(checked) => handleSelectContract(contract.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {contract.contract_number}
                    </TableCell>
                    <TableCell>
                      {contract.contractors?.[0]?.name || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {contract.contractors?.[0]?.cnpj || '-'}
                    </TableCell>
                    <TableCell>
                      {contract.termination_date ? formatDate(contract.termination_date) : '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(contract.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {contract.status === 'Inativo' ? (
                            <DropdownMenuItem onClick={() => handleOpenActivateDialog(contract)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Ativar Contrato
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleOpenTerminateDialog(contract)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Encerrar Contrato
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredContracts.length)} de {filteredContracts.length} contratos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Encerramento */}
      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Encerrar Contrato
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O contrato será marcado como inativo permanentemente.
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Número:</span>
                  <span className="text-sm">{selectedContract.contract_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Contratante:</span>
                  <span className="text-sm">{selectedContract.contractors?.[0]?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">CNPJ:</span>
                  <span className="text-sm">{selectedContract.contractors?.[0]?.cnpj || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status Atual:</span>
                  <span className="text-sm">{selectedContract.status}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="termination_date">Data de Encerramento *</Label>
                <Input
                  id="termination_date"
                  type="date"
                  value={terminationDate}
                  onChange={(e) => setTerminationDate(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTerminateDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleTerminateContract} disabled={isProcessing || !terminationDate}>
              {isProcessing ? 'Encerrando...' : 'Confirmar Encerramento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Ativação */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Ativar Contrato
            </DialogTitle>
            <DialogDescription>
              O contrato será reativado e voltará ao status ativo.
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Número:</span>
                  <span className="text-sm">{selectedContract.contract_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Contratante:</span>
                  <span className="text-sm">{selectedContract.contractors?.[0]?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">CNPJ:</span>
                  <span className="text-sm">{selectedContract.contractors?.[0]?.cnpj || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status Atual:</span>
                  <span className="text-sm">{selectedContract.status}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activation_date">Data de Ativação *</Label>
                <Input
                  id="activation_date"
                  type="date"
                  value={activationDate}
                  onChange={(e) => setActivationDate(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleActivateContract} disabled={isProcessing || !activationDate}>
              {isProcessing ? 'Ativando...' : 'Confirmar Ativação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}