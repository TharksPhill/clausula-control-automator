import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Users, Wrench } from "lucide-react";
import TechnicalVisitServicesList from "@/components/TechnicalVisitServicesList";
import TechnicalVisitServiceModal from "@/components/TechnicalVisitServiceModal";
import EmployeeCosts from "@/components/EmployeeCosts";
const TechnicalVisitServicesManagement = () => {
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  return <div className="bg-card/50 border rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Gestão de Serviços</h3>
        <p className="text-sm text-muted-foreground">
          Configure serviços e funcionários para cálculo de visitas técnicas
        </p>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Funcionários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Serviços Adicionais</h1>
                <p className="text-gray-600 dark:text-gray-300">Gerencie serviços extras oferecidos durante visitas técnicas</p>
              </div>
            </div>
            <Button onClick={() => {
            setEditingServiceId(null);
            setIsServiceModalOpen(true);
          }} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Serviço
            </Button>
          </div>
          
          <TechnicalVisitServicesList onEdit={id => {
          setEditingServiceId(id);
          setIsServiceModalOpen(true);
        }} />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4 mt-6">
          
          
          <EmployeeCosts />
        </TabsContent>
      </Tabs>

      <TechnicalVisitServiceModal isOpen={isServiceModalOpen} onClose={() => {
      setIsServiceModalOpen(false);
      setEditingServiceId(null);
    }} editingId={editingServiceId} />
    </div>;
};
export default TechnicalVisitServicesManagement;