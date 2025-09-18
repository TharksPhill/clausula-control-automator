
import React, { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import TaxManagement from "@/components/TaxManagement";
import PageHeader from "@/components/PageHeader";

const TaxManagementPage = () => {
  const [activeView, setActiveView] = useState("tax-management");

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const handleNewContract = () => {
    console.log("Novo contrato solicitado");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          activeView={activeView}
          onViewChange={handleViewChange}
          onNewContract={handleNewContract}
        />
        <SidebarInset className="flex-1">
          <PageHeader title="Gestão de Impostos" />
          <div className="p-6">
            <TaxManagement />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default TaxManagementPage;
