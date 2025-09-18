import React, { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import AppSidebar from "@/components/AppSidebar";
import FinancialSummaryView from "@/components/FinancialSummaryView";
import RendaAnalysisView from "@/components/RendaAnalysisView";
import FinancialDashboard from "@/components/FinancialDashboard";
import TaxesTable from "@/components/TaxesTable";
import ImpostosAnalysisView from "@/components/ImpostosAnalysisView";
import DespesaAnalysisView from "@/components/DespesaAnalysisView";
import AdminExpensesTable from "@/components/AdminExpensesTable";
import MerchandisePaymentTable from "@/components/MerchandisePaymentTable";
import OperationalExpensesTable from "@/components/OperationalExpensesTable";
import PersonnelExpensesTable from "@/components/PersonnelExpensesTable";
import NonOperationalTable from "@/components/NonOperationalTable";
import NonOperationalExpensesTable from "@/components/NonOperationalExpensesTable";
import GenericFinancialSection from "@/components/GenericFinancialSection";
import ManageFinancialSections from "@/components/ManageFinancialSections";
import AddFinancialSectionModal from "@/components/AddFinancialSectionModal";
import EnhancedCompanyCosts from "@/components/EnhancedCompanyCosts";
import CostPlanManagement from "@/components/CostPlanManagement";
import BankSlipManagement from "@/components/BankSlipManagement";
import TaxManagement from "@/components/TaxManagement";
import { useFinancialSections } from "@/hooks/useFinancialSections";
import type { ColorScheme } from "@/types/financial-sections";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
const FinancialAnalysisPage = () => {
  const [activeView, setActiveView] = useState("financial-analysis");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showManageSections, setShowManageSections] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [activeTab, setActiveTab] = useState("analise-financeira");
  const queryClient = useQueryClient();
  const {
    data: customSections = [],
    refetch: refetchSections
  } = useFinancialSections();
  
  // Recarregar dados quando o ano mudar
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['financial-summary', selectedYear] });
    queryClient.invalidateQueries({ queryKey: ['monthly-financial-costs'] });
    queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
  }, [selectedYear, queryClient]);
  const handleViewChange = (view: string) => {
    setActiveView(view);
  };
  const handleNewContract = () => {
    console.log("Novo contrato solicitado");
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">`
        <AppSidebar activeView={activeView} onViewChange={handleViewChange} onNewContract={handleNewContract} />
        <SidebarInset className="flex-1 bg-background">
          <PageHeader title="Análise Financeira" />
          <div className="p-6 space-y-8 bg-background min-h-screen">
            {/* Header com controles */}
            <div className="flex items-center justify-between bg-gradient-to-r from-card/50 to-muted/50 p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Análise Financeira</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Gerencie suas seções personalizadas de análise financeira</p>
                </div>
                
                {/* Seletor de Ano */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ano:</label>
                  <Select value={selectedYear.toString()} onValueChange={value => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({
                      length: 5
                    }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>;
                    })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <RefreshDataButton />
                {activeTab === "analise-financeira" && <>
                    <Button variant="outline" onClick={() => setShowManageSections(true)} className="bg-background">
                      <Settings className="h-4 w-4 mr-2" />
                      Gerenciar Seções
                    </Button>
                    <Button onClick={() => setShowAddSection(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Seção
                    </Button>
                  </>}
              </div>
            </div>

            {/* Tabs principais */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              

              <TabsContent value="analise-financeira" className="space-y-8 mt-6">
                {/* Dashboard de Desempenho */}
                <FinancialDashboard selectedYear={selectedYear} onYearChange={setSelectedYear} />
                
                {/* Seções fixas existentes */}
                <RendaAnalysisView selectedYear={selectedYear} />
                <ImpostosAnalysisView selectedYear={selectedYear} />
                <DespesaAnalysisView selectedYear={selectedYear} />
                
                {/* Seções personalizadas criadas pelo usuário */}
                {customSections.map(section => <GenericFinancialSection key={section.id} sectionId={section.id} title={section.name} colorScheme={section.color_scheme as ColorScheme} selectedYear={selectedYear} />)}
                <FinancialSummaryView selectedYear={selectedYear} />
              </TabsContent>
            </Tabs>
          </div>
          <Footer />
        </SidebarInset>
      </div>

      {/* Modais */}
      <ManageFinancialSections isOpen={showManageSections} onClose={() => setShowManageSections(false)} />

      <AddFinancialSectionModal isOpen={showAddSection} onClose={() => setShowAddSection(false)} />
    </SidebarProvider>;
};
export default FinancialAnalysisPage;