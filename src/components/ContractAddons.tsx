import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PlanChangeManager from "./contract-addons/PlanChangeManager";
import AddonForm from "./contract-addons/AddonForm";
import PlanChangeHistory from "./contract-addons/PlanChangeHistory";
import OtherAddonsTable from "./contract-addons/OtherAddonsTable";
import { ContractAddon, AddonFormData } from "@/types/contract-addons";

interface ContractAddonsProps {
  contractId: string;
  contractNumber: string;
  onContractUpdate?: () => void;
}

const ContractAddons = ({ contractId, contractNumber, onContractUpdate }: ContractAddonsProps) => {
  const [addons, setAddons] = useState<ContractAddon[]>([]);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<ContractAddon | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<AddonFormData>({
    addon_type: "",
    description: "",
    previous_value: "",
    new_value: "",
    requested_by: "",
    request_date: new Date().toISOString().split('T')[0]
  });

  // Computed variables to filter addons by type
  const planChangeAddons = addons.filter(addon => addon.addon_type === 'plan_change');
  const otherAddons = addons.filter(addon => addon.addon_type !== 'plan_change');

  useEffect(() => {
    fetchContract();
    fetchAddons();
  }, [contractId]);

  const fetchContract = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error) throw error;
      setContract(data);
    } catch (error) {
      console.error('Erro ao carregar contrato:', error);
    }
  };

  const fetchAddons = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_addons')
        .select('*')
        .eq('contract_id', contractId)
        .order('request_date', { ascending: false });

      if (error) throw error;
      setAddons(data || []);
    } catch (error) {
      console.error('Erro ao carregar adicionais:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar adicionais do contrato",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.addon_type || !formData.description || !formData.new_value || !formData.requested_by) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingAddon) {
        const { error } = await supabase
          .from('contract_addons')
          .update({
            addon_type: formData.addon_type,
            description: formData.description,
            previous_value: formData.previous_value || null,
            new_value: formData.new_value,
            requested_by: formData.requested_by,
            request_date: formData.request_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAddon.id);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Adicional atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('contract_addons')
          .insert({
            contract_id: contractId,
            addon_type: formData.addon_type,
            description: formData.description,
            previous_value: formData.previous_value || null,
            new_value: formData.new_value,
            requested_by: formData.requested_by,
            request_date: formData.request_date
          });

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Adicional registrado com sucesso",
        });
      }

      setIsDialogOpen(false);
      setEditingAddon(null);
      resetForm();
      fetchAddons();
    } catch (error) {
      console.error('Erro ao salvar adicional:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar adicional",
        variant: "destructive",
      });
    }
  };

  const handlePlanChange = async (planChangeData: any) => {
    try {
      console.log("Salvando mudança de plano:", planChangeData);

      // Primeiro, salvar o adicional
      const { error } = await supabase
        .from('contract_addons')
        .insert({
          contract_id: contractId,
          addon_type: planChangeData.addon_type,
          description: planChangeData.description,
          previous_value: planChangeData.previous_value,
          new_value: planChangeData.new_value,
          requested_by: planChangeData.requested_by,
          request_date: planChangeData.request_date,
          plan_change_details: planChangeData.plan_change_details
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Mudança de plano registrada com sucesso",
      });

      // Atualizar o contrato principal com os novos dados
      if (planChangeData.plan_change_details) {
        await updateContractFromPlanChange(planChangeData.plan_change_details);
      }

      // Recarregar dados
      await fetchAddons();
      await fetchContract();

      // Notificar o componente pai para atualizar a lista
      if (onContractUpdate) {
        console.log("Notificando componente pai sobre atualização do contrato");
        onContractUpdate();
      }
    } catch (error) {
      console.error('Erro ao salvar mudança de plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar mudança de plano",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (addonId: string) => {
    try {
      const { error } = await supabase
        .from('contract_addons')
        .delete()
        .eq('id', addonId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Adicional excluído com sucesso",
      });

      fetchAddons();
    } catch (error) {
      console.error('Erro ao excluir adicional:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir adicional",
        variant: "destructive",
      });
    }
  };

  const updateContractFromPlanChange = async (planChangeDetails: any) => {
    try {
      console.log("Atualizando contrato com detalhes da mudança de plano:", planChangeDetails);

      // Extract the new plan information from plan_change_details
      const updates: any = {};

      if (planChangeDetails.newPlanType) {
        updates.plan_type = planChangeDetails.newPlanType;
        console.log("Novo tipo de plano:", planChangeDetails.newPlanType);
      }

      if (planChangeDetails.calculation?.newPlan?.finalValue) {
        updates.monthly_value = planChangeDetails.calculation.newPlan.finalValue.toFixed(2);
        console.log("Novo valor:", updates.monthly_value);
      }

      // Update employee count if it changed
      if (planChangeDetails.calculation?.newPlan?.employeeCount) {
        updates.employee_count = planChangeDetails.calculation.newPlan.employeeCount.toString();
        console.log("Nova quantidade de funcionários:", updates.employee_count);
      }

      // Update CNPJ count if it changed
      if (planChangeDetails.calculation?.newPlan?.cnpjCount) {
        updates.cnpj_count = planChangeDetails.calculation.newPlan.cnpjCount.toString();
        console.log("Nova quantidade de CNPJs:", updates.cnpj_count);
      }

      // Calculate new renewal date based on plan type and change date
      if (planChangeDetails.changeDate && planChangeDetails.newPlanType) {
        const changeDate = new Date(planChangeDetails.changeDate);
        let newRenewalDate = new Date(changeDate);
        
        switch (planChangeDetails.newPlanType) {
          case "mensal":
            newRenewalDate.setMonth(newRenewalDate.getMonth() + 1);
            break;
          case "semestral":
            newRenewalDate.setMonth(newRenewalDate.getMonth() + 6);
            break;
          case "anual":
            newRenewalDate.setFullYear(newRenewalDate.getFullYear() + 1);
            break;
        }
        
        updates.renewal_date = newRenewalDate.toLocaleDateString('pt-BR');
        console.log("Nova data de renovação:", updates.renewal_date);
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();

        console.log("Executando atualização no banco:", updates);

        const { error: updateError, data: updatedData } = await supabase
          .from('contracts')
          .update(updates)
          .eq('id', contractId)
          .select();

        if (updateError) {
          console.error('Erro ao atualizar contrato:', updateError);
          return;
        }

        console.log('Contrato atualizado com sucesso no banco:', updatedData);
      }
    } catch (error) {
      console.error('Erro ao atualizar contrato após mudança de plano:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      addon_type: "",
      description: "",
      previous_value: "",
      new_value: "",
      requested_by: "",
      request_date: new Date().toISOString().split('T')[0]
    });
  };

  const openEditDialog = (addon: ContractAddon) => {
    setEditingAddon(addon);
    setFormData({
      addon_type: addon.addon_type,
      description: addon.description,
      previous_value: addon.previous_value || "",
      new_value: addon.new_value,
      requested_by: addon.requested_by,
      request_date: addon.request_date
    });
    setIsDialogOpen(true);
  };

  const getAddonTypeLabel = (type: string) => {
    switch (type) {
      case 'plan_change':
        return 'Mudança de Plano';
      case 'additional_service':
        return 'Serviço Adicional';
      case 'value_adjustment':
        return 'Ajuste de Valor';
      default:
        return type;
    }
  };

  const getAddonTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type) {
      case 'plan_change':
        return 'default';
      case 'additional_service':
        return 'secondary';
      case 'value_adjustment':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Adicionais e Mudanças - Contrato {contractNumber}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="plan-changes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plan-changes" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Mudanças de Plano
            </TabsTrigger>
            <TabsTrigger value="other-addons" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Outros Adicionais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plan-changes" className="space-y-6">
            {contract && (
              <PlanChangeManager 
                currentContract={contract}
                onSavePlanChange={handlePlanChange}
                contractAddons={addons}
              />
            )}

            <PlanChangeHistory 
              planChangeAddons={planChangeAddons}
              onDelete={handleDelete}
              getAddonTypeLabel={getAddonTypeLabel}
            />
          </TabsContent>

          <TabsContent value="other-addons" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Outros Serviços Adicionais</h3>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingAddon(null); setIsDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Adicional
                </Button>
              </DialogTrigger>
            </div>

            <OtherAddonsTable 
              otherAddons={otherAddons}
              loading={loading}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              getAddonTypeLabel={getAddonTypeLabel}
              getAddonTypeBadgeVariant={getAddonTypeBadgeVariant}
            />

            <AddonForm 
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              editingAddon={editingAddon}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContractAddons;
