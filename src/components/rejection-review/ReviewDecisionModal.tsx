import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, XCircle, AlertTriangle, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import ContractRevisionForm from "../contract-revisions/ContractRevisionForm";

interface ReviewDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rejection: any;
  onComplete: () => void;
}

const ReviewDecisionModal = ({ isOpen, onClose, rejection, onComplete }: ReviewDecisionModalProps) => {
  const [decision, setDecision] = useState<"approved" | "rejected" | "approved_with_changes" | "">("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractRevisionData, setContractRevisionData] = useState<any>(null);
  const { toast } = useToast();
  const { adminUser, loading: adminLoading } = useAdminAuth();

  const handleSubmit = async () => {
    if (!decision) {
      toast({
        title: "Erro",
        description: "Selecione uma decisão",
        variant: "destructive",
      });
      return;
    }

    if (!explanation.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma explicação para a decisão",
        variant: "destructive",
      });
      return;
    }

    if (adminLoading) {
      toast({
        title: "Aguarde",
        description: "Carregando dados do administrador...",
        variant: "default",
      });
      return;
    }

    if (decision === "approved_with_changes") {
      setShowContractForm(true);
      return;
    }

    await processDecision();
  };

  const processDecision = async (revisionData?: any) => {
    setLoading(true);

    try {
      console.log("🔄 Processando decisão:", decision);
      console.log("📊 Dados de revisão:", revisionData);
      console.log("🆔 ID da rejeição:", rejection.id);
      console.log("👤 Admin user:", adminUser);

      if (!adminUser?.id) {
        console.error("❌ Usuário administrador não encontrado");
        throw new Error("Usuário administrador não encontrado. Tente recarregar a página.");
      }

      console.log("✅ Admin encontrado:", adminUser.name, "ID:", adminUser.id);

      // Atualizar a rejeição
      const { error: rejectionError } = await supabase
        .from("contractor_rejections")
        .update({
          review_status: decision === "approved_with_changes" ? "approved" : decision,
          admin_explanation: explanation,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.id
        })
        .eq("id", rejection.id);

      if (rejectionError) {
        console.error("❌ Erro ao atualizar rejeição:", rejectionError);
        throw rejectionError;
      }

      console.log("✅ Rejeição atualizada com sucesso");

      // Se há dados de revisão, atualizar o contrato
      if (revisionData && rejection.contract_id) {
        console.log("🔄 Atualizando contrato com dados de revisão...");

        const contractPayload = {
          contract_number: revisionData.contractNumber,
          employee_count: revisionData.employeeCount || "0",
          cnpj_count: revisionData.cnpjCount || "1",
          trial_days: revisionData.trialDays || "0",
          start_date: revisionData.startDate,
          monthly_value: revisionData.monthlyValue || "0",
          renewal_date: revisionData.renewalDate,
          payment_start_date: revisionData.paymentStartDate,
          payment_day: revisionData.paymentDay || "1",
          plan_type: revisionData.planType || "mensal",
          semestral_discount: revisionData.semestralDiscount || "0",
          anual_discount: revisionData.anualDiscount || "0",
          status: "Revisado",
          revision_status: "revision_approved"
        };

        console.log("📄 Payload do contrato:", contractPayload);

        const { error: contractError } = await supabase
          .from("contracts")
          .update(contractPayload)
          .eq("id", rejection.contract_id);

        if (contractError) {
          console.error("❌ Erro ao atualizar contrato:", contractError);
          throw contractError;
        }

        console.log("✅ Contrato atualizado com sucesso");

        if (revisionData.contractors && revisionData.contractors.length > 0) {
          console.log("🔄 Atualizando contratantes...");

          const { error: deleteError } = await supabase
            .from("contractors")
            .delete()
            .eq("contract_id", rejection.contract_id);

          if (deleteError) {
            console.error("❌ Erro ao deletar contratantes existentes:", deleteError);
            throw deleteError;
          }

          const contractorsPayload = revisionData.contractors.map((contractor: any) => ({
            contract_id: rejection.contract_id,
            name: contractor.name || "",
            cnpj: contractor.cnpj || "",
            city: contractor.city || "",
            state: contractor.state || "",
            address: contractor.address || "",
            responsible_name: contractor.responsibleName || "",
            responsible_cpf: contractor.responsibleCpf || "",
            responsible_rg: contractor.responsibleRg || ""
          }));

          console.log("👥 Payload dos contratantes:", contractorsPayload);

          const { error: contractorsError } = await supabase
            .from("contractors")
            .insert(contractorsPayload);

          if (contractorsError) {
            console.error("❌ Erro ao inserir novos contratantes:", contractorsError);
            throw contractorsError;
          }

          console.log("✅ Contratantes atualizados com sucesso");
        }
      }

      // Criar registro na tabela de revisões de justificativas
      console.log("📝 Preparando payload da revisão de justificativa...");
      
      const reviewPayload = {
        rejection_id: rejection.id,
        contract_id: rejection.contract_id,
        contractor_id: rejection.contractor_id,
        review_status: decision === "approved_with_changes" ? "approved" : decision,
        admin_explanation: explanation,
        reviewed_by: adminUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log("📝 Payload da revisão de justificativa:", reviewPayload);

      const { data: reviewData, error: reviewError } = await supabase
        .from("justification_reviews")
        .insert(reviewPayload)
        .select();

      if (reviewError) {
        console.error("❌ Erro ao criar revisão de justificativa:", reviewError);
        console.error("❌ Detalhes do erro:", reviewError.message);
        throw reviewError;
      }

      console.log("✅ Revisão de justificativa criada com sucesso:", reviewData);

      // Buscar dados do contrato para as notificações
      const { data: contractData, error: contractFetchError } = await supabase
        .from("contracts")
        .select(`
          *,
          companies!inner(user_id, name)
        `)
        .eq("id", rejection.contract_id)
        .single();

      if (contractFetchError) {
        console.error("❌ Erro ao buscar dados do contrato:", contractFetchError);
        throw contractFetchError;
      }

      // Criar notificação para o usuário da empresa
      if (contractData?.companies?.user_id) {
        console.log("📧 Criando notificação para a empresa...");

        const notificationMessage = decision === "approved" 
          ? `A rejeição do contrato ${contractData.contract_number} foi aprovada. As justificativas do contratante foram aceitas.`
          : decision === "approved_with_changes"
          ? `A rejeição do contrato ${contractData.contract_number} foi aprovada com alterações. O contrato foi atualizado conforme solicitado.`
          : `A rejeição do contrato ${contractData.contract_number} foi rejeitada. As justificativas não foram aceitas.`;

        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: contractData.companies.user_id,
            contract_id: rejection.contract_id,
            type: decision === "approved" || decision === "approved_with_changes" ? "revision_approved" : "revision_rejected",
            title: decision === "approved" || decision === "approved_with_changes" ? "Rejeição Aprovada" : "Rejeição Rejeitada",
            message: notificationMessage,
            created_at: new Date().toISOString()
          });

        if (notificationError) {
          console.error("❌ Erro ao criar notificação para empresa:", notificationError);
          // Não bloquear o fluxo por erro de notificação
        } else {
          console.log("✅ Notificação criada para a empresa");
        }
      }

      toast({
        title: "Sucesso!",
        description: revisionData 
          ? "Rejeição aprovada e contrato atualizado com sucesso" 
          : `Rejeição ${decision === "approved" ? "aprovada" : "rejeitada"} com sucesso`,
      });

      onComplete();
      onClose();
      resetForm();

    } catch (error: any) {
      console.error("❌ Erro ao processar decisão:", error);
      toast({
        title: "Erro",
        description: `Erro ao processar decisão: ${error.message || "Erro desconhecido"}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDecision("");
    setExplanation("");
    setShowContractForm(false);
    setContractRevisionData(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleDecisionChange = (value: string) => {
    setDecision(value as "approved" | "rejected" | "approved_with_changes");
    setShowContractForm(false);
  };

  const handleContractRevisionSave = (revisionData: any) => {
    console.log("📊 Dados recebidos do formulário de revisão:", revisionData);
    setContractRevisionData(revisionData);
    setShowContractForm(false);
    processDecision(revisionData);
  };

  if (!rejection) return null;

  if (showContractForm) {
    return (
      <ContractRevisionForm
        isOpen={true}
        onClose={() => setShowContractForm(false)}
        onSave={handleContractRevisionSave}
        initialData={null}
        contractId={rejection.contract_id}
        loading={loading}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Revisar Rejeição</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Resumo</h4>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Contrato:</strong> {rejection.contracts?.contract_number || 'N/A'}
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Contratante:</strong> {rejection.contractors?.name || 'N/A'}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Motivo:</strong> {rejection.reason}
            </p>
          </div>

          {adminLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700">Carregando dados do administrador...</span>
              </div>
            </div>
          )}

          {!adminLoading && !adminUser && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Erro de Autenticação</p>
                  <p className="text-red-700">
                    Usuário administrador não encontrado. Tente recarregar a página.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label>Decisão</Label>
            <RadioGroup value={decision} onValueChange={handleDecisionChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approved" id="approved" />
                <Label htmlFor="approved" className="flex items-center gap-2 cursor-pointer">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Aprovar - A rejeição é procedente
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approved_with_changes" id="approved_with_changes" />
                <Label htmlFor="approved_with_changes" className="flex items-center gap-2 cursor-pointer">
                  <Edit className="w-4 h-4 text-blue-600" />
                  Aprovar com Alterações - Editar contrato
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="flex items-center gap-2 cursor-pointer">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Rejeitar - A rejeição não é procedente
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">
              Explicação da Decisão *
            </Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder={
                decision === "approved" 
                  ? "Explique por que a rejeição foi aprovada e quais ações serão tomadas..."
                  : decision === "approved_with_changes"
                  ? "Explique as alterações que serão feitas no contrato..."
                  : decision === "rejected"
                  ? "Explique por que a rejeição não é procedente e justifique a decisão..."
                  : "Digite uma explicação detalhada da sua decisão..."
              }
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Esta explicação será enviada ao contratante
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Atenção</p>
                <p className="text-yellow-700">
                  {decision === "approved_with_changes" 
                    ? "Após salvar as alterações, o contrato ficará travado e não poderá ser editado novamente."
                    : "Esta decisão será final e não poderá ser alterada. O contratante será notificado automaticamente."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !decision || !explanation.trim() || adminLoading || !adminUser}
          >
            {loading ? "Processando..." : 
             decision === "approved_with_changes" ? "Editar Contrato" : "Confirmar Decisão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDecisionModal;
