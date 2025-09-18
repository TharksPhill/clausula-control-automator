import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import AppSidebar from "@/components/AppSidebar";
import TechnicalVisitCalculatorWrapper from "@/components/TechnicalVisitCalculatorWrapper";
import TechnicalVisitSettingsModal from "@/components/TechnicalVisitSettingsModal";
import VehicleSettingsModal from "@/components/VehicleSettingsModal";
import TechnicalVisitSettingsList from "@/components/TechnicalVisitSettingsList";
import VehicleSettingsList from "@/components/VehicleSettingsList";
import TechnicalVisitServicesManagement from "@/components/TechnicalVisitServicesManagement";
import { Button } from "@/components/ui/button";
import { Settings, Car } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const TechnicalVisitCalculatorPage = () => {
  const [activeView, setActiveView] = useState("technical-visit");
  const [isTechnicalVisitModalOpen, setIsTechnicalVisitModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingTechnicalVisitId, setEditingTechnicalVisitId] = useState<string | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchParams] = useSearchParams();

  // Determinar qual seção mostrar baseado na URL
  const tab = searchParams.get('tab');
  const hash = window.location.hash;
  
  const currentSection = () => {
    if (tab === 'veiculos') return 'vehicles';
    if (tab === 'configuracao' && hash === '#services') return 'services';
    return 'calculator'; // default
  };

  useEffect(() => {
    // Se estiver na seção de serviços, fazer scroll para a seção
    if (currentSection() === 'services') {
      setTimeout(() => {
        const servicesSection = document.querySelector('[data-section="services"]');
        if (servicesSection) {
          servicesSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }
  }, [searchParams]);

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const handleNewContract = () => {
    console.log("Novo contrato solicitado");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeView={activeView} onViewChange={handleViewChange} onNewContract={handleNewContract} />
        <SidebarInset className="flex-1 bg-background">
          <PageHeader 
            title={
              currentSection() === 'calculator' ? 'Cálculo de Visita Técnica' :
              currentSection() === 'vehicles' ? 'Gerenciamento de Veículos' :
              'Gerenciamento de Serviços'
            }
          />
          <div className="p-6 space-y-8 bg-background min-h-screen">
            {/* Header dinâmico baseado na seção */}
            <div className="flex items-center justify-between bg-gradient-to-r from-card/50 to-muted/50 p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {currentSection() === 'calculator' && 'Configure e calcule custos de visitas técnicas'}
                    {currentSection() === 'vehicles' && 'Configure os veículos para cálculo de visitas técnicas'}
                    {currentSection() === 'services' && 'Configure os serviços de visita técnica'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {currentSection() === 'vehicles' && (
                  <Button 
                    onClick={() => setIsVehicleModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Car className="mr-2 h-4 w-4" />
                    Novo Veículo
                  </Button>
                )}
                {currentSection() === 'services' && (
                  <Button 
                    onClick={() => setIsTechnicalVisitModalOpen(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Nova Configuração
                  </Button>
                )}
                <RefreshDataButton />
              </div>
            </div>

            {/* Conteúdo específico baseado na seção */}
            <div className="mt-6">
              {currentSection() === 'calculator' && (
                <TechnicalVisitCalculatorWrapper />
              )}

              {currentSection() === 'vehicles' && (
                <VehicleSettingsList 
                  key={refreshKey}
                  onEdit={(id) => {
                    setEditingVehicleId(id);
                    setIsVehicleModalOpen(true);
                  }}
                />
              )}

              {currentSection() === 'services' && (
                <div data-section="services" className="space-y-4">
                  <TechnicalVisitServicesManagement />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Configurações de Visita Técnica</h3>
                    <TechnicalVisitSettingsList
                      onEdit={(id) => {
                        setEditingTechnicalVisitId(id);
                        setIsTechnicalVisitModalOpen(true);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <Footer />
        </SidebarInset>
      </div>

      {/* Modais */}
      <TechnicalVisitSettingsModal 
        isOpen={isTechnicalVisitModalOpen} 
        onClose={() => {
          setIsTechnicalVisitModalOpen(false);
          setEditingTechnicalVisitId(null);
        }} 
        editingId={editingTechnicalVisitId} 
      />

      <VehicleSettingsModal 
        isOpen={isVehicleModalOpen} 
        onClose={() => {
          setIsVehicleModalOpen(false);
          setEditingVehicleId(null);
        }} 
        editingId={editingVehicleId} 
        onSave={() => {
          setRefreshKey(prev => prev + 1);
        }} 
      />
    </SidebarProvider>
  );
};

export default TechnicalVisitCalculatorPage;