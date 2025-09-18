import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, Clock, RefreshCw, Settings, User, Building, Phone, Mail, MapPin, FileText, Users, Briefcase } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";
import { useBankSlipConfigurations } from "@/hooks/useBankSlipConfigurations";
import { usePlans } from "@/hooks/usePlans";
import { usePlanAddons } from "@/hooks/usePlanAddons";
interface ContractorDetailsModalProps {
  contractId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const ContractorDetailsModal: React.FC<ContractorDetailsModalProps> = ({
  contractId,
  open,
  onOpenChange
}) => {
  const {
    contracts
  } = useContracts();
  const {
    adjustments
  } = useContractAdjustments();
  const {
    contractCosts
  } = useBankSlipConfigurations();
  const { plans } = usePlans();
  const { planAddons } = usePlanAddons();
  
  const contract = contracts?.find(c => c.id === contractId);
  const contractor = contract?.contractors?.[0];
  const contractAdjustments = adjustments?.filter(adj => adj.contract_id === contractId) || [];
  const bankSlipCost = contractCosts?.find(cost => cost.contract_id === contractId);
  
  // Buscar adicionais do contrato
  const contractAddons = contract?.addons?.filter(addon => 
    addon.addon_type === 'addon' || addon.addon_type === 'plan_change'
  ) || [];
  
  // Verificar se tem adicional de funcionários ou CNPJs
  const hasEmployeeAddon = contractAddons.some(addon => 
    addon.description?.toLowerCase().includes('funcionário') || 
    addon.description?.toLowerCase().includes('employee')
  );
  
  const hasCnpjAddon = contractAddons.some(addon => 
    addon.description?.toLowerCase().includes('cnpj')
  );
  if (!contract || !contractor) {
    return null;
  }
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Não informado';
    try {
      let date: Date;
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateString);
      }
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };
  const formatCurrency = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) : value;
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  const calculateTrialEndDate = (startDate: string, trialDays: string): string => {
    if (!startDate || !trialDays) return 'Não informado';
    try {
      let date: Date;
      if (startDate.includes('/')) {
        const [day, month, year] = startDate.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(startDate);
      }
      date.setDate(date.getDate() + parseInt(trialDays));
      return date.toLocaleDateString('pt-BR');
    } catch {
      return 'Não informado';
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Contratante - {contractor.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas do Contratante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome/Razão Social</label>
                  <p className="text-sm font-semibold">{contractor.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">CNPJ</label>
                  <p className="text-sm">{contractor.cnpj || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Responsável</label>
                  <p className="text-sm">{contractor.responsible_name || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">CPF do Responsável</label>
                  <p className="text-sm">{contractor.responsible_cpf || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <p className="text-sm">{contractor.email || 'Não informado'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Localização</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <p className="text-sm">{contractor.city}, {contractor.state}</p>
                  </div>
                </div>
              </div>
              {contractor.address && <div>
                  <label className="text-sm font-medium text-gray-500">Endereço</label>
                  <p className="text-sm">{contractor.address}</p>
                </div>}
            </CardContent>
          </Card>

          {/* Informações do Contrato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informações do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Número do Contrato</label>
                  <p className="text-sm font-semibold">{contract.contract_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Plano</label>
                  <Badge variant="outline">{contract.plan_type}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Valor Mensal</label>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(contract.monthly_value || '0')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge variant={contract.status === 'Ativo' ? 'default' : 'secondary'}>
                    {contract.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Detalhes do Plano
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Funcionários Liberados</label>
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-blue-500" />
                    <p className="text-sm font-semibold">{contract.employee_count === '-1' ? 'Ilimitado' : contract.employee_count}</p>
                    {hasEmployeeAddon && (
                      <Badge variant="outline" className="text-xs">
                        + Adicional
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">CNPJs Permitidos</label>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3 text-green-500" />
                    <p className="text-sm font-semibold">{contract.cnpj_count === '-1' ? 'Ilimitado' : contract.cnpj_count}</p>
                    {hasCnpjAddon && (
                      <Badge variant="outline" className="text-xs">
                        + Adicional
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Adicionais Contratados */}
              {contractAddons.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Adicionais Contratados</label>
                  <div className="space-y-2">
                    {contractAddons.map((addon) => (
                      <div key={addon.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{addon.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Solicitado em {formatDate(addon.request_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">
                            {formatCurrency(addon.new_value || '0')}
                          </p>
                          {addon.effective_date && (
                            <p className="text-xs text-muted-foreground">
                              Vigente desde {formatDate(addon.effective_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Datas Importantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Cronograma do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Início</label>
                  <p className="text-sm">{formatDate(contract.start_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Dias de Teste Grátis</label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <p className="text-sm">{contract.trial_days} dias</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Fim do Período de Teste</label>
                  <p className="text-sm">{calculateTrialEndDate(contract.start_date, contract.trial_days)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Início do Pagamento</label>
                  <p className="text-sm">{formatDate(contract.payment_start_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Renovação</label>
                  <p className="text-sm">{formatDate(contract.renewal_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Dia do Pagamento</label>
                  <p className="text-sm">Dia {contract.payment_day}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custo de Boleto */}
          {bankSlipCost && <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Custo de Boleto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Custo Mensal</label>
                    <p className="text-sm font-semibold text-blue-600">{formatCurrency(bankSlipCost.monthly_cost)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Início da Cobrança</label>
                    <p className="text-sm">A partir do {bankSlipCost.billing_start_month}° mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>}

          {/* Histórico de Reajustes */}
          {contractAdjustments.length > 0 && <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Histórico de Reajustes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contractAdjustments.map((adjustment, index) => {
                    // Usar os valores reais do ajuste sem arredondamento
                    const previousFullValue = adjustment.previous_value;
                    const newFullValue = adjustment.new_value;
                    const isIncrease = newFullValue > previousFullValue;
                    const difference = newFullValue - previousFullValue;
                    const percentageChange = ((difference / previousFullValue) * 100).toFixed(1);
                    
                    // Extrair dados do plano anterior e atual das notas
                    const currentEmployees = adjustment.notes?.match(/(\d+)\s+funcionários/)?.[1] || contract.employee_count;
                    const currentCnpjs = adjustment.notes?.match(/(\d+)\s+CNPJs/)?.[1] || (contract.cnpj_count === '-1' ? 'Ilimitado' : contract.cnpj_count);
                    
                    // Para o plano anterior, usar os dados do próximo ajuste ou dados base do contrato
                    const nextAdjustment = contractAdjustments[index + 1];
                    const previousEmployees = nextAdjustment?.notes?.match(/(\d+)\s+funcionários/)?.[1] || contract.employee_count;
                    const previousCnpjs = nextAdjustment?.notes?.match(/(\d+)\s+CNPJs/)?.[1] || (contract.cnpj_count === '-1' ? 'Ilimitado' : contract.cnpj_count);
                    
                    return (
                      <div key={adjustment.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          {/* Indicador de Tendência */}
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            isIncrease 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          }`}>
                            {isIncrease ? '↗' : '↘'}
                          </div>

                          {/* Informações do Plano */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {formatCurrency(previousFullValue)} → {formatCurrency(newFullValue)}
                              </span>
                              <Badge variant={isIncrease ? "default" : "destructive"} className="text-xs">
                                {isIncrease ? '+' : ''}{percentageChange}%
                              </Badge>
                            </div>
                            
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>📅 {formatDate(adjustment.effective_date)}</div>
                              <div className="flex items-center gap-4">
                                <span>👥 {previousEmployees} → {currentEmployees} funcionários</span>
                                <span>🏢 {previousCnpjs} → {currentCnpjs} CNPJs</span>
                              </div>
                            </div>
                          </div>

                          {/* Valor da Diferença */}
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              isIncrease 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {isIncrease ? '+' : ''}{formatCurrency(difference)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {adjustment.adjustment_type === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>}

          {/* Alterações de Plano */}
          
        </div>
      </DialogContent>
    </Dialog>;
};
export default ContractorDetailsModal;