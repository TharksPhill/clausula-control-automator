import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, TrendingUp, Calendar, Building } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";
import ManualValueEditModal from "@/components/ManualValueEditModal";
import { toast } from "sonner";

const PlanChangesManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { contracts, refetchContracts } = useContracts();
  const { getEffectiveValueForContract } = useContractAdjustments();

  // Filtrar apenas contratos ativos
  const activeContracts = contracts?.filter(contract => 
    contract.status === 'Ativo' || contract.status === 'ativo'
  ) || [];

  // Paginação
  const totalItems = activeContracts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContracts = activeContracts.slice(startIndex, endIndex);

  const handleEditPlan = (contract: any) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedContract(null);
    // Recarregar os contratos após fechamento do modal
    refetchContracts();
  };

  const getContractValue = (contract: any) => {
    const baseValue = parseFloat(contract.monthly_value?.replace(',', '.')) || 0;
    const effectiveValue = getEffectiveValueForContract(contract.id, baseValue);
    return effectiveValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getContractorName = (contract: any) => {
    return contract.contractors?.[0]?.name || 'Não informado';
  };

  const getContractorCnpj = (contract: any) => {
    return contract.contractors?.[0]?.cnpj || 'Não informado';
  };

  const getPlanType = (contract: any) => {
    const type = contract.plan_type || 'mensal';
    const typeMap: { [key: string]: string } = {
      'mensal': 'Mensal',
      'semestral': 'Semestral', 
      'anual': 'Anual'
    };
    return typeMap[type] || 'Mensal';
  };

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-background border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Total de Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeContracts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Contratos ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-background border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-600 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Disponível para Mudança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeContracts.length}</div>
            <p className="text-xs text-blue-500 mt-1">Podem ser modificados</p>
          </CardContent>
        </Card>

        <Card className="bg-background border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-600 text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Planos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeContracts.length}</div>
            <p className="text-xs text-green-500 mt-1">Em vigor</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de contratos */}
      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            Mudanças de Planos
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Gerencie e modifique os planos dos seus contratos ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeContracts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-primary mb-2">Nenhum contrato ativo</h3>
              <p className="text-muted-foreground">Não há contratos ativos disponíveis para mudança de plano.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número do Contrato</TableHead>
                    <TableHead>Nome do Contratante</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Valor Atual</TableHead>
                    <TableHead>Tipo de Plano</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentContracts.map(contract => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.contract_number}
                      </TableCell>
                      <TableCell>
                        {getContractorName(contract)}
                      </TableCell>
                      <TableCell>
                        {getContractorCnpj(contract)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {getContractValue(contract)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-background">
                          {getPlanType(contract)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditPlan(contract)}
                          className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/20"
                          title="Editar plano"
                        >
                          <Edit className="h-4 w-4" />
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
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}>
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

      {/* Modal de mudança de plano */}
      {selectedContract && (
        <ManualValueEditModal
          contract={selectedContract}
          open={isModalOpen}
          onOpenChange={handleModalClose}
          currentValue={(() => {
            const baseValue = parseFloat(selectedContract.monthly_value?.replace(',', '.')) || 0;
            return getEffectiveValueForContract(selectedContract.id, baseValue);
          })()}
          analysisDate={new Date()}
        />
      )}
    </div>
  );
};

export default PlanChangesManagement;