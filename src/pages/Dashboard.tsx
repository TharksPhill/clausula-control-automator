import { useState } from "react";
import { ContractProvider } from "@/context/ContractContext";
import ContractForm from "@/components/ContractForm";
import ContractPreview from "@/components/ContractPreview";
import CompanyProfile from "@/components/CompanyProfile";
import ContractsList from "@/components/ContractsList";
import Statistics from "@/components/Statistics";
import SystemSettings from "@/components/SystemSettings";
import ChatManagement from "@/pages/ChatManagement";
import NotificationsManagement from "@/pages/NotificationsManagement";
import AdminManagement from "@/pages/AdminManagement";
import WelcomeGreeting from "@/components/WelcomeGreeting";
import QuickActionsCards from "@/components/QuickActionsCards";
import DashboardStats from "@/components/DashboardStats";
import DashboardCharts from "@/components/DashboardCharts";
import BrazilMap from "@/components/BrazilMap";
import RegionalAnalysis from "@/components/RegionalAnalysis";
import GeographicStatistics from "@/components/GeographicStatistics";
import Billing from "@/components/Billing";
import BankSlipManagement from "@/components/BankSlipManagement";
import DocuSignApiConfig from "@/components/DocuSignApiConfig";
import ContractRenewals from "@/components/ContractRenewals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import AppSidebar from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import PageActions from "@/components/PageActions";
import PlansManagement from "@/components/PlansManagement";
import ProductRegistration from "@/components/ProductRegistration";
import ProductProfitAnalysis from "@/components/ProductProfitAnalysis";
import RejectionReview from "@/components/RejectionReview";
import PlanChangesManagement from "@/components/PlanChangesManagement";
import { useContracts } from "@/hooks/useContracts";
import EmployeeCosts from "@/components/EmployeeCosts";
import EnhancedCompanyCosts from "@/components/EnhancedCompanyCosts";
import ProfitAnalysis from "@/components/ProfitAnalysis";
import AdvancedProfitAnalysis from "@/components/AdvancedProfitAnalysis";
import CostPlanManagement from "@/components/CostPlanManagement";
import { CSVImporter } from "@/components/contracts/CSVImporter";
import { TrialContractsList as TrialContractsListComponent } from "@/components/TrialContractsList";
import { TerminateContractsList } from "@/components/TerminateContractsList";
import { useIsMobile } from "@/hooks/use-mobile";
import { Trash2 } from "lucide-react";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import SystemEvents from "@/components/SystemEvents";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<string>("dashboard");
  const [editingContract, setEditingContract] = useState<any>(null);
  const {
    contracts,
    deleteContract
  } = useContracts();
  const isMobile = useIsMobile();
  const handleEditContract = (contract: any) => {
    setEditingContract(contract);
    setActiveView("create");
  };
  const handleNewContract = () => {
    setEditingContract(null);
    setActiveView("create");
  };
  const handleContractSaved = () => {
    setEditingContract(null);
    setActiveView("dashboard");
  };
  const handleActionClick = (action: string) => {
    switch (action) {
      case "create-contract":
        handleNewContract();
        break;
      case "view-contracts":
        setActiveView("contracts");
        break;
      case "statistics":
        setActiveView("statistics");
        break;
      case "plans-management":
        setActiveView("plans-management");
        break;
      case "chat-management":
        setActiveView("chat-management");
        break;
      case "admin-management":
        setActiveView("admin-management");
        break;
      case "profile":
        setActiveView("profile");
        break;
      case "notifications":
        setActiveView("notifications");
        break;
      case "settings":
        setActiveView("system-settings");
        break;
      case "brazil-map":
        setActiveView("brazil-map");
        break;
      case "cash-flow":
        navigate("/financial-analysis");
        break;
      case "plan-changes":
        setActiveView("plan-changes");
        break;
      case "contract-adjustments":
        navigate("/contract-adjustments");
        break;
      default:
        break;
    }
  };
  const shouldShowPageActions = () => {
    console.log('🔍 Verificando se deve mostrar PageActions para view:', activeView);
    const viewsWithActions = ["create", "profile", "system-settings"];
    const shouldShow = viewsWithActions.includes(activeView);
    console.log('🎯 Resultado shouldShowPageActions:', shouldShow);
    return shouldShow;
  };
  const handleCancelAction = () => {
    console.log('🔄 handleCancelAction executado');
    setActiveView("dashboard");
    setEditingContract(null);
  };
  const handleSaveAction = () => {
    console.log('💾 handleSaveAction executado para view:', activeView);
    switch (activeView) {
      case "create":
        console.log('📝 Tentando salvar contrato...');
        break;
      case "profile":
        console.log('👤 Tentando salvar perfil...');
        break;
      case "system-settings":
        console.log('⚙️ Tentando salvar configurações...');
        break;
      default:
        console.log('❓ Nenhuma ação de salvar definida para esta view');
        break;
    }
  };
  const getPageTitle = () => {
    switch (activeView) {
      case "dashboard":
        return "";
      case "contracts":
        return "Meus Contratos";
      case "csv-import":
        return "Importação de Contratos via CSV";
      case "create":
        return editingContract ? "Editar Contrato" : "Criar Novo Contrato";
      case "trial-contracts":
        return "Contratos em Período de Teste";
      case "terminate-contracts":
        return "Encerrar Contratos";
      case "plan-changes":
        return "Mudanças de Planos";
      case "contract-renewals":
        return "Renovações de Contratos";
      case "plans-management":
        return "Gerenciamento de Planos";
      case "chat-management":
        return "Chat Inteligente";
      case "rejection-review":
        return "Revisão de Rejeições";
      case "brazil-map":
        return "Mapa de Contratos do Brasil";
      case "regional-analysis":
        return "Análise Regional de Contratos";
      case "geographic-statistics":
        return "Estatísticas Geográficas";
      case "billing":
        return "Faturamento";
      case "bank-slip-management":
        return "Valor do Boleto";
      case "employee-costs":
        return "Custos de Funcionários";
      case "company-costs":
        return "Custos da Empresa";
      case "cost-plan-management":
        return "Gestão de Planos de Custo";
      case "product-registration":
        return "Cadastro de Produtos";
      case "product-profit-analysis":
        return "Análise de Lucros de Produtos (DRE)";
      case "profit-analysis":
        return "Análise de Lucros";
      case "notifications":
        return "Notificações";
      case "statistics":
        return "Estatísticas";
      case "admin-management":
        return "Administradores";
      case "system-settings":
        return "Configurações do Sistema";
      case "profile":
        return "Perfil da Empresa";
      case "docusign-config":
        return "Configuração DocuSign";
      default:
        return "";
    }
  };
  const renderContent = () => {
    switch (activeView) {
      case "docusign-config":
        return <div className="space-y-4 p-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-blue-900">Configuração da Integração DocuSign</CardTitle>
                <CardDescription>Configure suas credenciais de API para habilitar a assinatura digital</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <DocuSignApiConfig onConfigured={config => {
                console.log('DocuSign configurado:', config);
                setActiveView("dashboard");
              }} />
              </CardContent>
            </Card>
          </div>;
      case "dashboard":
        return <div className="space-y-6 bg-gray-50 dark:bg-gray-900/50 min-h-screen p-6">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <WelcomeGreeting />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <div className="w-1 h-6 bg-primary rounded-full"></div>
                  Ações Rápidas
                </h2>
                <QuickActionsCards onActionClick={handleActionClick} />
              </div>
              <div className="lg:col-span-1">
                <SystemEvents />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                Estatísticas Gerais
              </h2>
              <DashboardStats />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                Visão Geral
              </h2>
              <DashboardCharts />
            </div>
          </div>;
      case "contracts":
        return <div className="space-y-6 p-6 bg-background">
            <ContractsList onEditContract={handleEditContract} />
          </div>;
      case "csv-import":
        return null; // CSVImporter is now a modal and managed separately
      case "trial-contracts":
        return <div className="space-y-6 p-6">
            <TrialContractsListComponent onEditContract={handleEditContract} />
          </div>;
      case "terminate-contracts":
        return <div className="space-y-6 p-6">
            <TerminateContractsList />
          </div>;
      case "plan-changes":
        return <div className="space-y-6 p-6">
            <PlanChangesManagement />
          </div>;
      case "contract-renewals":
        return <div className="space-y-6 p-6">
            <ContractRenewals />
          </div>;
      case "create":
        return <div className="space-y-4 p-6">
            <div className="flex min-h-[800px] rounded-lg border">
              <div className="flex-1 min-w-0">
                <Card className="shadow-sm h-full border-0">
                  <CardHeader className="bg-gradient-to-r from-muted to-accent border-b">
                    <CardTitle className="text-foreground">Pré-visualização</CardTitle>
                    <CardDescription>
                      Como o contrato ficará ao ser impresso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 h-[calc(100vh-200px)]">
                    <div className="p-4 h-full overflow-auto border-t bg-card">
                      <ContractPreview />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="w-px bg-border"></div>
              
              <div className="w-1/2 sticky top-6 h-fit">
                <Card className="shadow-sm border-0 overflow-hidden">
                  <CardContent className="p-0">
                    <ContractForm editingContract={editingContract} onContractSaved={handleContractSaved} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>;
      case "plans-management":
        return <div className="space-y-4 p-6">
            <PlansManagement />
          </div>;
      case "chat-management":
        return <div className="space-y-4 p-6">
            <ChatManagement />
          </div>;
      case "rejection-review":
        return <div className="space-y-4 p-6">
            <RejectionReview />
          </div>;
      case "brazil-map":
        return <div className="space-y-4 p-6">
            <Card className="bg-transparent border-cyan-500/50 border-2">
              <CardHeader className="bg-transparent border-b border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-cyan-400 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-cyan-500">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                        <path d="M2 12h20" />
                      </svg>
                      Mapa de Contratos do Brasil
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Visualize a distribuição geográfica dos seus contratos em todo o território nacional
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <BrazilMap contracts={contracts || []} />
              </CardContent>
            </Card>
          </div>;
      case "regional-analysis":
        return <div className="space-y-4 p-6">
            <RegionalAnalysis />
          </div>;
      case "geographic-statistics":
        return <div className="space-y-4 p-6">
            <GeographicStatistics />
          </div>;
      case "billing":
        return <div className="space-y-4 p-6">
            <Billing />
          </div>;
      case "bank-slip-management":
        return <div className="space-y-4 p-6">
            <BankSlipManagement />
          </div>;
      case "employee-costs":
        return <div className="space-y-4 p-6">
            <EmployeeCosts />
          </div>;
      case "company-costs":
        return <div className="space-y-4 p-6">
            <EnhancedCompanyCosts />
          </div>;
      case "cost-plan-management":
        return <div className="space-y-4 p-6">
            <CostPlanManagement />
          </div>;
      case "profit-analysis":
        return <div className="space-y-4 p-6">
            <AdvancedProfitAnalysis />
          </div>;
      case "product-registration":
        return <div className="space-y-4 p-6">
            <ProductRegistration />
          </div>;
      case "product-profit-analysis":
        return <div className="space-y-4 p-6">
            <ProductProfitAnalysis />
          </div>;
      case "notifications":
        return <div className="space-y-4 p-6">
            <NotificationsManagement />
          </div>;
      case "statistics":
        return <div className="space-y-4 p-6">
            <Statistics />
          </div>;
      case "admin-management":
        return <div className="space-y-4 p-6">
            <AdminManagement />
          </div>;
      case "system-settings":
        return <div className="space-y-4 p-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="text-foreground">Configurações do Sistema</CardTitle>
                <CardDescription>Configure as preferências gerais e avançadas do sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <SystemSettings />
              </CardContent>
            </Card>
          </div>;
      case "profile":
        return <div className="space-y-4 p-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="text-foreground">Perfil da Empresa</CardTitle>
                <CardDescription>Configure as informações da sua empresa e administrador</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <CompanyProfile />
              </CardContent>
            </Card>
          </div>;
      default:
        return <div className="space-y-6 bg-background min-h-screen p-6">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <WelcomeGreeting />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                Ações Rápidas
              </h2>
              <QuickActionsCards onActionClick={handleActionClick} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                Estatísticas Gerais
              </h2>
              <DashboardStats />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                Visão Geral
              </h2>
              <DashboardCharts />
            </div>
          </div>;
    }
  };
  return <ProtectedRoute>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen flex flex-col w-full bg-slate-50">
          <div className="flex flex-1">
            {!isMobile && <AppSidebar activeView={activeView} onViewChange={setActiveView} onNewContract={handleNewContract} />}
            
            <SidebarInset className="flex-1 flex flex-col">
              <header className={`flex h-16 shrink-0 items-center gap-2 px-6 border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm ${isMobile ? 'pl-16' : ''}`}>
                {!isMobile && activeView !== "dashboard" && <>
                    <SidebarTrigger className="-ml-1 hover:bg-slate-100 transition-colors" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                  </>}
                <h1 className="text-xl font-semibold text-slate-800 dark:text-white flex-1">{getPageTitle()}</h1>
                <div className="flex items-center space-x-2">
                  <ThemeToggle />
                  <NotificationBell onViewAll={() => setActiveView("notifications")} />
                  <UserProfileDropdown />
                </div>
              </header>
              
              <main className="flex-1 relative bg-transparent">
                <ContractProvider editingContract={editingContract}>
                  {renderContent()}
                </ContractProvider>
              </main>
              
              <Footer />
            </SidebarInset>

            {isMobile && <AppSidebar activeView={activeView} onViewChange={setActiveView} onNewContract={handleNewContract} />}
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>;
};
const TrialContractsList = ({
  onEditContract,
  onDeleteContract
}: {
  onEditContract: (contract: any) => void;
  onDeleteContract: (contractId: string) => void;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const {
    contracts
  } = useContracts();
  const contractsWithTrial = contracts?.filter(contract => {
    const trialDays = parseInt(contract.trial_days || '0');
    return trialDays > 0;
  }) || [];
  const trialContracts = contractsWithTrial.map(contract => {
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
  
  // Paginação
  const totalItems = trialContracts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContracts = trialContracts.slice(startIndex, endIndex);

  const activeTrialContracts = trialContracts.filter(contract => !contract.isExpired);
  const expiredContracts = trialContracts.filter(contract => contract.isExpired);
  const expiringSoon = trialContracts.filter(contract => contract.daysRemaining > 0 && contract.daysRemaining <= 7);
  const handleDeleteContract = async (contractId: string) => {
    await onDeleteContract(contractId);
  };
  return <div className="space-y-6">
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
          <CardTitle className="flex items-center gap-2 text-primary">
            <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Contratos em Período de Teste
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Lista completa de contratos com período de teste configurado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trialContracts.length === 0 ? <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-primary mb-2">Nenhum contrato com período de teste</h3>
              <p className="text-muted-foreground">Não há contratos configurados com período de teste no momento.</p>
            </div> : <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número do Contrato</TableHead>
                    <TableHead>Nome do Contratante</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Período de Teste</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentContracts.map(contract => <TableRow key={contract.id}>
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
                        {contract.isExpired ? <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            ⏰ Expirado
                          </Badge> : contract.daysRemaining <= 7 ? <Badge variant="destructive" className="bg-destructive/20 text-destructive">
                            ⚠️ {contract.daysRemaining} dia{contract.daysRemaining !== 1 ? 's' : ''}
                          </Badge> : <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            ✅ {contract.daysRemaining} dia{contract.daysRemaining !== 1 ? 's' : ''}
                          </Badge>}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContract(contract.id);
                          }} 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>)}
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
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default Dashboard;