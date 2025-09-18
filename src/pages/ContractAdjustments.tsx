import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Edit, TrendingUp, Calendar, Building2, AlertCircle, Search, Filter } from 'lucide-react';
import { useContracts } from '@/hooks/useContracts';
import { useContractAdjustments } from '@/hooks/useContractAdjustments';
import ContractAdjustmentModal from '@/components/ContractAdjustmentModal';
import ContractsPagination from '@/components/ContractsPagination';
import { format, parseISO, differenceInDays, isAfter, isBefore, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';

export default function ContractAdjustments() {
  const { contracts, loading } = useContracts();
  const { adjustments } = useContractAdjustments();
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [activeView, setActiveView] = useState('contract-adjustments');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [renewalFilter, setRenewalFilter] = useState('all');
  const [forceAdjustment, setForceAdjustment] = useState(false);

  // Helper function to check if contract is eligible for adjustment (after first year)
  const canAdjustContract = (contract: any) => {
    if (!contract.start_date) return false;
    
    try {
      let startDate: Date;
      if (contract.start_date.includes('/')) {
        const [day, month, year] = contract.start_date.split('/');
        startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        startDate = new Date(contract.start_date);
      }
      
      const today = new Date();
      const oneYearLater = new Date(startDate);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      
      return today >= oneYearLater;
    } catch {
      return false;
    }
  };

  // Helper function to get days until next adjustment
  const getDaysUntilRenewal = (contractId: string, renewalDate: string) => {
    if (!renewalDate) return null;
    try {
      let date: Date;
      if (renewalDate.includes('/')) {
        const [day, month, year] = renewalDate.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = parseISO(renewalDate);
      }
      
      const today = new Date();
      
      // Buscar todos os ajustes deste contrato
      const contractAdjustments = adjustments?.filter(adj => 
        adj.contract_id === contractId
      ) || [];
      
      let nextRenewal: Date;
      
      if (contractAdjustments.length === 0) {
        // Se não há ajustes, usar o ano atual ou próximo
        const currentYear = today.getFullYear();
        nextRenewal = new Date(currentYear, date.getMonth(), date.getDate());
        if (nextRenewal < today) {
          nextRenewal.setFullYear(currentYear + 1);
        }
      } else {
        // Encontrar o ano do último ajuste
        const lastAdjustmentYear = Math.max(...contractAdjustments.map(adj => {
          const adjDate = new Date(adj.effective_date);
          return adjDate.getFullYear();
        }));
        
        // Próximo ajuste é sempre no ano seguinte ao último ajuste
        const nextYear = lastAdjustmentYear + 1;
        nextRenewal = new Date(nextYear, date.getMonth(), date.getDate());
      }
      
      const diffTime = nextRenewal.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  // Get next adjustment date based on all existing adjustments
  const getNextAdjustmentDate = (contractId: string, renewalDate: string) => {
    if (!renewalDate) return '-';
    
    try {
      let date: Date;
      if (renewalDate.includes('/')) {
        const [day, month, year] = renewalDate.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = parseISO(renewalDate);
      }
      
      const currentYear = new Date().getFullYear();
      
      // Buscar todos os ajustes deste contrato
      const contractAdjustments = adjustments?.filter(adj => 
        adj.contract_id === contractId
      ) || [];
      
      // Se não há ajustes, mostrar o ano atual ou próximo
      if (contractAdjustments.length === 0) {
        const nextAdjustment = new Date(currentYear, date.getMonth(), date.getDate());
        if (nextAdjustment < new Date()) {
          nextAdjustment.setFullYear(currentYear + 1);
        }
        return format(nextAdjustment, 'dd/MM/yyyy', { locale: ptBR });
      }
      
      // Encontrar o ano do último ajuste
      const lastAdjustmentYear = Math.max(...contractAdjustments.map(adj => {
        const adjDate = new Date(adj.effective_date);
        return adjDate.getFullYear();
      }));
      
      // Próximo ajuste é sempre no ano seguinte ao último ajuste
      const nextYear = lastAdjustmentYear + 1;
      const nextAdjustment = new Date(nextYear, date.getMonth(), date.getDate());
      
      return format(nextAdjustment, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return renewalDate;
    }
  };

  // Check if contract has been adjusted this year
  const hasAdjustmentThisYear = (contractId: string) => {
    const currentYear = new Date().getFullYear();
    return adjustments?.some(adj => {
      const adjDate = new Date(adj.created_at);
      return adj.contract_id === contractId && 
             adjDate.getFullYear() === currentYear;
    }) || false;
  };

  // Filtrar contratos ativos e aplicar filtros
  const activeContracts = useMemo(() => {
    let filtered = contracts.filter(contract => contract.status === 'Ativo');
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(contract => {
        const contractorName = contract.contractors?.[0]?.name || '';
        const contractorCnpj = contract.contractors?.[0]?.cnpj || '';
        return contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
               contractorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               contractorCnpj.includes(searchTerm);
      });
    }
    
    // Apply renewal filter
    if (renewalFilter !== 'all') {
      const today = new Date();
      
      filtered = filtered.filter(contract => {
        const daysUntilRenewal = getDaysUntilRenewal(contract.id, contract.renewal_date);
        
        switch(renewalFilter) {
          case '10':
            return daysUntilRenewal !== null && daysUntilRenewal <= 10 && daysUntilRenewal >= 0;
          case '15':
            return daysUntilRenewal !== null && daysUntilRenewal <= 15 && daysUntilRenewal >= 0;
          case '20':
            return daysUntilRenewal !== null && daysUntilRenewal <= 20 && daysUntilRenewal >= 0;
          case '30':
            return daysUntilRenewal !== null && daysUntilRenewal <= 30 && daysUntilRenewal >= 0;
          case 'expired':
            return daysUntilRenewal !== null && daysUntilRenewal < 0;
          case 'no-adjustment':
            return !hasAdjustmentThisYear(contract.id);
          case 'adjusted-this-year':
            return hasAdjustmentThisYear(contract.id);
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [contracts, searchTerm, renewalFilter, adjustments]);

  // Paginação
  const totalPages = Math.ceil(activeContracts.length / itemsPerPage);
  const paginatedContracts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return activeContracts.slice(startIndex, startIndex + itemsPerPage);
  }, [activeContracts, currentPage, itemsPerPage]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return format(date, 'dd/MM/yyyy', { locale: ptBR });
      }
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value || '0');
    return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getUrgencyBadge = (daysUntilRenewal: number | null) => {
    if (daysUntilRenewal === null) return null;
    
    if (daysUntilRenewal <= 30) {
      return <Badge variant="destructive">Urgente - {daysUntilRenewal} dias</Badge>;
    } else if (daysUntilRenewal <= 60) {
      return <Badge variant="secondary">Próximo - {daysUntilRenewal} dias</Badge>;
    } else {
      return <Badge variant="outline">{daysUntilRenewal} dias</Badge>;
    }
  };

  const handleEditAdjustment = (contract: any) => {
    setSelectedContract(contract);
    setAdjustmentModalOpen(true);
  };

  return (
    <SidebarProvider>
      <AppSidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        onNewContract={() => {}}
      />
      <SidebarInset>
        <PageHeader title="Reajustes de Contratos" />
        
        <div className="p-6 space-y-6">
          {/* Filter Section */}
          <Card className="bg-background border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Filter className="h-5 w-5" />
                Filtros e Busca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por contrato, empresa ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={renewalFilter} onValueChange={setRenewalFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por vencimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os contratos</SelectItem>
                    <SelectItem value="10">Vencimento em 10 dias</SelectItem>
                    <SelectItem value="15">Vencimento em 15 dias</SelectItem>
                    <SelectItem value="20">Vencimento em 20 dias</SelectItem>
                    <SelectItem value="30">Vencimento em 30 dias</SelectItem>
                    <SelectItem value="expired">Vencidos</SelectItem>
                    <SelectItem value="no-adjustment">Sem reajuste este ano</SelectItem>
                    <SelectItem value="adjusted-this-year">Reajustados este ano</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setRenewalFilter('all');
                  }}
                  className="flex items-center gap-2"
                >
                  Limpar Filtros
                </Button>
              </div>

              {/* Toggle para forçar reajuste */}
              <div className="mt-4 flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm">Liberar Reajuste no Primeiro Ano</p>
                    <p className="text-xs text-muted-foreground">Permite realizar reajustes em contratos com menos de 1 ano</p>
                  </div>
                </div>
                <Button
                  variant={forceAdjustment ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setForceAdjustment(!forceAdjustment)}
                >
                  {forceAdjustment ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-background border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-primary text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Total de Contratos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{activeContracts.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Contratos ativos</p>
              </CardContent>
            </Card>

            <Card className="bg-background border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-yellow-600 text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Disponível para Reajuste
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{activeContracts.length}</div>
                <p className="text-xs text-yellow-500 mt-1">Podem ser reajustados</p>
              </CardContent>
            </Card>

            <Card className="bg-background border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-600 text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Próximos Vencimentos
                </CardTitle>
              </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeContracts.filter(c => {
                const days = getDaysUntilRenewal(c.id, c.renewal_date);
                return days !== null && days <= 30;
                  }).length}
                </div>
                <p className="text-xs text-green-500 mt-1">Nos próximos 30 dias</p>
              </CardContent>
            </Card>
          </div>
          {/* Lista de contratos */}
          <Card className="bg-background border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                Contratos para Reajuste
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activeContracts.length === 0 ? (
                <div className="text-center p-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum contrato ativo encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contrato</TableHead>
                        <TableHead>Contratante</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Início do Contrato</TableHead>
                        <TableHead>Valor Mensal</TableHead>
                        <TableHead>Tipo de Plano</TableHead>
                        <TableHead>Próximo Reajuste</TableHead>
                        <TableHead>Status Renovação</TableHead>
                        <TableHead className="w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedContracts.map((contract) => {
                        const daysUntilRenewal = getDaysUntilRenewal(contract.id, contract.renewal_date);
                        const contractors = contract.contractors || [];
                        const contractorName = contractors.length > 0 ? contractors[0].name : 'Não informado';
                        const contractorCnpj = contractors.length > 0 ? contractors[0].cnpj : 'Não informado';
                        
                        return (
                          <TableRow key={contract.id}>
                            <TableCell className="font-medium">
                              {contract.contract_number}
                            </TableCell>
                            <TableCell>
                              {contractorName}
                            </TableCell>
                            <TableCell>
                              {contractorCnpj}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDate(contract.start_date)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-green-600">
                                {formatCurrency(contract.monthly_value)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-background">
                                {contract.plan_type === 'mensal' ? 'Mensal' : 
                                 contract.plan_type === 'semestral' ? 'Semestral' : 
                                 contract.plan_type === 'anual' ? 'Anual' : contract.plan_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <span className="font-medium">{getNextAdjustmentDate(contract.id, contract.renewal_date)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getUrgencyBadge(daysUntilRenewal)}
                            </TableCell>
                            <TableCell>
                              {canAdjustContract(contract) || forceAdjustment ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditAdjustment(contract)}
                                  className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/20"
                                  title={forceAdjustment && !canAdjustContract(contract) ? "Reajuste Forçado" : "Reajustar"}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Badge variant="secondary" className="text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    1º Ano
                                  </Badge>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {activeContracts.length > 0 && (
                    <ContractsPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      itemsPerPage={itemsPerPage}
                      totalItems={activeContracts.length}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={(value) => {
                        setItemsPerPage(value);
                        setCurrentPage(1);
                      }}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal de Reajuste */}
          {selectedContract && (
            <ContractAdjustmentModal
              contract={selectedContract}
              open={adjustmentModalOpen}
              onOpenChange={setAdjustmentModalOpen}
            />
          )}
        </div>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}