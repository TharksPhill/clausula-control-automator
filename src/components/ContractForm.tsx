import React, { useState, useEffect, useRef } from "react";
import { useContract } from "@/context/ContractContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Loader2, RefreshCw, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useContracts } from "@/hooks/useContracts";
import { useContractLock } from "@/hooks/useContractLock";
import { useContractSteps } from "@/hooks/useContractSteps";
import { useFormPreviewSync } from "@/hooks/useFormPreviewSync";
import ContractStepsBar from "./contract-form/ContractStepsBar";
import ContractorList from "./contract-form/ContractorList";
import ResponsibleList from "./contract-form/ResponsibleList";
import ServiceClauses from "./contract-form/ServiceClauses";
import PaymentInfo from "./contract-form/PaymentInfo";
import TechnicalVisitSection from "./contract-form/TechnicalVisitSection";

interface ContractFormProps {
  editingContract?: any;
  onContractSaved?: () => void;
}
const ContractForm = ({
  editingContract,
  onContractSaved
}: ContractFormProps) => {
  const {
    contractData,
    updateContractData,
    setActiveClauseId,
    loadContractData
  } = useContract();
  const {
    toast
  } = useToast();
  const {
    saveContract,
    updateContract,
    generateNextContractNumber
  } = useContracts();
  const {
    isLocked,
    loading: lockLoading
  } = useContractLock(editingContract?.id);
  const {
    steps,
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    canProceedToNext,
    allStepsCompleted
  } = useContractSteps();
  const { syncToPreview, createFieldHandler } = useFormPreviewSync();
  const [saving, setSaving] = useState(false);
  const [generatingNumber, setGeneratingNumber] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const editingContractRef = useRef(editingContract);

  // Update ref when editingContract changes
  useEffect(() => {
    editingContractRef.current = editingContract;
  }, [editingContract]);

  // Initialize contract data
  useEffect(() => {
    if (editingContract && !initialized) {
      console.log("🔄 CONTRACTFORM: Inicializando dados para edição:", editingContract);
      console.log("🔄 CONTRACTFORM: Dados completos do editingContract:", JSON.stringify(editingContract, null, 2));
      setIsEditing(true);

      // Usar a função loadContractData do contexto que já funciona
      loadContractData(editingContract);
      setInitialized(true);
    } else if (!editingContract && !initialized) {
      console.log("🆕 CONTRACTFORM: Inicializando formulário para novo contrato");
      setIsEditing(false);

      // Reset para novo contrato
      updateContractData({
        contractNumber: "",
        employeeCount: "",
        cnpjCount: "",
        trialDays: "",
        startDate: "",
        monthlyValue: "",
        renewalDate: "",
        paymentStartDate: "",
        paymentDay: "",
        planType: "mensal",
        semestralDiscount: "0",
        anualDiscount: "0",
        contractors: [{
          id: "contractor-1",
          name: "",
          cnpj: "",
          city: "",
          state: "",
          address: "",
          responsibleName: "",
          responsibleCpf: "",
          responsibleRg: ""
        }]
      });
      setInitialized(true);
    }
  }, [editingContract, initialized, updateContractData, loadContractData]);

  // Debug: Log contractData whenever it changes
  useEffect(() => {
    console.log("📊 CONTRACTFORM: contractData atualizado:", contractData);
    console.log("💰 CONTRACTFORM: Valor mensal atual:", contractData.monthlyValue);
    console.log("📅 CONTRACTFORM: Datas atuais:", {
      startDate: contractData.startDate,
      renewalDate: contractData.renewalDate,
      paymentStartDate: contractData.paymentStartDate
    });
  }, [contractData]);

  // Auto-generate contract number for new contracts only
  useEffect(() => {
    const autoGenerateNumber = async () => {
      // Gerar número automaticamente para novos contratos (não em edição) que não têm número
      if (!isEditing && (!contractData.contractNumber || contractData.contractNumber.trim() === "")) {
        console.log("🔢 Gerando número automático para novo contrato");
        setGeneratingNumber(true);
        try {
          const nextNumber = await generateNextContractNumber();
          console.log("✅ Número gerado automaticamente:", nextNumber);
          updateContractData({
            contractNumber: nextNumber
          });
        } catch (error) {
          console.error("❌ Erro ao gerar número automático:", error);
          // Em caso de erro, gerar um número baseado em timestamp
          const timestamp = Date.now().toString().slice(-3);
          const fallbackNumber = timestamp.padStart(3, '0');
          updateContractData({
            contractNumber: fallbackNumber
          });
        } finally {
          setGeneratingNumber(false);
        }
      }
    };
    
    // Executar imediatamente quando não for modo de edição
    if (!isEditing) {
      autoGenerateNumber();
    }
  }, [isEditing, contractData.contractNumber, generateNextContractNumber, updateContractData]);
  const handleGenerateNumber = async () => {
    setGeneratingNumber(true);
    try {
      const nextNumber = await generateNextContractNumber();
      updateContractData({
        contractNumber: nextNumber
      });
      toast({
        title: "Número gerado!",
        description: `Próximo número de contrato: ${nextNumber}`
      });
    } catch (error) {
      console.error("Erro ao gerar número:", error);
      // Em caso de erro, gerar um número baseado em timestamp
      const timestamp = Date.now().toString().slice(-3);
      const fallbackNumber = timestamp.padStart(3, '0');
      updateContractData({
        contractNumber: fallbackNumber
      });
      toast({
        title: "Número gerado!",
        description: `Número de contrato gerado: ${fallbackNumber}`
      });
    } finally {
      setGeneratingNumber(false);
    }
  };
  const handleSaveContract = async () => {
    console.log("💾 Iniciando salvamento do contrato...");
    console.log("📊 Dados completos do contrato antes do salvamento:", contractData);
    setSaving(true);
    try {
      // Validações
      if (!contractData.contractNumber) {
        console.log("❌ Erro: Número do contrato não informado");
        toast({
          title: "Erro",
          description: "Número do contrato é obrigatório",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }
      if (contractData.contractors.length === 0) {
        console.log("❌ Erro: Nenhum contratante informado");
        toast({
          title: "Erro",
          description: "Adicione pelo menos um contratante",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      // Validar campos obrigatórios dos contratantes
      for (const contractor of contractData.contractors) {
        if (!contractor.name || !contractor.cnpj || !contractor.responsibleName) {
          console.log("❌ Erro: Campos obrigatórios não preenchidos");
          toast({
            title: "Erro",
            description: "Preencha todos os campos obrigatórios dos contratantes",
            variant: "destructive"
          });
          setSaving(false);
          return;
        }
      }
      console.log("✅ Validações passaram, iniciando salvamento...");
      let result;
      if (editingContract) {
        console.log("🔄 Atualizando contrato existente:", editingContract.id);
        result = await updateContract(editingContract.id, contractData, contractData.contractors);
      } else {
        console.log("🆕 Salvando novo contrato");
        result = await saveContract(contractData, contractData.contractors);
      }
      console.log("📄 Resultado do salvamento:", result);
      if (result) {
        console.log("✅ Contrato salvo com sucesso!");

        // Aguardar um pouco antes de executar o callback para garantir que o toast apareça
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Executar callback para redirecionamento
        if (onContractSaved) {
          console.log("🔄 Executando redirecionamento...");
          onContractSaved();
        }
      } else {
        console.log("❌ Resultado do salvamento foi falsy:", result);
        toast({
          title: "Erro",
          description: "Erro inesperado ao salvar contrato",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ Error saving contract:", error);
      toast({
        title: "Erro",
        description: `Erro ao salvar contrato: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      console.log("🏁 Finalizando processo de salvamento...");
      setSaving(false);
    }
  };
  const handleNextStep = () => {
    if (canProceedToNext) {
      nextStep();
    } else {
      toast({
        title: "Etapa incompleta",
        description: "Preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive"
      });
    }
  };
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-2 w-1/3">
                <Label htmlFor="contractNumber">Número do Contrato</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="contractNumber" 
                    name="contractNumber" 
                    value={contractData.contractNumber || ""} 
                    onChange={e => {
                      console.log("🔢 Alterando número do contrato:", e.target.value);
                      updateContractData({
                        contractNumber: e.target.value
                      });
                    }}
                    onFocus={createFieldHandler("contractNumber")}
                    placeholder="001" 
                    disabled={isLocked} 
                  />
                  {!isEditing && !isLocked && <Button onClick={handleGenerateNumber} disabled={generatingNumber} variant="outline" size="icon" title="Gerar próximo número automaticamente">
                      {generatingNumber ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLocked ? "Contrato travado - não pode ser editado" : isEditing ? "Número do contrato sendo editado" : "Número gerado automaticamente em ordem crescente. Clique no botão para gerar o próximo número."}
                </p>
              </div>
            </div>
            <ContractorList />
          </div>;
      case 1:
        return <ResponsibleList disabled={isLocked} />;
      case 2:
        return <ServiceClauses />;
      case 3:
        return <TechnicalVisitSection disabled={isLocked} />;
      case 4:
        return <PaymentInfo disabled={isLocked} />;
      default:
        return null;
    }
  };

  // Show loading while initializing or checking lock
  if (!initialized || lockLoading) {
    return <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando formulário...</span>
        </CardContent>
      </Card>;
  }
  return <div className="w-full">
      {/* Fixed Progress Header */}
      <ContractStepsBar steps={steps} currentStep={currentStep} onStepClick={goToStep} />
      
      {/* Main Content Card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-contract">
              {editingContract ? "Editar Contrato" : "Criar Novo Contrato"}
            </CardTitle>
            {!isLocked && allStepsCompleted && <Button onClick={handleSaveContract} disabled={saving} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : editingContract ? "Atualizar Contrato" : "Salvar Contrato"}
              </Button>}
          </div>
        </CardHeader>
        <CardContent className="bg-transparent">
          {/* Aviso de contrato travado */}
          {isLocked && <Alert className="mb-6 border-orange-500/20 bg-orange-500/10">
              <Lock className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-300">
                Este contrato foi revisado e está travado. Não é possível fazer alterações.
                O contrato passou por um processo de revisão e agora está finalizado.
              </AlertDescription>
            </Alert>}

          {/* Conteúdo da Etapa Atual */}
          <div className="mt-6">
            {renderStepContent()}
          </div>

          {/* Navegação entre Etapas */}
          {!isLocked && <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button variant="outline" onClick={prevStep} disabled={isFirstStep} className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <div className="text-sm text-gray-500">
                Etapa {currentStep + 1} de {steps.length}
              </div>
              
              {!isLastStep ? <Button onClick={handleNextStep} disabled={!canProceedToNext} className="flex items-center gap-2">
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button> : <Button onClick={handleSaveContract} disabled={saving || !allStepsCompleted} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : editingContract ? "Atualizar Contrato" : "Finalizar Contrato"}
                </Button>}
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default ContractForm;