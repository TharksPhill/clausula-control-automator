
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, ArrowLeft, FileText } from "lucide-react";
import { useContractRevisions } from "@/hooks/useContractRevisions";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import RevisionApprovalModal from "@/components/contract-revisions/RevisionApprovalModal";
import ContractRevisionForm from "@/components/contract-revisions/ContractRevisionForm";
import { supabase } from "@/integrations/supabase/client";

const ContractRevision = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  
  const { 
    revisions, 
    loading: revisionsLoading, 
    approveRevision, 
    rejectRevision,
    getPendingRevision 
  } = useContractRevisions(contractId);

  const pendingRevision = getPendingRevision();

  useEffect(() => {
    const fetchContract = async () => {
      if (!contractId) return;

      try {
        const { data, error } = await supabase
          .from("contracts")
          .select(`
            *,
            contractors(*),
            companies(*)
          `)
          .eq("id", contractId)
          .single();

        if (error) throw error;
        setContract(data);
      } catch (error) {
        console.error("Error fetching contract:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar contrato",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [contractId]);

  const handleApprove = async () => {
    if (!pendingRevision) return;
    
    try {
      await approveRevision(pendingRevision.id);
      toast({
        title: "Sucesso!",
        description: "A revisão foi aprovada. Agora você pode assinar o contrato.",
      });
      
      // Redirect to signing page
      navigate(`/contract/${contractId}?sign=true`);
    } catch (error) {
      console.error("Error approving revision:", error);
    }
  };

  const handleReject = async (reason: string) => {
    if (!pendingRevision) return;
    
    setShowRevisionForm(true);
  };

  const handleSubmitRevision = async (revisionData: any) => {
    if (!pendingRevision) return;

    try {
      await rejectRevision(pendingRevision.id, "Contratante propôs alterações", revisionData);
      setShowRevisionForm(false);
      toast({
        title: "Sucesso!",
        description: "Sua proposta de alteração foi enviada para análise da empresa.",
      });
    } catch (error) {
      console.error("Error submitting revision:", error);
    }
  };

  if (loading || revisionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando contrato...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Contrato não encontrado</h2>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Revisão do Contrato {contract.contract_number}
          </h1>
          <p className="text-gray-600 mt-2">
            Empresa: {contract.companies?.name}
          </p>
        </div>

        {pendingRevision ? (
          <div className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Este contrato possui uma revisão pendente de sua análise. 
                Revise as alterações propostas e escolha se deseja aprovar ou sugerir modificações.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Alterações Propostas pela Empresa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Dados Atuais</h4>
                    <div className="space-y-1 text-sm bg-gray-50 p-3 rounded">
                      <div><strong>Funcionários:</strong> {contract.employee_count}</div>
                      <div><strong>Valor Mensal:</strong> R$ {contract.monthly_value}</div>
                      <div><strong>Plano:</strong> {contract.plan_type}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Dados Propostos</h4>
                    <div className="space-y-1 text-sm bg-blue-50 p-3 rounded">
                      <div><strong>Funcionários:</strong> {pendingRevision.revision_data.employeeCount}</div>
                      <div><strong>Valor Mensal:</strong> R$ {pendingRevision.revision_data.monthlyValue}</div>
                      <div><strong>Plano:</strong> {pendingRevision.revision_data.planType}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6 justify-center">
                  <Button
                    onClick={() => setShowApprovalModal(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar e Assinar
                  </Button>
                  <Button
                    onClick={() => setShowRevisionForm(true)}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar e Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Este contrato não possui revisões pendentes no momento.
            </AlertDescription>
          </Alert>
        )}

        {/* Revision History */}
        {revisions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Histórico de Revisões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {revisions.map((revision) => (
                  <div key={revision.id} className="border rounded p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">Revisão #{revision.revision_number}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          por {revision.created_by_type === "company" ? "Empresa" : "Contratante"}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        revision.status === "approved" ? "bg-green-100 text-green-800" :
                        revision.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {revision.status === "approved" ? "Aprovada" :
                         revision.status === "rejected" ? "Rejeitada" : "Pendente"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(revision.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        <RevisionApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          onApprove={handleApprove}
          onReject={handleReject}
          revisionData={pendingRevision?.revision_data}
        />

        <ContractRevisionForm
          isOpen={showRevisionForm}
          onClose={() => setShowRevisionForm(false)}
          onSave={handleSubmitRevision}
          initialData={pendingRevision?.revision_data}
        />
      </div>
    </div>
  );
};

export default ContractRevision;
