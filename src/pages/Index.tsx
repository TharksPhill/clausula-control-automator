
import { useState } from "react";
import { Link } from "react-router-dom";
import { ContractProvider } from "@/context/ContractContext";
import ContractForm from "@/components/ContractForm";
import ContractPreview from "@/components/ContractPreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

const Index = () => {
  const [activeView, setActiveView] = useState<string>("form");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-contract text-white py-6">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gerador de Contratos</h1>
            <p className="text-contract-light mt-2">Automatize a criação dos seus contratos com múltiplos contratantes</p>
          </div>
          <div className="flex gap-3">
            <Link to="/auth">
              <Button variant="secondary" className="flex items-center gap-2">
                Fazer Login
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 flex-1">
        <ContractProvider>
          <div className="md:hidden mb-6">
            <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="form">Formulário</TabsTrigger>
                <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
              </TabsList>
              <TabsContent value="form" className="mt-4">
                <ContractForm />
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                <ContractPreview />
              </TabsContent>
            </Tabs>
          </div>

          <div className="hidden md:flex md:flex-col lg:grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <ContractForm />
            </div>
            <div className="lg:col-span-3">
              <ContractPreview />
            </div>
          </div>
        </ContractProvider>
      </main>
    </div>
  );
};

export default Index;
