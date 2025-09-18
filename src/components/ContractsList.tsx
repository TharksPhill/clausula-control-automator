import React, { useState, useMemo } from "react";
import { useContracts } from "@/hooks/useContracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Search, Filter, Power, PowerOff, Trash2, Calendar, CalendarDays, CalendarRange, ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ContractDetailsModal from "./ContractDetailsModal";
import ShareContractModal from "./ShareContractModal";
import ContractsPagination from "./ContractsPagination";
import ContractActions from "./ContractActions";
import ContractsActions from "./contracts/ContractsActions";
import BulkDeleteDialog from "./contracts/BulkDeleteDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
interface ContractsListProps {
  onEditContract?: (contract: any) => void;
}
const ContractsList = ({
  onEditContract
}: ContractsListProps) => {
  const navigate = useNavigate();
  const {
    contracts,
    loading,
    deleteContract,
    inactivateContract,
    activateContract,
    refetchContracts
  } = useContracts();
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [shareContract, setShareContract] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planTypeFilter, setPlanTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [syncingCNPJ, setSyncingCNPJ] = useState(false);

  // Função para sincronizar dados de CNPJ
  const handleSyncCNPJ = async () => {
    setSyncingCNPJ(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        });
        return;
      }

      const response = await supabase.functions.invoke('sync-contractors-cnpj', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data;
      
      if (result.success) {
        let description = `${result.summary.success} CNPJs atualizados, ${result.summary.skipped} já estavam completos, ${result.summary.errors} erros`;
        
        // Adicionar informação sobre ajustes processados se houver
        if (result.summary.adjustmentsProcessed > 0) {
          description += `. ${result.summary.adjustmentsProcessed} ajustes de valores foram processados.`;
        }
        
        toast({
          title: "Sincronização concluída",
          description,
        });
        
        // Recarregar contratos para mostrar dados atualizados
        await refetchContracts();
      } else {
        throw new Error(result.message || 'Erro na sincronização');
      }
    } catch (error) {
      console.error('Erro ao sincronizar CNPJs:', error);
      toast({
        title: "Erro ao sincronizar",
        description: error.message || "Não foi possível sincronizar os dados dos CNPJs",
        variant: "destructive"
      });
    } finally {
      setSyncingCNPJ(false);
    }
  };

  // Filtrar contratos
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const contractorsCNPJs = (contract.contractors || []).map((contractor: any) => contractor.cnpj).join(' ');
      const contractorsNames = (contract.contractors || []).map((contractor: any) => contractor.name).join(' ');
      const matchesSearch = searchTerm === "" || contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) || contractorsCNPJs.includes(searchTerm) || contractorsNames.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || statusFilter === "active" && (contract.status === "Ativo" || !contract.status) || statusFilter === "inactive" && contract.status === "Inativo";
      const matchesPlanType = planTypeFilter === "all" || planTypeFilter === "mensal" && contract.plan_type === "mensal" || planTypeFilter === "semestral" && contract.plan_type === "semestral" || planTypeFilter === "anual" && contract.plan_type === "anual";
      return matchesSearch && matchesStatus && matchesPlanType;
    });
  }, [contracts, searchTerm, statusFilter, planTypeFilter]);

  // Calcular estatísticas detalhadas
  const stats = useMemo(() => {
    const activeContracts = contracts.filter(c => c.status !== "Inativo");
    const inactiveContracts = contracts.filter(c => c.status === "Inativo");

    // Contar por tipo de plano (apenas ativos)
    const monthlyContracts = activeContracts.filter(c => c.plan_type === "mensal" || !c.plan_type);
    const semestralContracts = activeContracts.filter(c => c.plan_type === "semestral");
    const anualContracts = activeContracts.filter(c => c.plan_type === "anual");
    return {
      total: contracts.length,
      active: activeContracts.length,
      inactive: inactiveContracts.length,
      monthly: monthlyContracts.length,
      semestral: semestralContracts.length,
      anual: anualContracts.length
    };
  }, [contracts]);

  // Paginação
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, startIndex + itemsPerPage);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
  const handleContractUpdate = async () => {
    console.log("HandleContractUpdate chamado - recarregando contratos...");
    setSelectedContract(null);
    setTimeout(async () => {
      await refetchContracts();
      console.log("Contratos recarregados com sucesso");
    }, 100);
  };
  const handleImportSuccess = () => {
    refetchContracts();
  };

  // Funções para seleção em massa
  const handleSelectContract = (contractId: string, checked: boolean) => {
    const newSelectedContracts = new Set(selectedContracts);
    if (checked) {
      newSelectedContracts.add(contractId);
    } else {
      newSelectedContracts.delete(contractId);
    }
    setSelectedContracts(newSelectedContracts);
  };
  const handleSelectAll = () => {
    if (selectedContracts.size === paginatedContracts.length) {
      setSelectedContracts(new Set());
    } else {
      const allIds = new Set(paginatedContracts.map(contract => contract.id));
      setSelectedContracts(allIds);
    }
  };
  const handleBulkDelete = async (contractIds: string[]) => {
    try {
      await Promise.all(contractIds.map(id => deleteContract(id)));
      setSelectedContracts(new Set());
      setShowBulkDeleteDialog(false);
      await refetchContracts();
    } catch (error) {
      console.error("Erro ao excluir contratos em massa:", error);
    }
  };
  const handleCancelNavigation = () => {
    navigate('/dashboard');
  };
  const isAllSelected = paginatedContracts.length > 0 && selectedContracts.size === paginatedContracts.length;
  if (loading) {
    return <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando contratos...</p>
        </div>
      </div>;
  }
  return <>
      {/* Header com ações CSV e exclusão em massa */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          {selectedContracts.size > 0 && <>
              <Button variant="outline" onClick={handleSelectAll} className="text-sm">
                {isAllSelected ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
              <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)} className="text-sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Selecionados ({selectedContracts.size})
              </Button>
            </>}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleSyncCNPJ}
            disabled={syncingCNPJ}
            className="text-sm"
            title="Sincronizar dados de CNPJ de todos os contratantes"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncingCNPJ ? 'animate-spin' : ''}`} />
            {syncingCNPJ ? 'Sincronizando...' : 'Atualizar CNPJs'}
          </Button>
          <ContractsActions contracts={filteredContracts} onImportSuccess={handleImportSuccess} />
        </div>
      </div>

      {/* Cards de Estatísticas Detalhadas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <Power className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Em funcionamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Mensais</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.monthly}</div>
            <p className="text-xs text-muted-foreground">
              Contratos mensais ativos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Semestrais</CardTitle>
            <CalendarDays className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.semestral}</div>
            <p className="text-xs text-muted-foreground">
              Contratos semestrais ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Anuais</CardTitle>
            <CalendarRange className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.anual}</div>
            <p className="text-xs text-muted-foreground">
              Contratos anuais ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar por número, CNPJ ou razão social..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Apenas Ativos</SelectItem>
                <SelectItem value="inactive">Apenas Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planTypeFilter} onValueChange={setPlanTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo de plano" />
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

      {/* Lista de Contratos em Tabela */}
      {filteredContracts.length === 0 ? <Card className="text-center p-8">
          <CardContent>
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {contracts.length === 0 ? "Nenhum contrato encontrado" : "Nenhum contrato corresponde aos filtros"}
            </h3>
            <p className="text-gray-600">
              {contracts.length === 0 ? "Crie seu primeiro contrato para começar." : "Tente ajustar os filtros de busca."}
            </p>
          </CardContent>
        </Card> : <>
          <Card className="mb-6">
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="Selecionar todos" />
                    </TableHead>
                    <TableHead>Número do Contrato</TableHead>
                    <TableHead>Nome do Contratante</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Tipo de Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Histórico</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedContracts.map(contract => <TableRow key={contract.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox checked={selectedContracts.has(contract.id)} onCheckedChange={checked => handleSelectContract(contract.id, checked as boolean)} aria-label={`Selecionar contrato ${contract.contract_number}`} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {contract.contract_number}
                      </TableCell>
                      <TableCell>
                        {contract.contractors && contract.contractors.length > 0 ? <div>
                            <div className="font-medium">{contract.contractors[0].name}</div>
                            {contract.contractors.length > 1 && <div className="text-sm text-gray-500">
                                +{contract.contractors.length - 1} empresa(s)
                              </div>}
                          </div> : <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        {contract.contractors && contract.contractors.length > 0 ? <div>
                            <div>{contract.contractors[0].cnpj}</div>
                            {contract.contractors.length > 1 && <div className="text-sm text-gray-500">
                                Ver todos nos detalhes
                              </div>}
                          </div> : <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {contract.plan_type || "mensal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={contract.status === "Inativo" ? "destructive" : "default"} className="text-xs">
                          {contract.status || "Ativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contract.termination_date ? (
                          <div className="space-y-1">
                            <div className="text-xs">
                              <span className="text-destructive font-medium">Encerrado: </span>
                              {new Date(contract.termination_date).toLocaleDateString('pt-BR')}
                            </div>
                            {contract.reactivation_date && (
                              <div className="text-xs">
                                <span className="text-emerald-600 font-medium">Reativado: </span>
                                {new Date(contract.reactivation_date).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem histórico</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ContractActions contract={contract} onView={setSelectedContract} onEdit={onEditContract} onShare={setShareContract} onDelete={deleteContract} onActivate={activateContract} onDeactivate={inactivateContract} compact={true} />
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Botão Cancelar - Posicionado no lado esquerdo */}
          

          {/* Paginação */}
          <ContractsPagination currentPage={currentPage} totalPages={totalPages} itemsPerPage={itemsPerPage} totalItems={filteredContracts.length} onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} />
        </>}

      {selectedContract && <ContractDetailsModal isOpen={!!selectedContract} contract={selectedContract} onClose={() => setSelectedContract(null)} onContractUpdate={handleContractUpdate} />}

      {shareContract && <ShareContractModal isOpen={!!shareContract} contract={shareContract} onClose={() => setShareContract(null)} />}

      <BulkDeleteDialog isOpen={showBulkDeleteDialog} onClose={() => setShowBulkDeleteDialog(false)} selectedContracts={Array.from(selectedContracts)} contracts={filteredContracts} onConfirm={handleBulkDelete} />
    </>;
};
export default ContractsList;