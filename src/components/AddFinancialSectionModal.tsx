import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateFinancialSection } from "@/hooks/useFinancialSections";
import { useCreateFinancialCategory } from "@/hooks/useFinancialCategories";
import { useProfitAnalysis } from "@/hooks/useProfitAnalysis";
import { useCreateOrUpdateMultipleMonthlyFinancialCosts } from "@/hooks/useMonthlyFinancialCosts";
import { useContracts } from "@/hooks/useContracts";
import { useContractMonthlyLicenseCosts } from "@/hooks/useContractLicenseCosts";
import { usePlans } from "@/hooks/usePlans";
import { usePlanAddons } from "@/hooks/usePlanAddons";
import { COLOR_SCHEMES, type ColorScheme } from "@/types/financial-sections";
import { TrendingUp, Database } from "lucide-react";

interface AddFinancialSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFinancialSectionModal: React.FC<AddFinancialSectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("purple");
  const [operationType, setOperationType] = useState<"operational" | "non_operational">("operational");
  const [isRevenue, setIsRevenue] = useState(false);
  const [creationMode, setCreationMode] = useState<"manual" | "import">("manual");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  
  const createSection = useCreateFinancialSection();
  const createCategory = useCreateFinancialCategory();
  const createMonthlyCosts = useCreateOrUpdateMultipleMonthlyFinancialCosts();
  const { contractProfitDetails } = useProfitAnalysis();
  const { contracts } = useContracts();
  const currentYear = new Date().getFullYear();
  const { data: contractLicenseCosts } = useContractMonthlyLicenseCosts(currentYear);
  const { plans = [] } = usePlans();
  const { planAddons = [] } = usePlanAddons();

  // Função auxiliar para calcular custo da licença para TODOS os contratos
  function calculateContractLicenseCost(contract: any): { licenseCost: number; exemptionMonths: number } {
    const employeeCount = parseInt(contract.employee_count || '0');
    const cnpjCount = parseInt(contract.cnpj_count || '0');
    const contractValue = parseFloat(contract.monthly_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
    
    // Buscar plano correspondente
    const matchingPlan = plans.find(plan => {
      if (!plan.is_active || !plan.employee_range) return false;
      
      const [minEmp, maxEmp] = plan.employee_range.split('-').map(n => parseInt(n.trim(), 10));
      const inRange = employeeCount >= minEmp && employeeCount <= maxEmp;
      
      return inRange;
    });
    
    if (!matchingPlan) {
      return { licenseCost: 0, exemptionMonths: 0 };
    }
    
    // Calcular custo base (usar campo license_cost do plano)
    let baseLicenseCost = matchingPlan.license_cost || 0;
    
    // Se não tiver license_cost, usar 20% do valor do contrato como fallback
    if (baseLicenseCost === 0) {
      baseLicenseCost = contractValue * 0.2;
    }
    
    // Buscar addons de funcionários
    const employeeAddon = planAddons.find(addon => 
      addon.unit_type === 'employee' && addon.is_active
    );
    
    if (employeeAddon && employeeAddon.pricing_type === 'package') {
      // Lógica de pacotes
      const ranges = employeeAddon.package_ranges || [];
      const matchingRange = ranges.find((range: any) => {
        return employeeCount >= range.min && employeeCount <= range.max;
      });
      
      if (matchingRange) {
        baseLicenseCost += matchingRange.price;
      }
    } else if (employeeAddon && employeeAddon.pricing_type === 'per_unit') {
      // Lógica por unidade - adicionar custo por funcionário adicional
      const baseEmployees = parseInt(matchingPlan.employee_range?.split('-')[0] || '0');
      const additionalEmployees = Math.max(0, employeeCount - baseEmployees);
      const addonCost = additionalEmployees * (employeeAddon.license_cost || 0);
      baseLicenseCost += addonCost;
    }
    
    // Adicionar custo por CNPJ adicional
    if (cnpjCount > 1) {
      const cnpjAddon = planAddons.find(addon => 
        addon.unit_type === 'cnpj' && addon.is_active
      );
      
      if (cnpjAddon) {
        const additionalCnpjs = cnpjCount - 1;
        const cnpjCost = additionalCnpjs * (cnpjAddon.license_cost || 0);
        baseLicenseCost += cnpjCost;
      }
    }
    
    return {
      licenseCost: baseLicenseCost,
      exemptionMonths: matchingPlan.license_exemption_months || 0
    };
  }

  // Configurações padrão para seções especiais que importam dados
  const specialSectionConfigs: Record<string, { 
    name: string; 
    colorScheme: ColorScheme; 
    operationType: "operational" | "non_operational";
    isRevenue: boolean;
    columns: string[];
  }> = {
    "faturamento_rhid": {
      name: "Faturamento RHID",
      colorScheme: "emerald",
      operationType: "operational",
      isRevenue: true,
      columns: ["monthlyRevenue"]
    },
    "custo_licenca": {
      name: "Custo de Licença",
      colorScheme: "purple",
      operationType: "operational",
      isRevenue: false,
      columns: ["licenseCost"]
    },
    "impostos": {
      name: "Imposto RHID",
      colorScheme: "red",
      operationType: "operational",
      isRevenue: false,
      columns: ["allocatedTaxes"]
    },
    "boletos_rhid": {
      name: "Boletos RHID",
      colorScheme: "orange",
      operationType: "operational",
      isRevenue: false,
      columns: ["bankSlipCost"]
    },
    "rateio_custos": {
      name: "Rateio de custo",
      colorScheme: "blue",
      operationType: "operational",
      isRevenue: false,
      columns: ["allocatedCosts"]
    }
  };

  // Detectar se o nome corresponde a uma seção especial
  const detectSpecialSection = (sectionName: string) => {
    const lowerName = sectionName.toLowerCase();
    
    if (lowerName.includes("faturamento") && lowerName.includes("rhid")) {
      return specialSectionConfigs.faturamento_rhid;
    }
    if (lowerName.includes("custo") && (lowerName.includes("licença") || lowerName.includes("licenca"))) {
      return specialSectionConfigs.custo_licenca;
    }
    if (lowerName.includes("imposto") || lowerName.includes("tax")) {
      return specialSectionConfigs.impostos;
    }
    if (lowerName.includes("boleto") && lowerName.includes("rhid")) {
      return specialSectionConfigs.boletos_rhid;
    }
    if (lowerName.includes("rateio") && (lowerName.includes("custo") || lowerName.includes("custos"))) {
      return specialSectionConfigs.rateio_custos;
    }
    
    return null;
  };

  // Colunas disponíveis da análise por contrato
  const availableColumns = [
    { key: "monthlyRevenue", label: "Faturamento Mensal", type: "revenue" },
    { key: "licenseCost", label: "Custo Licença", type: "expense" },
    { key: "allocatedCosts", label: "Rateio de Custos Fixos", type: "expense" },
    { key: "allocatedTaxes", label: "Impostos", type: "expense" },
    { key: "bankSlipCost", label: "Boletos", type: "expense" },
    { key: "grossProfit", label: "Lucro Bruto", type: "revenue" },
    { key: "netProfitAfterTaxes", label: "Lucro Líquido", type: "revenue" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    try {
      // Detectar se é uma seção especial e aplicar configurações automáticas
      const specialConfig = detectSpecialSection(name);
      let finalColorScheme = colorScheme;
      let finalOperationType = operationType;
      let finalIsRevenue = isRevenue;
      let finalSelectedColumns = selectedColumns;
      
      if (specialConfig) {
        // Se detectou uma seção especial, usar as configurações padrão
        finalColorScheme = specialConfig.colorScheme;
        finalOperationType = specialConfig.operationType;
        finalIsRevenue = specialConfig.isRevenue;
        
        // Se estiver no modo manual, automaticamente mudar para importação com as colunas corretas
        if (creationMode === "manual") {
          finalSelectedColumns = specialConfig.columns;
        }
        
        console.log(`🔧 Detectada seção especial: ${name}`, {
          config: specialConfig,
          autoApplied: true
        });
      }

      // Criar seção
      const sectionResult = await createSection.mutateAsync({
        name: name.trim(),
        color_scheme: finalColorScheme,
        operation_type: finalOperationType,
        revenue_type: finalIsRevenue,
      });

      // Se for importação ou se é uma seção especial detectada, criar categorias e popular com dados
      const shouldImport = (creationMode === "import" && selectedColumns.length > 0) || 
                          (specialConfig && finalSelectedColumns.length > 0);
      
      if (shouldImport && sectionResult && contractProfitDetails) {
        const columnsToImport = finalSelectedColumns.length > 0 ? finalSelectedColumns : selectedColumns;
        
        for (const columnKey of columnsToImport) {
          const column = availableColumns.find(col => col.key === columnKey);
          if (column) {
            // Determinar o tipo baseado na configuração final da seção
            let categoryType: "renda" | "despesas";
            if (finalIsRevenue) {
              categoryType = "renda"; // Receita
            } else {
              categoryType = "despesas"; // Despesa
            }
            
            // Criar categoria
            const categoryResult = await createCategory.mutateAsync({
              name: column.label,
              type: categoryType,
              sectionId: sectionResult.id,
            });

            // Popular com dados dos contratos para cada mês do ano
            const currentYear = new Date().getFullYear();
            const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

            console.log('📊 IMPORT - Criando seção importada:', {
              selectedColumns,
              operationType,
              isRevenue,
              name: name.trim()
            });

            // Criar dados agrupados por contrato e mês
            const contractGroups: { [contractId: string]: { contractDetail: any; contract: any; contractNumber: string } } = {};
            
            // Garantir que todos os contratos ATIVOS sejam incluídos
            const activeContracts = contracts?.filter(contract => contract.status === 'Ativo');
            
            console.log(`📊 IMPORT - Total de contratos: ${contracts?.length}, Ativos: ${activeContracts?.length}`);
            console.log(`📊 IMPORT - Contratos ativos IDs:`, activeContracts?.map(c => c.contract_number));
            
            // Para Custo de Licença, processar TODOS os contratos ativos diretamente
            if (columnKey === "licenseCost") {
              activeContracts?.forEach(contract => {
                const contractNumber = contract.contract_number || contract.id.slice(0, 8);
                const { licenseCost, exemptionMonths } = calculateContractLicenseCost(contract);
                
                console.log(`📊 IMPORT - Processando contrato ${contractNumber} para Custo Licença:`, {
                  status: contract.status,
                  licenseCost,
                  exemptionMonths,
                  startDate: contract.start_date
                });
                
                contractGroups[contract.id] = {
                  contractDetail: {
                    contractId: contract.id,
                    monthlyRevenue: 0,
                    allocatedCosts: 0,
                    allocatedTaxes: 0,
                    grossProfit: 0,
                    netProfitAfterTaxes: 0
                  },
                  contract,
                  contractNumber
                };
              });
            } else {
              // Para outras colunas, usar os dados do contractProfitDetails
              activeContracts?.forEach(contract => {
                const contractDetail = contractProfitDetails?.find(detail => detail.contractId === contract.id);
                const contractNumber = contract.contract_number || contract.id.slice(0, 8);
                
                console.log(`📊 IMPORT - Contrato ${contractNumber}:`, {
                  status: contract.status,
                  hasDetail: !!contractDetail,
                  monthlyRevenue: contractDetail?.monthlyRevenue,
                  allocatedCosts: contractDetail?.allocatedCosts,
                  allocatedTaxes: contractDetail?.allocatedTaxes
                });
                
                contractGroups[contract.id] = {
                  contractDetail: contractDetail || {
                    contractId: contract.id,
                    monthlyRevenue: 0,
                    allocatedCosts: 0,
                    allocatedTaxes: 0,
                    grossProfit: 0,
                    netProfitAfterTaxes: 0
                  },
                  contract,
                  contractNumber
                };
              });
            }

            // Criar uma categoria para cada contrato individualmente
            for (const [contractId, data] of Object.entries(contractGroups)) {
              const { contractDetail, contract, contractNumber } = data;
              const categoryName = `${column.label} - Contrato ${contractNumber}`;
              
              // Determinar o tipo baseado na configuração da seção
              let categoryType: "renda" | "despesas";
              if (isRevenue) {
                categoryType = "renda"; // Receita
              } else {
                categoryType = "despesas"; // Despesa
              }
              
              // Criar categoria para este contrato específico
              const categoryResult = await createCategory.mutateAsync({
                name: categoryName,
                type: categoryType,
                sectionId: sectionResult.id,
              });

              // Calcular valores mensais para este contrato específico
              for (let month = 1; month <= 12; month++) {
                // Verificar se o contrato estava ativo neste mês
                const startDate = new Date(contract.start_date || contract.created_at);
                const endDate = contract.termination_date ? new Date(contract.termination_date) : null;
                
                const monthStart = new Date(currentYear, month - 1, 1);
                const monthEnd = new Date(currentYear, month, 0);
                
                // Contrato deve ter começado antes do fim do mês e não ter terminado antes do início do mês
                const isActiveInMonth = startDate <= monthEnd && (!endDate || endDate >= monthStart);
                
                if (!isActiveInMonth) continue;

                // Calcular período de teste para verificar se estava cobrando neste mês
                const trialDays = parseInt(contract.trial_days || '30');
                const billingStart = new Date(startDate);
                billingStart.setDate(billingStart.getDate() + trialDays);
                
                const billingYear = billingStart.getFullYear();
                const billingMonth = billingStart.getMonth();
                const isBeingBilled = currentYear > billingYear || (currentYear === billingYear && month - 1 >= billingMonth);

                let contractValue = 0;
                
                switch (columnKey) {
                  case "monthlyRevenue":
                    contractValue = isBeingBilled ? (contractDetail.monthlyRevenue || 0) : 0;
                    break;
                  case "licenseCost":
                    // Calcular custo de licença diretamente para o contrato
                    const { licenseCost, exemptionMonths } = calculateContractLicenseCost(contract);
                    
                    // Calcular quando termina o período de isenção
                    const exemptionEnd = new Date(startDate);
                    exemptionEnd.setMonth(exemptionEnd.getMonth() + exemptionMonths);
                    
                    // Verificar se está após o período de isenção
                    const currentMonthDate = new Date(currentYear, month - 1, 1);
                    const isAfterExemption = currentMonthDate >= exemptionEnd;
                    
                    // Aplicar o custo apenas após o período de isenção
                    if (isAfterExemption && licenseCost > 0) {
                      contractValue = -licenseCost; // Negativo pois é um custo
                    } else {
                      contractValue = 0;
                    }
                    
                    console.log(`📊 Custo Licença - Contrato ${contractNumber}, Mês ${month}:`, {
                      licenseCost,
                      exemptionMonths,
                      exemptionEnd,
                      isAfterExemption,
                      contractValue
                    });
                    break;
                  case "allocatedCosts":
                    contractValue = isBeingBilled ? -(contractDetail.allocatedCosts || 0) : 0;
                    break;
                  case "allocatedTaxes":
                    // Para impostos, aplicar o valor mensalmente se o contrato estiver ativo
                    // e tiver valor de imposto definido
                    if (isBeingBilled && contractDetail.allocatedTaxes) {
                      contractValue = -(contractDetail.allocatedTaxes || 0);
                    } else {
                      contractValue = 0;
                    }
                    console.log(`📊 Impostos - Contrato ${contractNumber}, Mês ${month}:`, {
                      isBeingBilled,
                      allocatedTaxes: contractDetail.allocatedTaxes,
                      contractValue,
                      startDate: contract.start_date,
                      billingStart: billingStart.toISOString()
                    });
                    break;
                  case "bankSlipCost":
                    // Custo de boleto fixo por mês
                    contractValue = isBeingBilled ? -3.80 : 0;
                    break;
                  case "grossProfit":
                    contractValue = isBeingBilled ? (contractDetail.grossProfit || 0) : 0;
                    break;
                  case "netProfitAfterTaxes":
                    contractValue = isBeingBilled ? (contractDetail.netProfitAfterTaxes || 0) : 0;
                    break;
                }
                
                // Ajustar o valor baseado no tipo da seção (receita ou despesa)
                let finalValue = contractValue;
                if (!isRevenue && contractValue > 0) {
                  // Se é despesa e o valor é positivo, tornar negativo
                  finalValue = -Math.abs(contractValue);
                } else if (isRevenue && contractValue < 0) {
                  // Se é receita e o valor é negativo, tornar positivo
                  finalValue = Math.abs(contractValue);
                }
                
                // Criar o custo mensal se houver valor
                if (finalValue !== 0) {
                  console.log(`💰 IMPORT - Salvando valor mensal: Contrato ${contractNumber}, Mês ${month}, Valor: ${finalValue}, Tipo: ${isRevenue ? 'Receita' : 'Despesa'}`);
                  
                  await createMonthlyCosts.mutateAsync({
                    category_id: categoryResult.id,
                    year: currentYear,
                    months: [month],
                    value: finalValue,
                    description: `Contrato ${contractNumber}`,
                    is_projection: false,
                  });
                } else {
                  console.log(`⚠️ IMPORT - Valor zero para Contrato ${contractNumber}, Mês ${month}`);
                }
              }
            }
          }
        }
      }
      
      // Reset form and close modal
      setName("");
      setColorScheme("purple");
      setOperationType("operational");
      setIsRevenue(false);
      setCreationMode("manual");
      setSelectedColumns([]);
      
      // Se foi uma seção especial, mostrar aviso
      if (specialConfig) {
        console.log(`✅ Seção especial "${name}" criada com configurações automáticas`);
      }
      
      onClose();
    } catch (error) {
      console.error("Error creating section:", error);
    }
  };

  const handleClose = () => {
    setName("");
    setColorScheme("purple");
    setOperationType("operational");
    setIsRevenue(false);
    setCreationMode("manual");
    setSelectedColumns([]);
    onClose();
  };

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Seção</DialogTitle>
        </DialogHeader>
        
        <Tabs value={creationMode} onValueChange={(value: "manual" | "import") => setCreationMode(value)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Seção Manual
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Importar da Análise por Contrato
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="section-name">Nome da Seção</Label>
              <Input
                id="section-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Custos Operacionais"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operation-type">Tipo de Operação</Label>
              <Select value={operationType} onValueChange={(value: "operational" | "non_operational") => setOperationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">
                    <div className="flex items-center gap-2">
                      💰 Operacional - Aparece no resumo operacional
                    </div>
                  </SelectItem>
                  <SelectItem value="non_operational">
                    <div className="flex items-center gap-2">
                      ⚡ Não Operacional - Aparece no resumo não operacional
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenue-type">Tipo de Valor</Label>
              <Select value={isRevenue ? "revenue" : "expense"} onValueChange={(value) => setIsRevenue(value === "revenue")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">
                    <div className="flex items-center gap-2">
                      💸 Despesa - Valores negativos (diminuem o lucro)
                    </div>
                  </SelectItem>
                  <SelectItem value="revenue">
                    <div className="flex items-center gap-2">
                      💰 Receita - Valores positivos (aumentam o lucro)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-scheme">Esquema de Cores</Label>
              <Select value={colorScheme} onValueChange={(value: ColorScheme) => setColorScheme(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${scheme.header}`} />
                        {scheme.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="import" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Selecionar Colunas da Análise por Contrato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availableColumns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.key}
                        checked={selectedColumns.includes(column.key)}
                        onCheckedChange={() => toggleColumn(column.key)}
                      />
                      <Label htmlFor={column.key} className="flex items-center gap-2 cursor-pointer">
                        <span className={column.type === 'revenue' ? 'text-green-600' : 'text-red-600'}>
                          {column.type === 'revenue' ? '💰' : '💸'}
                        </span>
                        {column.label}
                      </Label>
                    </div>
                  ))}
                  {selectedColumns.length > 0 && (
                    <div className="mt-3 p-2 bg-muted rounded text-sm">
                      <strong>Selecionadas:</strong> {selectedColumns.length} coluna(s)
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!name.trim() || createSection.isPending || (creationMode === "import" && selectedColumns.length === 0)}
                className="flex-1"
              >
                {createSection.isPending ? "Criando..." : "Criar Seção"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddFinancialSectionModal;