import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, DollarSign, FileText, CheckCircle, Clock, AlertTriangle, Info, Shield } from "lucide-react";
import PlanChangeDetails from "@/components/contract-addons/PlanChangeDetails";
import ContractRejectionModal from "@/components/ContractRejectionModal";
import UnifiedDigitalSignature from "./unified/UnifiedDigitalSignature";
import SignatureMethodSelector from "./SignatureMethodSelector";
import { ContractAddon } from "@/types/contract-addons";
import ReviewNotificationModal from "@/components/ReviewNotificationModal";

interface ContractorPlanChangesProps {
  contractId: string;
  contractorId: string;
}

const ContractorPlanChanges = ({ contractId, contractorId }: ContractorPlanChangesProps) => {
  const [planChanges, setPlanChanges] = useState<ContractAddon[]>([]);
  const [contractData, setContractData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingPlanChange, setSigningPlanChange] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedPlanChangeForSignature, setSelectedPlanChangeForSignature] = useState<string | null>(null);
  const [rejectingPlanChange, setRejectingPlanChange] = useState<string | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedPlanChangeId, setSelectedPlanChangeId] = useState<string | null>(null);
  const [rejectedPlanChanges, setRejectedPlanChanges] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewModalData, setReviewModalData] = useState<any>(null);
  const [hasShownReviewModal, setHasShownReviewModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [contractId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do contrato
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", contractId)
        .single();

      if (contractError) {
        console.error("Erro ao carregar contrato:", contractError);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do contrato",
          variant: "destructive",
        });
        return;
      }

      setContractData(contract);

      // Carregar mudanças de plano
      const { data: changes, error: changesError } = await supabase
        .from("contract_addons")
        .select("*")
        .eq("contract_id", contractId)
        .eq("addon_type", "plan_change")
        .order("created_at", { ascending: false });

      if (changesError) {
        console.error("Erro ao carregar mudanças de plano:", changesError);
        toast({
          title: "Erro",
          description: "Erro ao carregar mudanças de plano",
          variant: "destructive",
        });
        return;
      }

      setPlanChanges(changes || []);

      // Carregar rejeições de mudanças de plano
      const { data: rejections, error: rejectionsError } = await supabase
        .from("contractor_rejections")
        .select("*")
        .eq("contract_id", contractId)
        .eq("contractor_id", contractorId)
        .eq("rejection_type", "plan_change");

      if (!rejectionsError && rejections) {
        setRejectedPlanChanges(rejections);

        // Verificar se há revisões recentes para mostrar modal
        for (const rejection of rejections) {
          const { data: reviewData, error: reviewError } = await supabase
            .from("justification_reviews")
            .select("*")
            .eq("rejection_id", rejection.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!reviewError && reviewData && !hasShownReviewModal) {
            setReviewModalData({
              ...reviewData,
              reason: rejection.reason,
              rejected_at: rejection.rejected_at
            });
            setShowReviewModal(true);
            setHasShownReviewModal(true);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Erro geral:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue || 0);
  };

  const handleOpenDigitalSignature = (planChangeId: string) => {
    setSelectedPlanChangeForSignature(planChangeId);
    setShowSignatureModal(true);
  };

  const handleDigitalSignatureComplete = async (signatureData: string) => {
    try {
      if (!selectedPlanChangeForSignature) return;

      setSigningPlanChange(selectedPlanChangeForSignature);
      
      const planChange = planChanges.find(pc => pc.id === selectedPlanChangeForSignature);
      if (!planChange) return;

      const contractorData = await getCurrentContractorData();

      const digitalSignatureInfo = {
        contractor_name: contractorData?.name || "Nome do Contratante",
        contractor_cpf: contractorData?.responsible_cpf || "",
        signed_at: new Date().toISOString(),
        ip_address: "127.0.0.1",
        user_agent: navigator.userAgent,
        signature_data: signatureData,
        signature_method: 'digital_certificate'
      };

      const updatedDetails = {
        ...planChange.plan_change_details,
        digital_signature: digitalSignatureInfo
      };

      const { error } = await supabase
        .from("contract_addons")
        .update({
          plan_change_details: updatedDetails,
          description: `${planChange.description.split(' - ASSINADO EM')[0]} - ASSINADO DIGITALMENTE EM ${new Date().toLocaleDateString('pt-BR')}`
        })
        .eq("id", selectedPlanChangeForSignature);

      if (error) {
        console.error("Erro ao assinar mudança de plano:", error);
        toast({
          title: "Erro",
          description: "Erro ao assinar mudança de plano",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Mudança de Plano Assinada!",
        description: "Mudança de plano assinada digitalmente com sucesso",
      });

      setShowSignatureModal(false);
      setSelectedPlanChangeForSignature(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao assinar:", error);
      toast({
        title: "Erro",
        description: "Erro ao assinar mudança de plano",
        variant: "destructive",
      });
    } finally {
      setSigningPlanChange(null);
    }
  };

  const getCurrentContractorData = async () => {
    try {
      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .eq("contract_id", contractId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao carregar dados do contratante:", error);
      return null;
    }
  };

  const handlePlanChangeRejection = async (reason: string) => {
    if (!selectedPlanChangeId) return;

    try {
      setRejectingPlanChange(selectedPlanChangeId);

      const { error } = await supabase
        .from('contractor_rejections')
        .insert({
          contract_id: contractId,
          contractor_id: contractorId,
          rejection_type: 'plan_change',
          plan_change_id: selectedPlanChangeId,
          reason: reason,
          rejected_at: new Date().toISOString()
        });

      if (error) {
        console.error("Erro ao rejeitar mudança de plano:", error);
        toast({
          title: "Erro",
          description: "Erro ao rejeitar mudança de plano. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Mudança de Plano Rejeitada",
        description: "A mudança de plano foi rejeitada com sucesso. O administrador será notificado.",
        variant: "default",
      });

      await loadData();
    } catch (error) {
      console.error("Erro ao rejeitar mudança de plano:", error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar mudança de plano. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setRejectingPlanChange(null);
      setSelectedPlanChangeId(null);
    }
  };

  const getStatusBadge = (planChange: ContractAddon) => {
    const rejection = rejectedPlanChanges.find(r => r.plan_change_id === planChange.id);
    if (rejection) {
      if (rejection.review_status === 'approved') {
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Rejeição Aprovada</Badge>;
      } else if (rejection.review_status === 'rejected') {
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejeição Rejeitada</Badge>;
      } else {
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Rejeitado</Badge>;
      }
    }

    const isSigned = planChange.description?.includes('ASSINADO DIGITALMENTE EM') || 
                     (planChange.plan_change_details && 
                      typeof planChange.plan_change_details === 'object' && 
                      planChange.plan_change_details !== null &&
                      'digital_signature' in planChange.plan_change_details);

    if (isSigned) {
      return <Badge variant="default" className="bg-green-600">
        <Shield className="w-3 h-3 mr-1" />
        Assinado Digitalmente
      </Badge>;
    }
    
    return <Badge variant="secondary">Pendente Assinatura Digital</Badge>;
  };

  const isPlanChangeRejected = (planChangeId: string) => {
    return rejectedPlanChanges.some(r => r.plan_change_id === planChangeId);
  };

  const getPlanChangeRejection = (planChangeId: string) => {
    return rejectedPlanChanges.find(r => r.plan_change_id === planChangeId);
  };

  const getReviewStatusDisplay = (rejection: any) => {
    if (!rejection.review_status || rejection.review_status === 'pending') {
      return {
        title: "Rejeição em Análise",
        description: "Sua rejeição foi enviada e está sendo analisada pelo administrador. Aguarde o retorno.",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        textColor: "text-amber-800",
        icon: <Clock className="w-4 h-4" />
      };
    } else if (rejection.review_status === 'approved') {
      return {
        title: "Rejeição Aprovada",
        description: "O administrador concordou com sua rejeição. A mudança de plano será revista.",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
        icon: <CheckCircle className="w-4 h-4" />
      };
    } else {
      return {
        title: "Rejeição Não Aceita",
        description: "O administrador não concordou com sua rejeição. Veja a explicação abaixo.",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800",
        icon: <AlertTriangle className="w-4 h-4" />
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (planChanges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Mudanças do Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma mudança de plano encontrada
            </h3>
            <p className="text-gray-600">
              Não há mudanças de plano registradas para este contrato.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Mudanças do Plano
            <Badge variant="outline">{planChanges.length} mudanças</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {planChanges.map((planChange, index) => {
        const isRejected = isPlanChangeRejected(planChange.id);
        const rejection = getPlanChangeRejection(planChange.id);
        const isSigned = planChange.description?.includes('ASSINADO DIGITALMENTE EM') || 
                         (planChange.plan_change_details && 
                          typeof planChange.plan_change_details === 'object' && 
                          planChange.plan_change_details !== null &&
                          'digital_signature' in planChange.plan_change_details);

        return (
          <Card key={planChange.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Mudança do Plano
                  {getStatusBadge(planChange)}
                </CardTitle>
                {!isSigned && !isRejected && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSelectedPlanChangeId(planChange.id);
                        setShowRejectionModal(true);
                      }}
                      disabled={rejectingPlanChange === planChange.id}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      {rejectingPlanChange === planChange.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rejeitando...
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Rejeitar
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={() => handleOpenDigitalSignature(planChange.id)}
                      disabled={signingPlanChange === planChange.id}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {signingPlanChange === planChange.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Assinando...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Assinar com Certificado Digital
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <span className="text-gray-600 font-medium">Valor Anterior:</span>
                  <p className="text-lg font-semibold">{planChange.previous_value ? formatCurrency(planChange.previous_value) : 'N/A'}</p>
                </div>
                <div className="text-center">
                  <span className="text-gray-600 font-medium">Novo Valor:</span>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(planChange.new_value)}</p>
                </div>
                <div className="text-center">
                  <span className="text-gray-600 font-medium">Data da Solicitação:</span>
                  <p className="font-semibold flex items-center justify-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(planChange.request_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-gray-600 font-medium">Descrição:</span>
                <p className="text-gray-800 mt-1">
                  {planChange.description.split(' - ASSINADO DIGITALMENTE EM')[0]}
                </p>
              </div>

              {/* Seção de Assinatura Digital */}
              {isSigned && planChange.plan_change_details && (
                <div className="bg-gradient-to-r from-green-50 to-purple-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Mudança Assinada Digitalmente
                  </h4>
                  {(() => {
                    const digitalSignature = (planChange.plan_change_details as any)?.digital_signature;
                    if (digitalSignature) {
                      return (
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 font-medium mb-1">Assinado por:</p>
                              <p className="text-green-700 font-semibold">{digitalSignature.contractor_name}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium mb-1">CPF:</p>
                              <p className="text-green-700">{digitalSignature.contractor_cpf}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium mb-1">Data/Hora da Assinatura:</p>
                              <p className="text-green-700">{new Date(digitalSignature.signed_at).toLocaleDateString('pt-BR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium mb-1">Método:</p>
                              <div className="flex items-center gap-1">
                                <Shield className="w-4 h-4 text-purple-600" />
                                <p className="text-purple-700 font-semibold">Certificado Digital ICP-Brasil</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="text-xs text-gray-600 mb-1">Hash da Assinatura Digital:</p>
                            <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                              {digitalSignature.signature_data?.substring(0, 100)}...
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {isRejected && rejection && (
                <div className="space-y-4 mb-4">
                  {(() => {
                    const reviewStatus = getReviewStatusDisplay(rejection);
                    return (
                      <div className={`${reviewStatus.bgColor} border ${reviewStatus.borderColor} rounded-lg p-4`}>
                        <h4 className={`font-medium ${reviewStatus.textColor} mb-2 flex items-center gap-2`}>
                          {reviewStatus.icon}
                          {reviewStatus.title}
                        </h4>
                        <p className={`text-sm ${reviewStatus.textColor} mb-2`}>
                          {reviewStatus.description}
                        </p>
                        
                        {rejection.admin_explanation && (
                          <div className="mt-3">
                            <p className={`text-sm font-medium ${reviewStatus.textColor} mb-1`}>
                              Explicação do administrador:
                            </p>
                            <div className="bg-white p-2 rounded border border-gray-200">
                              <p className="text-sm text-gray-700">{rejection.admin_explanation}</p>
                            </div>
                          </div>
                        )}
                        
                        {rejection.reviewed_at && (
                          <p className={`text-xs ${reviewStatus.textColor} mt-2`}>
                            Revisado em: {new Date(rejection.reviewed_at).toLocaleDateString('pt-BR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Seu Motivo de Rejeição Original
                    </h4>
                    <div className="text-sm text-gray-700 space-y-2">
                      <div className="bg-white p-2 rounded border border-gray-200">
                        <p>{rejection.reason}</p>
                      </div>
                      <p className="text-xs text-gray-600">
                        Rejeitado em: {new Date(rejection.rejected_at).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {planChange.plan_change_details && (
                <PlanChangeDetails addon={planChange} contractData={contractData} />
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Modal de Assinatura Digital */}
      {showSignatureModal && selectedPlanChangeForSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Assinatura Digital da Mudança de Plano
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSignatureModal(false);
                    setSelectedPlanChangeForSignature(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
              
              <SignatureMethodSelector
                onSelectMethod={(method) => {
                  // Já estamos no fluxo de certificado digital, então ir direto para a assinatura
                }}
                onCancel={() => {
                  setShowSignatureModal(false);
                  setSelectedPlanChangeForSignature(null);
                }}
              />
              
              <div className="mt-6">
                <UnifiedDigitalSignature
                  contractData={contractData}
                  onSignatureComplete={handleDigitalSignatureComplete}
                  onCancel={() => {
                    setShowSignatureModal(false);
                    setSelectedPlanChangeForSignature(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <ReviewNotificationModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        reviewData={reviewModalData}
      />

      <ContractRejectionModal
        isOpen={showRejectionModal}
        onClose={() => {
          setShowRejectionModal(false);
          setSelectedPlanChangeId(null);
        }}
        onReject={handlePlanChangeRejection}
        title="Rejeitar Mudança de Plano"
        description="Por favor, informe o motivo da rejeição desta mudança de plano. Esta informação será enviada ao administrador para análise."
      />
    </div>
  );
};

export default ContractorPlanChanges;
