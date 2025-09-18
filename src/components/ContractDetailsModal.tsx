import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContractShare } from "@/hooks/useContractShare";
import ShareContractModal from "./ShareContractModal";
import ContractAddons from "./ContractAddons";
import ContractSignaturesTab from "./ContractSignaturesTab";
import { ContractStatusHistory } from "./ContractStatusHistory";
import { supabase } from "@/integrations/supabase/client";
import { formatDateToBrazilian } from "@/utils/dateUtils";
import { 
  FileText, 
  Share2, 
  Users, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  CreditCard,
  DollarSign,
  Clock,
  UserCheck,
  Hash,
  Briefcase
} from "lucide-react";

interface ContractDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
  onContractUpdate?: () => void;
}

const ContractDetailsModal = ({ isOpen, onClose, contract, onContractUpdate }: ContractDetailsModalProps) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [signedContracts, setSignedContracts] = useState<any[]>([]);
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { getSignedContracts } = useContractShare();

  useEffect(() => {
    if (isOpen && contract) {
      console.log("🔄 Modal aberto, carregando dados para o contrato:", contract);
      // Força atualização do histórico quando o modal abre
      setRefreshKey(prev => prev + 1);
      loadSignedContracts();
      loadCompanyData();
    }
  }, [isOpen, contract]);

  const loadSignedContracts = async () => {
    if (contract?.id) {
      const signed = await getSignedContracts(contract.id);
      setSignedContracts(signed);
    }
  };

  const loadCompanyData = async () => {
    setLoading(true);
    console.log("🏢 === INICIANDO BUSCA DOS DADOS DA EMPRESA ===");
    console.log("📋 Contrato completo recebido:", JSON.stringify(contract, null, 2));
    
    try {
      // Primeiro, vamos verificar se existe dados no localStorage mais recentes
      const savedCompanyData = localStorage.getItem("companyProfile");
      let localStorageData = null;
      if (savedCompanyData) {
        localStorageData = JSON.parse(savedCompanyData);
        console.log("💾 Dados encontrados no localStorage:", localStorageData);
      }

      // 1. Tentar buscar pela company_id do contrato
      if (contract?.company_id) {
        console.log("🔍 MÉTODO 1: Buscando empresa pelo company_id:", contract.company_id);
        const { data: company, error } = await supabase
          .from("companies")
          .select("*")
          .eq("id", contract.company_id)
          .maybeSingle();

        console.log("📊 Resultado da busca por company_id:", { company, error });

        if (error) {
          console.error("❌ Erro ao carregar dados da empresa pelo company_id:", error);
        } else if (company) {
          console.log("✅ SUCESSO - Empresa encontrada pelo company_id:", company);
          
          // Se temos dados do localStorage que são mais recentes ou diferentes, vamos usar eles e atualizar o Supabase
          if (localStorageData && localStorageData.name && localStorageData.name !== company.name) {
            console.log("🔄 Dados do localStorage são diferentes/mais recentes, atualizando Supabase...");
            
            const updateData = {
              name: localStorageData.name,
              address: localStorageData.address || company.address,
              phone: localStorageData.phone || company.phone,
              email: localStorageData.email || company.email,
              website: localStorageData.website || company.website,
              logo: localStorageData.logo || company.logo,
            };

            const { data: updatedCompany, error: updateError } = await supabase
              .from("companies")
              .update(updateData)
              .eq("id", company.id)
              .select()
              .single();

            if (!updateError && updatedCompany) {
              console.log("✅ Empresa atualizada com dados do localStorage:", updatedCompany);
              setCompanyData(updatedCompany);
            } else {
              console.log("⚠️ Erro ao atualizar empresa, usando dados do localStorage:", updateError);
              setCompanyData({ ...company, ...localStorageData });
            }
          } else {
            // Usar dados do Supabase
            setCompanyData(company);
          }
          
          setLoading(false);
          return;
        } else {
          console.log("⚠️ Nenhuma empresa encontrada com company_id:", contract.company_id);
        }
      } else {
        console.log("⚠️ Contract não possui company_id:", contract?.company_id);
      }

      // 2. Tentar buscar pela user_id do contrato
      if (contract?.user_id) {
        console.log("🔍 MÉTODO 2: Buscando empresa pelo user_id do contrato:", contract.user_id);
        const { data: company, error } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", contract.user_id)
          .maybeSingle();

        console.log("📊 Resultado da busca por user_id:", { company, error });

        if (error) {
          console.error("❌ Erro ao carregar dados da empresa pelo user_id:", error);
        } else if (company) {
          console.log("✅ SUCESSO - Empresa encontrada pelo user_id:", company);
          
          // Se temos dados do localStorage que são mais recentes ou diferentes, vamos usar eles e atualizar o Supabase
          if (localStorageData && localStorageData.name && localStorageData.name !== company.name) {
            console.log("🔄 Dados do localStorage são diferentes/mais recentes, atualizando Supabase...");
            
            const updateData = {
              name: localStorageData.name,
              address: localStorageData.address || company.address,
              phone: localStorageData.phone || company.phone,
              email: localStorageData.email || company.email,
              website: localStorageData.website || company.website,
              logo: localStorageData.logo || company.logo,
            };

            const { data: updatedCompany, error: updateError } = await supabase
              .from("companies")
              .update(updateData)
              .eq("id", company.id)
              .select()
              .single();

            if (!updateError && updatedCompany) {
              console.log("✅ Empresa atualizada com dados do localStorage:", updatedCompany);
              setCompanyData(updatedCompany);
            } else {
              console.log("⚠️ Erro ao atualizar empresa, usando dados do localStorage:", updateError);
              setCompanyData({ ...company, ...localStorageData });
            }
          } else {
            // Usar dados do Supabase
            setCompanyData(company);
          }
          
          setLoading(false);
          return;
        } else {
          console.log("⚠️ Nenhuma empresa encontrada com user_id:", contract.user_id);
        }
      } else {
        console.log("⚠️ Contract não possui user_id:", contract?.user_id);
      }

      // 3. Usar localStorage como fallback
      console.log("🔍 MÉTODO 3: Usando localStorage como fallback");
      if (localStorageData && localStorageData.name && localStorageData.name !== "") {
        console.log("✅ Usando dados do localStorage:", localStorageData);
        setCompanyData(localStorageData);
      } else {
        console.log("⚠️ Nenhum dado válido encontrado");
        setCompanyData(null);
      }
      
    } catch (error) {
      console.error("❌ Erro inesperado ao buscar empresa:", error);
      setCompanyData(null);
    } finally {
      setLoading(false);
      console.log("🏁 === BUSCA DOS DADOS DA EMPRESA FINALIZADA ===");
    }
  };

  // Adiciona listener para mudanças de status do contrato
  useEffect(() => {
    const handleStatusChange = (event: CustomEvent) => {
      if (event.detail?.contractId === contract?.id) {
        console.log("📊 Status do contrato mudou, atualizando histórico...");
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('contract-status-changed' as any, handleStatusChange);
    
    return () => {
      window.removeEventListener('contract-status-changed' as any, handleStatusChange);
    };
  }, [contract?.id]);

  const getSigningStatus = (contractorId: string) => {
    const signed = signedContracts.find(sc => sc.contractor_id === contractorId);
    if (signed) {
      return signed.is_cancelled ? 'cancelled' : 'signed';
    }
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Assinado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: string | number) => {
    // Se o valor for string, preservar como está e converter para number
    let numValue: number;
    
    if (typeof value === 'string') {
      // Remove qualquer formatação existente e converte para número
      const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
      numValue = parseFloat(cleanValue);
    } else {
      numValue = value;
    }
    
    // Se não for um número válido, retorna 0
    if (isNaN(numValue)) {
      numValue = 0;
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  // Function to get the correct label based on plan type
  const getValueLabel = () => {
    const planType = contract.plan_type || 'mensal';
    
    switch (planType) {
      case 'anual':
        return 'Valor Anual';
      case 'semestral':
        return 'Valor Semestral';
      default:
        return 'Valor Mensal';
    }
  };

  const handleRefreshSignatures = () => {
    loadSignedContracts();
    if (onContractUpdate) {
      onContractUpdate();
    }
  };

  if (!contract) return null;

  console.log("🖼️ Renderizando modal com companyData:", companyData);
  console.log("⏳ Estado do loading:", loading);
  console.log("💰 Valor do contrato para formatação:", contract.monthly_value);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="text-foreground">Contrato #{contract.contract_number}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={contract.status === 'Ativo' ? 'default' : 'secondary'} className="text-xs">
                    {contract.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Criado em {formatDate(contract.created_at)}
                  </span>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs 
            defaultValue="overview" 
            className="w-full"
            onValueChange={(value) => {
              console.log('🔍 [ContractDetailsModal] Aba selecionada:', value);
              if (value === 'history') {
                console.log('📋 [ContractDetailsModal] Abrindo aba de histórico para contrato:', contract.id);
                setRefreshKey(prev => prev + 1);
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="signatures">Assinaturas</TabsTrigger>
              <TabsTrigger value="addons">Adicionais e Mudanças</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="sharing">Compartilhamento</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Cards de resumo principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary p-2 rounded-lg">
                        <DollarSign className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{getValueLabel()}</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(contract.monthly_value)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary p-2 rounded-lg">
                        <Users className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Funcionários</p>
                        <p className="text-lg font-bold text-secondary-foreground">{contract.employee_count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-accent p-2 rounded-lg">
                        <Building2 className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">CNPJs</p>
                        <p className="text-lg font-bold text-accent-foreground">{contract.cnpj_count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted p-2 rounded-lg">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Teste</p>
                        <p className="text-lg font-bold text-foreground">{contract.trial_days} dias</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informações do Contrato */}
                <Card className="border shadow-sm">
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      Detalhes do Contrato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo de Plano</p>
                        <p className="text-sm font-semibold text-foreground capitalize">{contract.plan_type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                        <Badge variant={contract.status === 'Ativo' ? 'default' : 'secondary'}>
                          {contract.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground">Data de Início</p>
                          <p className="text-sm font-medium text-foreground">{formatDateToBrazilian(contract.start_date)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground">Data de Renovação</p>
                          <p className="text-sm font-medium text-foreground">{formatDateToBrazilian(contract.renewal_date)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground">Dia de Pagamento</p>
                          <p className="text-sm font-medium text-foreground">Todo dia {contract.payment_day}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Empresa Contratada */}
                <Card className="border shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      Empresa Contratada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-pulse flex items-center gap-2">
                          <div className="w-4 h-4 bg-primary/20 rounded-full animate-bounce"></div>
                          <span className="text-muted-foreground">Carregando dados da empresa...</span>
                        </div>
                      </div>
                    ) : companyData ? (
                      <div className="space-y-4">
                        {/* Logo e nome */}
                        <div className="flex items-start gap-4 pb-4 border-b">
                          {companyData.logo ? (
                            <div className="w-16 h-16 bg-muted border rounded-lg p-2 flex items-center justify-center flex-shrink-0">
                              <img 
                                src={companyData.logo} 
                                alt="Logo da empresa" 
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-foreground">{companyData.name}</h3>
                            {companyData.cnpj && (
                              <p className="text-sm text-muted-foreground">CNPJ: {companyData.cnpj}</p>
                            )}
                          </div>
                        </div>

                        {/* Informações de contato */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Endereço</p>
                              <p className="text-sm text-foreground">{companyData.address}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-3">
                              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Telefone</p>
                                <p className="text-sm text-foreground">{companyData.phone}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">E-mail</p>
                                <p className="text-sm text-primary hover:text-primary/80">
                                  <a href={`mailto:${companyData.email}`}>{companyData.email}</a>
                                </p>
                              </div>
                            </div>
                          </div>

                          {companyData.website && (
                            <div className="flex items-center gap-3">
                              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Website</p>
                                <p className="text-sm text-primary hover:text-primary/80">
                                  <a 
                                    href={`http://${companyData.website}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    {companyData.website}
                                  </a>
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-foreground mb-2">Dados da empresa não encontrados</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure o perfil da empresa nas configurações para que as informações apareçam aqui.
                        </p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Debug info:</p>
                          <p>company_id: {contract?.company_id || 'N/A'}</p>
                          <p>user_id: {contract?.user_id || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Contratantes */}
              <Card className="border shadow-sm">
                <CardHeader className="bg-gradient-to-r from-secondary/5 to-secondary/10 border-b border-secondary/20">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-secondary" />
                    Contratantes ({contract.contractors?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {contract.contractors?.length > 0 ? (
                    <div className="space-y-4">
                      {contract.contractors.map((contractor: any, index: number) => (
                        <div key={contractor.id} className="flex items-start justify-between p-4 border rounded-lg hover:border-muted-foreground/30 transition-colors">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
                                <span className="text-secondary font-semibold text-sm">{index + 1}</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground">{contractor.name}</h4>
                                <p className="text-sm text-muted-foreground">CNPJ: {contractor.cnpj}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground ml-13">
                              <div>
                                <span className="font-medium">Responsável:</span> {contractor.responsible_name}
                              </div>
                              <div>
                                <span className="font-medium">Localização:</span> {contractor.city}/{contractor.state}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(getSigningStatus(contractor.id))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Nenhum contratante cadastrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signatures" className="space-y-4">
              <ContractSignaturesTab
                contractId={contract.id}
                signedContracts={signedContracts}
                allContractors={contract.contractors || []}
                onRefresh={handleRefreshSignatures}
              />
            </TabsContent>

            <TabsContent value="addons" className="space-y-4">
              <ContractAddons 
                contractId={contract.id}
                contractNumber={contract.contract_number}
                onContractUpdate={onContractUpdate}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <ContractStatusHistory 
                key={`history-${contract.id}-${refreshKey}`}
                contractId={contract.id} 
              />
            </TabsContent>

            <TabsContent value="sharing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Compartilhar Contrato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <Share2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">
                      Gere links seguros para que os contratantes possam acessar e assinar o contrato
                    </p>
                    <Button onClick={() => setShowShareModal(true)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Gerar Links de Compartilhamento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ShareContractModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        contract={contract}
      />
    </>
  );
};

export default ContractDetailsModal;
