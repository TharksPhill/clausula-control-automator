import React, { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import AppSidebar from "@/components/AppSidebar";
import AdvancedProfitAnalysis from "@/components/AdvancedProfitAnalysis";
import EnhancedCompanyCosts from "@/components/EnhancedCompanyCosts";
import BankSlipManagement from "@/components/BankSlipManagement";
import TaxManagement from "@/components/TaxManagement";
import PlansManagement from "@/components/PlansManagement";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
const ProfitAnalysisPage = () => {
  const [activeView, setActiveView] = useState("profit-analysis");
  const [activeTab, setActiveTab] = useState("analise-lucro");
  const handleViewChange = (view: string) => {
    setActiveView(view);
  };
  const handleNewContract = () => {
    console.log("Novo contrato solicitado");
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeView={activeView} onViewChange={handleViewChange} onNewContract={handleNewContract} />
        <SidebarInset className="flex-1 bg-background">
          <PageHeader title="Análise de Lucros" />
          <div className="p-6 space-y-8 bg-background min-h-screen">
            {/* Header com controles */}
            <div className="flex items-center justify-between bg-gradient-to-r from-card/50 to-muted/50 p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Análise de Lucros</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Análise completa de lucros e gestão de custos operacionais</p>
                </div>
              </div>
              
              
            </div>

            {/* Tabs principais */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="analise-lucro">Análise de Lucro</TabsTrigger>
                <TabsTrigger value="custos-empresa">Custos da Empresa</TabsTrigger>
                
                <TabsTrigger value="gerenciar-planos">Gerenciar Planos</TabsTrigger>
                <TabsTrigger value="valor-boleto">Valor Boleto</TabsTrigger>
                <TabsTrigger value="gestao-impostos">Gestão de Impostos</TabsTrigger>
              </TabsList>

              <TabsContent value="analise-lucro" className="space-y-8 mt-6">
                <AdvancedProfitAnalysis />
              </TabsContent>

              <TabsContent value="custos-empresa" className="mt-6">
                <EnhancedCompanyCosts />
              </TabsContent>


              <TabsContent value="gerenciar-planos" className="mt-6">
                <PlansManagement />
              </TabsContent>

              <TabsContent value="valor-boleto" className="mt-6">
                <BankSlipManagement />
              </TabsContent>

              <TabsContent value="gestao-impostos" className="mt-6">
                <TaxManagement />
              </TabsContent>
            </Tabs>
          </div>
          <Footer />
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
export default ProfitAnalysisPage;