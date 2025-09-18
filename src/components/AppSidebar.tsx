import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Bell, FileText, Home, Package, Plus, Settings, Shield, User, AlertTriangle, ChevronRight, ChevronDown, Menu, MapPin, Globe, DollarSign, PenTool, Clock, TrendingUp, Map, RefreshCw, Receipt, ShoppingCart, Calculator } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useContracts } from "@/hooks/useContracts";
import { useIsMobile } from "@/hooks/use-mobile";
interface AppSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewContract: () => void;
}
const AppSidebar = ({
  activeView,
  onViewChange,
  onNewContract
}: AppSidebarProps) => {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(["contracts"]));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [terminateStats, setTerminateStats] = useState(0);
  const {
    toggleSidebar,
    state
  } = useSidebar();
  const {
    contracts
  } = useContracts();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";
  const mapStats = React.useMemo(() => {
    if (!contracts) return {
      totalStates: 0,
      totalCities: 0,
      totalContracts: 0
    };
    const statesSet = new Set<string>();
    const citiesSet = new Set<string>();
    let totalContracts = 0;
    contracts.forEach(contract => {
      if (contract.contractors) {
        contract.contractors.forEach((contractor: any) => {
          if (contractor.state) statesSet.add(contractor.state);
          if (contractor.city) citiesSet.add(contractor.city);
          totalContracts++;
        });
      }
    });
    return {
      totalStates: statesSet.size,
      totalCities: citiesSet.size,
      totalContracts
    };
  }, [contracts]);
  const billingStats = React.useMemo(() => {
    if (!contracts) return {
      totalRevenue: 0,
      activeContracts: 0
    };
    const activeContracts = contracts.filter(c => c.status !== "Inativo");
    const totalRevenue = activeContracts.reduce((sum, contract) => {
      return sum + parseFloat(contract.monthly_value || '0') * 12;
    }, 0);
    return {
      totalRevenue,
      activeContracts: activeContracts.length
    };
  }, [contracts]);
  const signatureStats = React.useMemo(() => {
    if (!contracts) return {
      pendingSignatures: 0,
      totalSignatures: 0
    };
    let pendingSignatures = 0;
    let totalSignatures = 0;
    contracts.forEach(contract => {
      if (contract.signed_contracts && contract.signed_contracts.length > 0) {
        totalSignatures += contract.signed_contracts.length;
      } else {
        pendingSignatures++;
      }
    });
    return {
      pendingSignatures,
      totalSignatures
    };
  }, [contracts]);
  const trialStats = React.useMemo(() => {
    if (!contracts) return {
      trialContracts: 0,
      expiringSoon: 0
    };
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let trialContracts = 0;
    let expiringSoon = 0;
    contracts.forEach(contract => {
      if (contract.status === "Período de Teste") {
        trialContracts++;
        if (contract.end_date) {
          const endDate = new Date(contract.end_date);
          if (endDate <= sevenDaysFromNow && endDate >= now) {
            expiringSoon++;
          }
        }
      }
    });
    return {
      trialContracts,
      expiringSoon
    };
  }, [contracts]);
  const renewalStats = React.useMemo(() => {
    if (!contracts) return {
      renewalsNeeded: 0,
      expiringSoon: 0
    };
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let renewalsNeeded = 0;
    let expiringSoon = 0;
    contracts.forEach(contract => {
      if (contract.renewal_date && contract.status === "Ativo") {
        let renewalDate: Date | null = null;
        if (contract.renewal_date.includes('-')) {
          renewalDate = new Date(contract.renewal_date);
        } else if (contract.renewal_date.includes('/')) {
          const parts = contract.renewal_date.split('/');
          if (parts.length === 3) {
            renewalDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
        if (renewalDate && !isNaN(renewalDate.getTime())) {
          if (renewalDate <= thirtyDaysFromNow && renewalDate >= now) {
            renewalsNeeded++;
            if (renewalDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
              expiringSoon++;
            }
          }
        }
      }
    });
    return {
      renewalsNeeded,
      expiringSoon
    };
  }, [contracts]);
  
  // Calcular contratos que podem ser encerrados
  useEffect(() => {
    if (!contracts) return;
    const terminableContracts = contracts.filter(contract => 
      contract.status === 'Ativo' || contract.status === 'Revisado'
    );
    setTerminateStats(terminableContracts.length);
  }, [contracts]);
  
  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => {
      const newExpanded = new Set<string>();

      // Se o menu clicado já está expandido, recolhe tudo
      if (prev.has(menuKey)) {
        return newExpanded; // Set vazio - todos os menus fechados
      } else {
        // Se não, abre apenas o menu clicado
        newExpanded.add(menuKey);
        return newExpanded;
      }
    });
  };
  const handleNavigation = (view: string) => {
    console.log("🔄 Navegando para:", view);
    if (isMobile) {
      setMobileOpen(false);
    }
    const routeViews = {
      'dashboard': '/dashboard',
      'contracts': '/dashboard',  // Adiciona a rota para lista de contratos
      'contract-signatures': '/contract-signatures',
      'contract-adjustments': '/contract-adjustments',
      'quote-generator': '/quote-generator',
      'tax-management': '/tax-management',
      'financial-analysis': '/financial-analysis',
      'profit-analysis': '/profit-analysis',
      'technical-visit-calculator': '/technical-visit-calculator',
      'technical-visit-configuration': '/technical-visit-calculator?tab=configuracao',
      'technical-visit-vehicles': '/technical-visit-calculator?tab=veiculos',
      'technical-visit-services': '/technical-visit-calculator?tab=configuracao#services',
      'market-segmentation': '/market-segmentation'
    };
    if (view in routeViews) {
      const targetRoute = routeViews[view as keyof typeof routeViews];
      console.log("📍 Navegando para rota:", targetRoute);
      
      // Para contratos, navega para dashboard e define a view
      if (view === 'contracts') {
        navigate('/dashboard');
        onViewChange('contracts');
      } else if (view === 'dashboard') {
        console.log("🏠 Resetando para dashboard");
        onViewChange('dashboard');
        navigate(targetRoute, {
          replace: false
        });
      } else {
        navigate(targetRoute);
      }
    } else {
      console.log("🎯 Mudando view para:", view);
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
        setTimeout(() => {
          onViewChange(view);
        }, 100);
      } else {
        onViewChange(view);
      }
    }
  };
  const isActive = (view: string) => {
    const routeViews = {
      'dashboard': '/dashboard',
      'contracts': '/dashboard',  // Adiciona para lista de contratos
      'contract-signatures': '/contract-signatures',
      'quote-generator': '/quote-generator',
      'tax-management': '/tax-management',
      'financial-analysis': '/financial-analysis',
      'profit-analysis': '/profit-analysis',
      'technical-visit-calculator': '/technical-visit-calculator',
      'technical-visit-configuration': '/technical-visit-calculator?tab=configuracao',
      'technical-visit-vehicles': '/technical-visit-calculator?tab=veiculos',
      'technical-visit-services': '/technical-visit-calculator?tab=configuracao#services'
    };
    if (view in routeViews) {
      const targetRoute = routeViews[view as keyof typeof routeViews];
      // Para contratos, verificar se estamos no dashboard e a view está ativa
      if (view === 'contracts') {
        return location.pathname === '/dashboard' && activeView === 'contracts';
      }
      return location.pathname === targetRoute || view === 'dashboard' && location.pathname === '/';
    }
    return activeView === view;
  };
  // Manter o grupo correspondente aberto baseado na rota ativa
  useEffect(() => {
    const financialActive =
      isActive('financial-analysis') ||
      isActive('profit-analysis') ||
      isActive('billing');

    const contractsActive =
      isActive('contracts') ||
      isActive('create') ||
      isActive('trial-contracts') ||
      isActive('plan-changes') ||
      isActive('contract-adjustments') ||
      isActive('contract-signatures') ||
      isActive('rejection-review') ||
      isActive('contract-renewals') ||
      isActive('terminate-contracts');

    const nextExpanded = new Set<string>();
    if (financialActive) {
      nextExpanded.add('financial');
    } else if (contractsActive) {
      nextExpanded.add('contracts');
    }
    setExpandedMenus(nextExpanded);
  }, [location.pathname]);

  const menuItemClass = (view: string) => `
    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 w-full text-left justify-start bg-transparent
    ${isCollapsed ? 'px-2' : ''}
    ${isActive(view) ? "text-white" : "text-white dark:text-gray-300 hover:text-blue-100 dark:hover:text-white hover:bg-transparent"}
  `;
  const subMenuItemClass = (view: string) => `
    flex items-center gap-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 w-full text-left justify-start bg-transparent
    ${isActive(view) ? "text-white" : "text-blue-100 dark:text-gray-400 hover:text-white hover:bg-transparent"}
  `;
  const expandableMenuClass = (hasActiveChild: boolean) => `
    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 w-full text-left justify-start bg-transparent
    ${isCollapsed ? 'px-2' : ''}
    ${hasActiveChild ? "text-white" : "text-white dark:text-gray-300 hover:text-blue-100 dark:hover:text-white hover:bg-transparent"}
  `;
  const SidebarContentComponent = () => <div className={`bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 dark:from-gray-800 dark:via-gray-900 dark:to-gray-950 border-r border-blue-600 dark:border-gray-700 h-full min-h-screen flex flex-col overflow-y-auto transition-all duration-300 relative ${isCollapsed && !isMobile ? 'w-16' : 'w-80'}`}>
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 text-white border-0 shadow-lg flex-shrink-0">
        <div className="p-4">
          <div className={`flex items-center gap-3 w-full text-left hover:bg-white/20 rounded-lg p-3 transition-all duration-200 backdrop-blur-sm ${isCollapsed && !isMobile ? 'justify-center' : ''}`}>
            {(!isCollapsed || isMobile) && <div className="w-10 h-10 bg-white/25 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-lg cursor-pointer" onClick={() => handleNavigation("dashboard")}>
                <FileText className="size-6 text-white" />
              </div>}
            {(!isCollapsed || isMobile) && <div className="grid flex-1 text-left text-sm leading-tight cursor-pointer" onClick={() => handleNavigation("dashboard")}>
                <span className="truncate font-bold text-lg text-white">ContractPRO</span>
                <span className="truncate text-xs text-blue-100 dark:text-gray-300">Gestão de Contratos</span>
              </div>}
            
            {!isMobile && <Button variant="ghost" size="sm" onClick={toggleSidebar} className={`w-8 h-8 p-0 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 ${isCollapsed ? 'mx-auto' : 'ml-auto'}`}>
                <Menu className="h-4 w-4" />
              </Button>}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 dark:from-gray-800 dark:via-gray-900 dark:to-gray-950 p-3 flex-1 flex flex-col">
        {(!isCollapsed || isMobile) && <div className="px-2 py-2">
            <p className="text-xs font-semibold text-blue-200 dark:text-gray-400 uppercase tracking-wider mb-3">Menu Principal</p>
          </div>}
        
        <div className="px-1 flex-1">
          <div className="space-y-1 p-2">
            <Button variant="ghost" className={menuItemClass("dashboard")} onClick={() => handleNavigation("dashboard")} title={isCollapsed && !isMobile ? "Dashboard" : undefined}>
              <Home className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && <span>Dashboard</span>}
            </Button>

            <div className={`transition-all duration-1000 ease-in-out ${expandedMenus.has("contracts") ? "bg-blue-800/30 dark:bg-gray-700/30 rounded-lg backdrop-blur-sm" : ""}`}>
              <Button variant="ghost" className={expandableMenuClass(isActive("contracts") || isActive("create") || isActive("trial-contracts") || isActive("plan-changes") || isActive("contract-signatures") || isActive("rejection-review") || isActive("contract-renewals"))} onClick={() => toggleMenu("contracts")} title={isCollapsed && !isMobile ? "Contratos" : undefined}>
                <FileText className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && <span className="flex-1 text-left">Contratos</span>}
                {(!isCollapsed || isMobile) && <div className={`flex-shrink-0 transition-transform duration-1000 ease-in-out ${expandedMenus.has("contracts") ? "rotate-90" : ""}`}>
                    <ChevronRight className="size-4" />
                  </div>}
              </Button>
              
              <div className={`overflow-hidden transition-all duration-1000 ease-in-out ${expandedMenus.has("contracts") && (!isCollapsed || isMobile) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="space-y-1 p-2 ml-2">
                  <Button onClick={() => handleNavigation("contracts")} variant="ghost" className={subMenuItemClass("contracts")}>
                    <div className="w-1 h-1 bg-blue-300 dark:bg-gray-400 rounded-full flex-shrink-0" />
                    <span>Listar Contratos</span>
                  </Button>
                  
                  <Button onClick={onNewContract} variant="ghost" className={subMenuItemClass("create")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span>Criar Contrato</span>
                  </Button>


                  <Button onClick={() => handleNavigation("trial-contracts")} variant="ghost" className={subMenuItemClass("trial-contracts")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Período de Teste</span>
                    {trialStats.trialContracts > 0 && <div className="flex gap-1">
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-100 text-xs px-2 py-0.5">
                          {trialStats.trialContracts}
                        </Badge>
                        {trialStats.expiringSoon > 0 && <Badge variant="secondary" className="bg-red-500/20 text-red-100 text-xs px-1 py-0.5">
                            !
                          </Badge>}
                      </div>}
                  </Button>

                  <Button onClick={() => handleNavigation("plan-changes")} variant="ghost" className={subMenuItemClass("plan-changes")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Mudanças de Planos</span>
                  </Button>

                  <Button onClick={() => handleNavigation("contract-adjustments")} variant="ghost" className={subMenuItemClass("contract-adjustments")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Reajustes Contratos</span>
                  </Button>

                  <Button onClick={() => handleNavigation("contract-signatures")} variant="ghost" className={subMenuItemClass("contract-signatures")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Assinaturas</span>
                    {signatureStats.pendingSignatures > 0 && <Badge variant="secondary" className="bg-orange-500/20 text-orange-100 text-xs px-2 py-0.5">
                        {signatureStats.pendingSignatures}
                      </Badge>}
                  </Button>

                  <Button onClick={() => handleNavigation("terminate-contracts")} variant="ghost" className={subMenuItemClass("terminate-contracts")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Encerrar Contrato</span>
                    {terminateStats > 0 && <Badge variant="secondary" className="bg-red-500/20 text-red-100 text-xs px-2 py-0.5">
                        {terminateStats}
                      </Badge>}
                  </Button>

                </div>
              </div>
            </div>

            <div className={`transition-all duration-1000 ease-in-out ${expandedMenus.has("financial") ? "bg-blue-800/30 dark:bg-gray-700/30 rounded-lg backdrop-blur-sm" : ""}`}>
              <Button variant="ghost" className={expandableMenuClass(isActive("billing") || isActive("profit-analysis") || isActive("profit-analysis") || isActive("financial-analysis"))} onClick={() => toggleMenu("financial")} title={isCollapsed && !isMobile ? "Financeiro" : undefined}>
                <DollarSign className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && <span className="flex-1 text-left">Financeiro</span>}
                {(!isCollapsed || isMobile) && <div className={`flex-shrink-0 transition-transform duration-1000 ease-in-out ${expandedMenus.has("financial") ? "rotate-90" : ""}`}>
                    <ChevronRight className="size-4" />
                  </div>}
              </Button>
              
              <div className={`overflow-hidden transition-all duration-1000 ease-in-out ${expandedMenus.has("financial") && (!isCollapsed || isMobile) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="space-y-1 p-2 ml-2">
                  <Button onClick={() => handleNavigation("billing")} variant="ghost" className={subMenuItemClass("billing")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Faturamento</span>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-100 text-xs px-2 py-0.5">
                      {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      notation: 'compact'
                    }).format(billingStats.totalRevenue)}
                    </Badge>
                  </Button>


                  <Button onClick={() => handleNavigation("profit-analysis")} variant="ghost" className={subMenuItemClass("profit-analysis")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Análise de Lucros</span>
                    <TrendingUp className="h-4 w-4 flex-shrink-0" />
                  </Button>

                  <Button onClick={() => handleNavigation("financial-analysis")} variant="ghost" className={subMenuItemClass("financial-analysis")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Fluxo de Caixa</span>
                    <BarChart3 className="h-4 w-4 flex-shrink-0" />
                  </Button>
                </div>
              </div>
            </div>

            <div className={`transition-all duration-1000 ease-in-out ${expandedMenus.has("technical-visit") ? "bg-blue-800/30 dark:bg-gray-700/30 rounded-lg backdrop-blur-sm" : ""}`}>
              <Button variant="ghost" className={expandableMenuClass(isActive("technical-visit-calculator") || isActive("technical-visit-configuration") || isActive("technical-visit-vehicles") || isActive("technical-visit-services"))} onClick={() => toggleMenu("technical-visit")} title={isCollapsed && !isMobile ? "Cálculo Visita Técnica" : undefined}>
                <Calculator className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && <span className="flex-1 text-left">Cálculo Visita Técnica</span>}
                {(!isCollapsed || isMobile) && <div className={`flex-shrink-0 transition-transform duration-1000 ease-in-out ${expandedMenus.has("technical-visit") ? "rotate-90" : ""}`}>
                    <ChevronRight className="size-4" />
                  </div>}
              </Button>
              
              <div className={`overflow-hidden transition-all duration-1000 ease-in-out ${expandedMenus.has("technical-visit") && (!isCollapsed || isMobile) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="space-y-1 p-2 ml-2">
                  

                  <Button onClick={() => handleNavigation("technical-visit-vehicles")} variant="ghost" className={subMenuItemClass("technical-visit-vehicles")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span>Veículos</span>
                  </Button>

                  <Button onClick={() => handleNavigation("technical-visit-services")} variant="ghost" className={subMenuItemClass("technical-visit-services")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span>Serviços</span>
                  </Button>
                  
                  <Button onClick={() => handleNavigation("technical-visit-calculator")} variant="ghost" className={subMenuItemClass("technical-visit-calculator")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span>Calcular</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className={`transition-all duration-1000 ease-in-out ${expandedMenus.has("products") ? "bg-blue-800/30 dark:bg-gray-700/30 rounded-lg backdrop-blur-sm" : ""}`}>
              <Button variant="ghost" className={expandableMenuClass(isActive("product-registration") || isActive("product-profit-analysis"))} onClick={() => toggleMenu("products")} title={isCollapsed && !isMobile ? "Gestão de Custos de Produtos" : undefined}>
                <ShoppingCart className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && <span className="flex-1 text-left">Gestão de Custos de Produtos</span>}
                {(!isCollapsed || isMobile) && <div className={`flex-shrink-0 transition-transform duration-1000 ease-in-out ${expandedMenus.has("products") ? "rotate-90" : ""}`}>
                    <ChevronRight className="size-4" />
                  </div>}
              </Button>
              
              <div className={`overflow-hidden transition-all duration-1000 ease-in-out ${expandedMenus.has("products") && (!isCollapsed || isMobile) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="space-y-1 p-2 ml-2">
                  <Button onClick={() => handleNavigation("product-registration")} variant="ghost" className={subMenuItemClass("product-registration")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Cadastro de Produtos</span>
                  </Button>

                  <Button onClick={() => handleNavigation("product-profit-analysis")} variant="ghost" className={subMenuItemClass("product-profit-analysis")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Análise de Lucros de Produtos (DRE)</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className={`transition-all duration-1000 ease-in-out ${expandedMenus.has("geographic") ? "bg-blue-800/30 dark:bg-gray-700/30 rounded-lg backdrop-blur-sm" : ""}`}>
              <Button variant="ghost" className={expandableMenuClass(isActive("brazil-map") || isActive("regional-analysis") || isActive("geographic-statistics") || isActive("market-segmentation"))} onClick={() => toggleMenu("geographic")} title={isCollapsed && !isMobile ? "Análises Geográficas" : undefined}>
                <Globe className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && <span className="flex-1 text-left">Análises Geográficas</span>}
                {(!isCollapsed || isMobile) && <div className={`flex-shrink-0 transition-transform duration-1000 ease-in-out ${expandedMenus.has("geographic") ? "rotate-90" : ""}`}>
                    <ChevronRight className="size-4" />
                  </div>}
              </Button>
              
              <div className={`overflow-hidden transition-all duration-1000 ease-in-out ${expandedMenus.has("geographic") && (!isCollapsed || isMobile) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="space-y-1 p-2 ml-2">
                  <Button onClick={() => handleNavigation("brazil-map")} variant="ghost" className={subMenuItemClass("brazil-map")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Mapa do Brasil</span>
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100 text-xs px-2 py-0.5">
                      {mapStats.totalContracts}
                    </Badge>
                  </Button>

                  <Button onClick={() => handleNavigation("regional-analysis")} variant="ghost" className={subMenuItemClass("regional-analysis")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Análise Regional</span>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-100 text-xs px-2 py-0.5">
                      {mapStats.totalStates}
                    </Badge>
                  </Button>

                  <Button onClick={() => handleNavigation("geographic-statistics")} variant="ghost" className={subMenuItemClass("geographic-statistics")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Estatísticas Geográficas</span>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-100 text-xs px-2 py-0.5">
                      {mapStats.totalCities}
                    </Badge>
                  </Button>

                  <Button onClick={() => handleNavigation("market-segmentation")} variant="ghost" className={subMenuItemClass("market-segmentation")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span className="flex-1 text-left">Segmentação</span>
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-100 text-xs px-2 py-0.5">
                      novo
                    </Badge>
                  </Button>
                </div>
              </div>
            </div>

            <div className={`transition-all duration-1000 ease-in-out ${expandedMenus.has("management") ? "bg-blue-800/30 dark:bg-gray-700/30 rounded-lg backdrop-blur-sm" : ""}`}>
              <Button variant="ghost" className={expandableMenuClass(isActive("plans-management") || isActive("admin-management") || isActive("statistics"))} onClick={() => toggleMenu("management")} title={isCollapsed && !isMobile ? "Gestão & Administração" : undefined}>
                <Package className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && <span className="flex-1 text-left">Gestão & Administração</span>}
                {(!isCollapsed || isMobile) && <div className={`flex-shrink-0 transition-transform duration-1000 ease-in-out ${expandedMenus.has("management") ? "rotate-90" : ""}`}>
                    <ChevronRight className="size-4" />
                  </div>}
              </Button>
              
              <div className={`overflow-hidden transition-all duration-1000 ease-in-out ${expandedMenus.has("management") && (!isCollapsed || isMobile) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="space-y-1 p-2 ml-2">
                  <Button onClick={() => handleNavigation("plans-management")} variant="ghost" className={subMenuItemClass("plans-management")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span>Gerenciar Planos</span>
                  </Button>
                  
                  <Button onClick={() => handleNavigation("admin-management")} variant="ghost" className={subMenuItemClass("admin-management")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span>Administradores</span>
                  </Button>

                  <Button onClick={() => handleNavigation("statistics")} variant="ghost" className={subMenuItemClass("statistics")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span>Estatísticas</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className={`transition-all duration-1000 ease-in-out ${expandedMenus.has("communication") ? "bg-blue-800/30 dark:bg-gray-700/30 rounded-lg backdrop-blur-sm" : ""}`}>
              <Button variant="ghost" className={expandableMenuClass(isActive("chat-management") || isActive("notifications"))} onClick={() => toggleMenu("communication")} title={isCollapsed && !isMobile ? "Comunicação & Suporte" : undefined}>
                <Bell className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && <span className="flex-1 text-left">Comunicação & Suporte</span>}
                {(!isCollapsed || isMobile) && <div className={`flex-shrink-0 transition-transform duration-1000 ease-in-out ${expandedMenus.has("communication") ? "rotate-90" : ""}`}>
                    <ChevronRight className="size-4" />
                  </div>}
              </Button>
              
              <div className={`overflow-hidden transition-all duration-1000 ease-in-out ${expandedMenus.has("communication") && (!isCollapsed || isMobile) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="space-y-1 p-2 ml-2">
                  <Button onClick={() => handleNavigation("chat-management")} variant="ghost" className={subMenuItemClass("chat-management")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span>Chat Inteligente</span>
                  </Button>

                  <Button onClick={() => handleNavigation("notifications")} variant="ghost" className={subMenuItemClass("notifications")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span>Notificações</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className={`transition-all duration-1000 ease-in-out ${expandedMenus.has("settings") ? "bg-blue-800/30 dark:bg-gray-700/30 rounded-lg backdrop-blur-sm" : ""}`}>
              <Button variant="ghost" className={expandableMenuClass(isActive("profile") || isActive("system-settings"))} onClick={() => toggleMenu("settings")} title={isCollapsed && !isMobile ? "Configurações" : undefined}>
                <Settings className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && <span className="flex-1 text-left">Configurações</span>}
                {(!isCollapsed || isMobile) && <div className={`flex-shrink-0 transition-transform duration-1000 ease-in-out ${expandedMenus.has("settings") ? "rotate-90" : ""}`}>
                    <ChevronRight className="size-4" />
                  </div>}
              </Button>
              
              <div className={`overflow-hidden transition-all duration-1000 ease-in-out ${expandedMenus.has("settings") && (!isCollapsed || isMobile) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="space-y-1 p-2 ml-2">
                  <Button onClick={() => handleNavigation("profile")} variant="ghost" className={subMenuItemClass("profile")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span>Perfil da Empresa</span>
                  </Button>

                  <Button onClick={() => handleNavigation("system-settings")} variant="ghost" className={subMenuItemClass("system-settings")}>
                    <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
                    <span>Configurações do Sistema</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-b from-blue-800 to-blue-900 dark:from-gray-900 dark:to-gray-950 border-t border-blue-600 dark:border-gray-700 flex-shrink-0">
        <div className="p-4 text-center">
          {!isCollapsed || isMobile ? <p className="text-xs text-blue-200 dark:text-gray-400">
              &copy; {new Date().getFullYear()} - Todos os direitos reservados
            </p> : <div className="flex justify-center">
              <span className="text-xs text-blue-200 dark:text-gray-400 transform -rotate-90 whitespace-nowrap">
                &copy; {new Date().getFullYear()}
              </span>
            </div>}
        </div>
      </div>
    </div>;
  if (isMobile) {
    return <>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 dark:bg-gray-700 hover:bg-blue-700 dark:hover:bg-gray-600 text-white shadow-lg">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SidebarContentComponent />
          </SheetContent>
        </Sheet>
      </>;
  }
  return <SidebarContentComponent />;
};
export default AppSidebar;