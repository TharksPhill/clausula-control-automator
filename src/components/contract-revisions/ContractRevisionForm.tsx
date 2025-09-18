
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Contractor {
  id?: string;
  name: string;
  cnpj: string;
  city: string;
  state: string;
  address: string;
  responsibleName: string;
  responsibleCpf: string;
  responsibleRg?: string;
}

interface ContractRevisionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (revisionData: any) => void;
  initialData?: any;
  contractId?: string;
  loading?: boolean;
}

const ContractRevisionForm = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  contractId,
  loading = false
}: ContractRevisionFormProps) => {
  const [formData, setFormData] = useState({
    contractNumber: "",
    employeeCount: "",
    cnpjCount: "",
    monthlyValue: "",
    trialDays: "",
    startDate: "",
    renewalDate: "",
    paymentStartDate: "",
    paymentDay: "",
    planType: "mensal",
    semestralDiscount: "0",
    anualDiscount: "0"
  });

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Reset to initial state
      setFormData({
        contractNumber: "",
        employeeCount: "",
        cnpjCount: "",
        monthlyValue: "",
        trialDays: "",
        startDate: "",
        renewalDate: "",
        paymentStartDate: "",
        paymentDay: "",
        planType: "mensal",
        semestralDiscount: "0",
        anualDiscount: "0"
      });
      setContractors([]);
    }
  }, [isOpen]);

  // Carregar dados do contrato se contractId for fornecido
  useEffect(() => {
    const loadContractData = async () => {
      if (contractId && isOpen) {
        setDataLoading(true);
        try {
          console.log("🔄 Carregando dados do contrato para revisão:", contractId);

          // Buscar dados completos do contrato
          const { data: contractData, error: contractError } = await supabase
            .from("contracts")
            .select("*")
            .eq("id", contractId)
            .single();

          if (contractError) {
            console.error("❌ Erro ao buscar dados do contrato:", contractError);
            throw contractError;
          }

          console.log("📋 Dados do contrato carregados:", contractData);

          // Buscar todos os contratantes do contrato
          const { data: contractorsData, error: contractorsError } = await supabase
            .from("contractors")
            .select("*")
            .eq("contract_id", contractId);

          if (contractorsError) {
            console.error("❌ Erro ao buscar contratantes:", contractorsError);
            throw contractorsError;
          }

          console.log("👥 Contratantes carregados:", contractorsData);

          // Mapear TODOS os dados do contrato para o formulário
          setFormData({
            contractNumber: contractData.contract_number || "",
            employeeCount: contractData.employee_count || "",
            cnpjCount: contractData.cnpj_count || "",
            monthlyValue: contractData.monthly_value || "",
            trialDays: contractData.trial_days || "",
            startDate: contractData.start_date || "",
            renewalDate: contractData.renewal_date || "",
            paymentStartDate: contractData.payment_start_date || "",
            paymentDay: contractData.payment_day || "",
            planType: contractData.plan_type || "mensal",
            semestralDiscount: contractData.semestral_discount || "0",
            anualDiscount: contractData.anual_discount || "0"
          });

          console.log("✅ FormData configurado:", {
            contractNumber: contractData.contract_number,
            employeeCount: contractData.employee_count,
            cnpjCount: contractData.cnpj_count,
            monthlyValue: contractData.monthly_value,
            trialDays: contractData.trial_days,
            startDate: contractData.start_date,
            renewalDate: contractData.renewal_date,
            paymentStartDate: contractData.payment_start_date,
            paymentDay: contractData.payment_day,
            planType: contractData.plan_type,
            semestralDiscount: contractData.semestral_discount,
            anualDiscount: contractData.anual_discount
          });

          // Mapear contratantes
          if (contractorsData && contractorsData.length > 0) {
            const mappedContractors = contractorsData.map((contractor: any) => ({
              id: contractor.id || `contractor-${Date.now()}`,
              name: contractor.name || "",
              cnpj: contractor.cnpj || "",
              city: contractor.city || "",
              state: contractor.state || "",
              address: contractor.address || "",
              responsibleName: contractor.responsible_name || "",
              responsibleCpf: contractor.responsible_cpf || "",
              responsibleRg: contractor.responsible_rg || ""
            }));
            
            console.log("✅ Contratantes mapeados:", mappedContractors);
            setContractors(mappedContractors);
          } else {
            // Adicionar um contratante padrão se não houver
            setContractors([{
              id: "contractor-1",
              name: "",
              cnpj: "",
              city: "",
              state: "",
              address: "",
              responsibleName: "",
              responsibleCpf: "",
              responsibleRg: ""
            }]);
          }

          toast({
            title: "Dados carregados",
            description: "Os dados do contrato foram carregados para revisão.",
          });

        } catch (error) {
          console.error("❌ Erro ao carregar dados do contrato:", error);
          toast({
            title: "Erro",
            description: "Erro ao carregar dados do contrato",
            variant: "destructive",
          });
        } finally {
          setDataLoading(false);
        }
      }
    };

    loadContractData();
  }, [contractId, isOpen, toast]);

  // Usar dados iniciais se fornecidos (para outras situações)
  useEffect(() => {
    if (initialData && !contractId && isOpen) {
      console.log("📋 Usando dados iniciais:", initialData);
      
      setFormData({
        contractNumber: initialData.contractNumber || "",
        employeeCount: initialData.employeeCount || "",
        cnpjCount: initialData.cnpjCount || "",
        monthlyValue: initialData.monthlyValue || "",
        trialDays: initialData.trialDays || "",
        startDate: initialData.startDate || "",
        renewalDate: initialData.renewalDate || "",
        paymentStartDate: initialData.paymentStartDate || "",
        paymentDay: initialData.paymentDay || "",
        planType: initialData.planType || "mensal",
        semestralDiscount: initialData.semestralDiscount || "0",
        anualDiscount: initialData.anualDiscount || "0"
      });

      if (initialData.contractors) {
        setContractors(initialData.contractors);
      } else {
        setContractors([{
          id: "contractor-1",
          name: "",
          cnpj: "",
          city: "",
          state: "",
          address: "",
          responsibleName: "",
          responsibleCpf: "",
          responsibleRg: ""
        }]);
      }
    }
  }, [initialData, contractId, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContractorChange = (index: number, field: string, value: string) => {
    setContractors(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addContractor = () => {
    setContractors(prev => [...prev, {
      id: `contractor-${Date.now()}`,
      name: "",
      cnpj: "",
      city: "",
      state: "",
      address: "",
      responsibleName: "",
      responsibleCpf: "",
      responsibleRg: ""
    }]);
  };

  const removeContractor = (index: number) => {
    if (contractors.length > 1) {
      setContractors(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    const revisionData = {
      ...formData,
      contractors: contractors
    };
    console.log("💾 Salvando dados da revisão:", revisionData);
    onSave(revisionData);
  };

  if (dataLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Carregando dados do contrato...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar Contrato - Aceita a Solicitação</DialogTitle>
          <p className="text-sm text-gray-600">
            Faça as alterações necessárias no contrato. Ao salvar, o contratante será notificado que o contrato revisado está pronto para assinatura.
          </p>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="contractors">Contratantes</TabsTrigger>
            <TabsTrigger value="service">Serviço</TabsTrigger>
            <TabsTrigger value="payment">Pagamento</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contractNumber">Número do Contrato</Label>
                  <Input
                    id="contractNumber"
                    value={formData.contractNumber}
                    onChange={(e) => handleInputChange("contractNumber", e.target.value)}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="cnpjCount">CNPJs</Label>
                  <Input
                    id="cnpjCount"
                    value={formData.cnpjCount}
                    onChange={(e) => handleInputChange("cnpjCount", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contractors" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Contratantes</h3>
              <Button onClick={addContractor} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Contratante
              </Button>
            </div>

            {contractors.map((contractor, index) => (
              <Card key={contractor.id || index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">Contratante {index + 1}</CardTitle>
                  {contractors.length > 1 && (
                    <Button
                      onClick={() => removeContractor(index)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome da Empresa</Label>
                    <Input
                      value={contractor.name}
                      onChange={(e) => handleContractorChange(index, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>CNPJ</Label>
                    <Input
                      value={contractor.cnpj}
                      onChange={(e) => handleContractorChange(index, "cnpj", e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={contractor.city}
                      onChange={(e) => handleContractorChange(index, "city", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input
                      value={contractor.state}
                      onChange={(e) => handleContractorChange(index, "state", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Endereço</Label>
                    <Input
                      value={contractor.address}
                      onChange={(e) => handleContractorChange(index, "address", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Nome do Responsável</Label>
                    <Input
                      value={contractor.responsibleName}
                      onChange={(e) => handleContractorChange(index, "responsibleName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>CPF do Responsável</Label>
                    <Input
                      value={contractor.responsibleCpf}
                      onChange={(e) => handleContractorChange(index, "responsibleCpf", e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label>RG do Responsável</Label>
                    <Input
                      value={contractor.responsibleRg || ""}
                      onChange={(e) => handleContractorChange(index, "responsibleRg", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="service" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Serviço</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeCount">Funcionários</Label>
                  <Input
                    id="employeeCount"
                    value={formData.employeeCount}
                    onChange={(e) => handleInputChange("employeeCount", e.target.value)}
                    placeholder="Quantidade de funcionários"
                  />
                </div>
                <div>
                  <Label htmlFor="trialDays">Dias de Teste</Label>
                  <Input
                    id="trialDays"
                    value={formData.trialDays}
                    onChange={(e) => handleInputChange("trialDays", e.target.value)}
                    placeholder="Dias de período de teste"
                  />
                </div>
                <div>
                  <Label htmlFor="planType">Tipo de Plano</Label>
                  <Select value={formData.planType} onValueChange={(value) => handleInputChange("planType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="monthlyValue">Valor Mensal (R$)</Label>
                  <Input
                    id="monthlyValue"
                    value={formData.monthlyValue}
                    onChange={(e) => handleInputChange("monthlyValue", e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label htmlFor="semestralDiscount">Desconto Semestral (%)</Label>
                  <Input
                    id="semestralDiscount"
                    value={formData.semestralDiscount}
                    onChange={(e) => handleInputChange("semestralDiscount", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="anualDiscount">Desconto Anual (%)</Label>
                  <Input
                    id="anualDiscount"
                    value={formData.anualDiscount}
                    onChange={(e) => handleInputChange("anualDiscount", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Condições de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="renewalDate">Data de Renovação</Label>
                  <Input
                    id="renewalDate"
                    type="date"
                    value={formData.renewalDate}
                    onChange={(e) => handleInputChange("renewalDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentStartDate">Data Início do Pagamento</Label>
                  <Input
                    id="paymentStartDate"
                    type="date"
                    value={formData.paymentStartDate}
                    onChange={(e) => handleInputChange("paymentStartDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentDay">Dia do Pagamento</Label>
                  <Select value={formData.paymentDay} onValueChange={(value) => handleInputChange("paymentDay", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString()}>
                          Dia {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4" />
            {loading ? "Salvando Revisão e Notificando Contratante..." : "Salvar Revisão e Notificar Contratante"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractRevisionForm;
