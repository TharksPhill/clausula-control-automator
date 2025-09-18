import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Calendar, Building, User, TrendingUp, ArrowUp, ArrowDown, CheckCircle, AlertTriangle } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";
import { useCostPlans } from "@/hooks/useCostPlans";

interface ContractAnalysisFiltersProps {
  contracts: any[];
  analysisDate: Date;
  onFiltersChange: (filteredContracts: any[]) => void;
}

const ContractAnalysisFilters = ({ contracts, analysisDate, onFiltersChange }: ContractAnalysisFiltersProps) => {
  const { contracts: contractsData } = useContracts();
  const { adjustments } = useContractAdjustments();
  const { contractAddons } = useCostPlans();
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [showContractSelection, setShowContractSelection] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [selectedValueVariation, setSelectedValueVariation] = useState<string>('all');
  const [selectedAttentionFilter, setSelectedAttentionFilter] = useState<string>('all');

  // Função para obter o nome do contratante
  const getContractorName = (contractId: string): string => {
    const contractData = contractsData?.find(c => c.id === contractId);
    if (contractData?.contractors && contractData.contractors.length > 0) {
      return contractData.contractors[0].name || 'Contratante não informado';
    }
    return 'Contratante não informado';
  };

  // Função para obter o tipo de plano
  const getPlanType = (contractId: string): string => {
    const contractData = contractsData?.find(c => c.id === contractId);
    return contractData?.plan_type || 'mensal';
  };

  // Função para obter a cor do badge baseado no tipo de plano
  const getPlanBadgeVariant = (planType: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (planType.toLowerCase()) {
      case 'anual':
        return 'destructive';
      case 'semestral':
        return 'secondary';
      case 'mensal':
      default:
        return 'default';
    }
  };

  // Função para obter o tipo de variação de valor
  const getValueVariationType = (contractId: string): string => {
    const analysisYear = analysisDate.getFullYear();
    const analysisMonth = analysisDate.getMonth();

    // Verificar ajustes percentuais (reajuste)
    const contractAdjustments = adjustments.filter(adj => adj.contract_id === contractId);
    
    for (const adjustment of contractAdjustments) {
      const effectiveDate = new Date(adjustment.effective_date);
      const effectiveYear = effectiveDate.getFullYear();
      const effectiveMonth = effectiveDate.getMonth();
      
      if (effectiveYear === analysisYear && effectiveMonth === analysisMonth) {
        return 'reajuste';
      }
    }

    // Verificar mudanças de plano manuais
    const contractAddonsList = contractAddons?.filter(addon => 
      addon.contract_id === contractId && 
      addon.addon_type === 'plan_change'
    ) || [];

    for (const addon of contractAddonsList) {
      const addonDate = new Date(addon.request_date);
      const addonYear = addonDate.getFullYear();
      const addonMonth = addonDate.getMonth();
      
      if (addonYear === analysisYear && addonMonth === analysisMonth) {
        const previousValue = parseFloat(addon.previous_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
        const newValue = parseFloat(addon.new_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
        
        if (newValue > previousValue) {
          return 'upgrade';
        } else if (newValue < previousValue) {
          return 'downgrade';
        }
      }
    }

    return 'sem_alteracao';
  };

  // Função para verificar se contrato está próximo do vencimento
  const isContractNearExpiry = (contractId: string): boolean => {
    const contract = contractsData?.find(c => c.id === contractId);
    if (!contract?.renewal_date) {
      return false;
    }
    
    const currentDate = new Date();
    let renewalDate: Date;
    
    // Parse da data de renovação
    try {
      if (contract.renewal_date.includes('/')) {
        const [day, month, year] = contract.renewal_date.split('/');
        renewalDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (contract.renewal_date.includes('-')) {
        renewalDate = new Date(contract.renewal_date);
      } else {
        return false;
      }
    } catch {
      return false;
    }
    
    // Calcular diferença em dias
    const timeDiff = renewalDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Considera "próximo do vencimento" se faltam 30 dias ou menos
    return daysDiff > 0 && daysDiff <= 30;
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = contracts;

    // Filtro por contratos selecionados
    if (showContractSelection && selectedContractIds.length > 0) {
      filtered = filtered.filter(contract => 
        selectedContractIds.includes(contract.contractId)
      );
    }

    // Filtro por tipo de plano
    if (selectedPlanType !== 'all') {
      filtered = filtered.filter(contract => {
        const planType = getPlanType(contract.contractId);
        return planType === selectedPlanType;
      });
    }

    // Filtro por variação de valor
    if (selectedValueVariation !== 'all') {
      filtered = filtered.filter(contract => {
        const variationType = getValueVariationType(contract.contractId);
        return variationType === selectedValueVariation;
      });
    }

    // Filtro por atenção (contratos próximos do vencimento)
    if (selectedAttentionFilter !== 'all') {
      filtered = filtered.filter(contract => {
        const nearExpiry = isContractNearExpiry(contract.contractId);
        return selectedAttentionFilter === 'attention' ? nearExpiry : !nearExpiry;
      });
    }

    onFiltersChange(filtered);
  }, [selectedContractIds, selectedPlanType, contracts, onFiltersChange, showContractSelection, selectedValueVariation, selectedAttentionFilter]);

  // Função para alternar seleção de contrato
  const toggleContractSelection = (contractId: string) => {
    setSelectedContractIds(prev => 
      prev.includes(contractId) 
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  };

  // Função para limpar seleção
  const clearSelection = () => {
    setSelectedContractIds([]);
  };

  // Função para selecionar todos
  const selectAll = () => {
    setSelectedContractIds(contracts.map(c => c.contractId));
  };

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setSelectedContractIds([]);
    setShowContractSelection(false);
    setSelectedPlanType('all');
    setSelectedValueVariation('all');
    setSelectedAttentionFilter('all');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Análise de Contratos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filtros principais com ícones bem visíveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Filtro por tipo de plano */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500/10 rounded-full">
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
                Tipo de Plano
              </Label>
              <Select value={selectedPlanType} onValueChange={setSelectedPlanType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border shadow-lg z-50">
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="mensal">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Mensal
                    </div>
                  </SelectItem>
                  <SelectItem value="semestral">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      Semestral
                    </div>
                  </SelectItem>
                  <SelectItem value="anual">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      Anual
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por variação de valor */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <div className="flex items-center justify-center w-8 h-8 bg-yellow-500/10 rounded-full">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                </div>
                Variação de Valor
              </Label>
              <Select value={selectedValueVariation} onValueChange={setSelectedValueVariation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as variações" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border shadow-lg z-50">
                  <SelectItem value="all">Todas as variações</SelectItem>
                  <SelectItem value="reajuste">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Reajuste
                    </div>
                  </SelectItem>
                  <SelectItem value="upgrade">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-4 w-4 text-orange-600" />
                      Upgrade
                    </div>
                  </SelectItem>
                  <SelectItem value="downgrade">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4 text-red-600" />
                      Downgrade
                    </div>
                  </SelectItem>
                  <SelectItem value="sem_alteracao">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Sem alteração
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por atenção */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <div className="flex items-center justify-center w-8 h-8 bg-red-500/10 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                Atenção
              </Label>
              <Select value={selectedAttentionFilter} onValueChange={setSelectedAttentionFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os contratos" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border shadow-lg z-50">
                  <SelectItem value="all">Todos os contratos</SelectItem>
                  <SelectItem value="attention">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Próximos do vencimento
                    </div>
                  </SelectItem>
                  <SelectItem value="no_attention">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Sem atenção
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botão limpar filtros */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-500/10 rounded-full">
                  <Building className="h-4 w-4 text-purple-500" />
                </div>
                Contratos
              </Label>
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>

          {/* Toggle para mostrar/esconder seleção de contratos */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Checkbox
              id="show-contract-selection"
              checked={showContractSelection}
              onCheckedChange={(checked) => setShowContractSelection(checked === true)}
            />
            <Label htmlFor="show-contract-selection" className="flex items-center gap-2 cursor-pointer">
              <div className="flex items-center justify-center w-6 h-6 bg-orange-500/10 rounded-full">
                <User className="h-3 w-3 text-orange-500" />
              </div>
              Filtrar por contratos específicos
            </Label>
          </div>

          {/* Seleção de contratos */}
          {showContractSelection && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={selectedContractIds.length === contracts.length}
                >
                  Selecionar todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={selectedContractIds.length === 0}
                >
                  Limpar seleção
                </Button>
                <div className="text-sm text-muted-foreground">
                  {selectedContractIds.length} de {contracts.length} contratos selecionados
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
                {contracts.map((contract) => {
                  const contractorName = getContractorName(contract.contractId);
                  const planType = getPlanType(contract.contractId);
                  
                  return (
                    <div
                      key={contract.contractId}
                      className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleContractSelection(contract.contractId)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedContractIds.includes(contract.contractId)}
                          onChange={() => {}}
                        />
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-foreground">
                              {contractorName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Contrato: {contract.contractNumber}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge variant={getPlanBadgeVariant(planType)} className="text-xs">
                        {planType}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resumo dos filtros aplicados */}
          {(selectedContractIds.length > 0 || selectedPlanType !== 'all' || selectedValueVariation !== 'all' || selectedAttentionFilter !== 'all') && (
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-500 mb-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filtros aplicados:</span>
              </div>
              <div className="text-sm text-blue-400 space-y-1">
                {selectedContractIds.length > 0 && (
                  <div>• {selectedContractIds.length} contrato(s) selecionado(s)</div>
                )}
                {selectedPlanType !== 'all' && (
                  <div>• Tipo de plano: {selectedPlanType}</div>
                )}
                {selectedValueVariation !== 'all' && (
                  <div>• Variação de valor: {selectedValueVariation}</div>
                )}
                {selectedAttentionFilter !== 'all' && (
                  <div>• Atenção: {selectedAttentionFilter === 'attention' ? 'Próximos do vencimento' : 'Sem atenção'}</div>
                )}
              </div>
            </div>
          )}

          {/* Aviso quando nenhum filtro está aplicado */}
          {selectedContractIds.length === 0 && selectedPlanType === 'all' && selectedValueVariation === 'all' && selectedAttentionFilter === 'all' && (
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Building className="h-4 w-4" />
                <span className="font-medium">Nenhum filtro aplicado</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Exibindo análise para todos os {contracts.length} contratos
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractAnalysisFilters;
