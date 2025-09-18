
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, Eye, FileText, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RejectionDetailsModal from "./rejection-review/RejectionDetailsModal";
import ReviewDecisionModal from "./rejection-review/ReviewDecisionModal";

interface Contract {
  contract_number: string;
  monthly_value: string;
  status: string;
}

interface Contractor {
  name: string;
  responsible_name: string;
}

interface Rejection {
  id: string;
  contract_id: string;
  contractor_id: string;
  reason: string;
  rejection_type: string;
  review_status: string;
  rejected_at: string;
  admin_explanation?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  contracts?: Contract | null;
  contractors?: Contractor | null;
}

const RejectionReview = () => {
  const [rejections, setRejections] = useState<Rejection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRejection, setSelectedRejection] = useState<Rejection | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { toast } = useToast();

  const fetchRejections = async () => {
    try {
      console.log("🔍 Buscando rejeições...");
      
      // Buscar rejeições primeiro
      const { data: rejectionsData, error: rejectionsError } = await supabase
        .from("contractor_rejections")
        .select("*")
        .order("rejected_at", { ascending: false });

      if (rejectionsError) {
        console.error("❌ Erro ao buscar rejeições:", rejectionsError);
        throw rejectionsError;
      }

      console.log("✅ Rejeições encontradas:", rejectionsData?.length || 0);

      if (!rejectionsData || rejectionsData.length === 0) {
        setRejections([]);
        return;
      }

      // Buscar contratos separadamente
      const contractIds = rejectionsData.map(r => r.contract_id).filter(Boolean);
      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select("id, contract_number, monthly_value, status")
        .in("id", contractIds);

      if (contractsError) {
        console.error("⚠️ Erro ao buscar contratos:", contractsError);
      }

      // Buscar contratantes separadamente
      const contractorIds = rejectionsData.map(r => r.contractor_id).filter(Boolean);
      const { data: contractorsData, error: contractorsError } = await supabase
        .from("contractors")
        .select("id, name, responsible_name")
        .in("id", contractorIds);

      if (contractorsError) {
        console.error("⚠️ Erro ao buscar contratantes:", contractorsError);
      }

      // Verificar se há revisões de justificativa para cada rejeição
      const rejectionIds = rejectionsData.map(r => r.id);
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("justification_reviews")
        .select("rejection_id, review_status, reviewed_at, admin_explanation")
        .in("rejection_id", rejectionIds);

      if (reviewsError) {
        console.error("⚠️ Erro ao buscar revisões:", reviewsError);
      }

      // Combinar dados das rejeições com contratos, contratantes e revisões
      const combinedRejections = rejectionsData.map(rejection => {
        const contract = contractsData?.find(c => c.id === rejection.contract_id);
        const contractor = contractorsData?.find(c => c.id === rejection.contractor_id);
        const review = reviewsData?.find(r => r.rejection_id === rejection.id);
        
        return {
          ...rejection,
          // Se houver revisão, usar o status da revisão, senão manter o original
          review_status: review?.review_status || rejection.review_status || 'pending',
          reviewed_at: review?.reviewed_at || rejection.reviewed_at,
          admin_explanation: review?.admin_explanation || rejection.admin_explanation,
          contracts: contract ? {
            contract_number: contract.contract_number,
            monthly_value: contract.monthly_value,
            status: contract.status
          } : null,
          contractors: contractor ? {
            name: contractor.name,
            responsible_name: contractor.responsible_name
          } : null
        };
      });

      console.log("✅ Dados combinados finais:", combinedRejections);
      setRejections(combinedRejections);
    } catch (error) {
      console.error("❌ Erro geral ao buscar rejeições:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar rejeições",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejections();
  }, []);

  const handleViewDetails = (rejection: Rejection) => {
    setSelectedRejection(rejection);
    setShowDetailsModal(true);
  };

  const handleReview = (rejection: Rejection) => {
    setSelectedRejection(rejection);
    setShowReviewModal(true);
  };

  const handleReviewComplete = () => {
    setShowReviewModal(false);
    setSelectedRejection(null);
    fetchRejections();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "plan_change":
        return "Mudança de Plano";
      case "contract_modification":
        return "Modificação de Contrato";
      case "contract":
        return "Contrato";
      case "cancellation":
        return "Cancelamento";
      default:
        return type;
    }
  };

  const pendingRejections = rejections.filter(r => r.review_status === "pending");
  const reviewedRejections = rejections.filter(r => r.review_status !== "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando rejeições...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revisão de Rejeições</h2>
          <p className="text-gray-600">Gerencie e revise rejeições de contratantes</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            {pendingRejections.length} Pendentes
          </Badge>
          <Badge variant="outline">
            {reviewedRejections.length} Revisadas
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pendentes ({pendingRejections.length})</TabsTrigger>
          <TabsTrigger value="reviewed">Revisadas ({reviewedRejections.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRejections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma rejeição pendente</h3>
                <p className="text-gray-600">Todas as rejeições foram revisadas.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRejections.map((rejection) => (
                <Card key={rejection.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Contrato {rejection.contracts?.contract_number || 'N/A'}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(rejection.review_status)}
                        <Badge variant="outline">{getTypeLabel(rejection.rejection_type)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>
                          {rejection.contractors?.name || 'Empresa não encontrada'} - {rejection.contractors?.responsible_name || 'Responsável não encontrado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>Valor: R$ {rejection.contracts?.monthly_value || 'N/A'}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">Motivo da Rejeição:</p>
                        <p className="text-sm text-gray-600">{rejection.reason}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Rejeitado em: {new Date(rejection.rejected_at).toLocaleDateString("pt-BR")}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(rejection)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReview(rejection)}
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Revisar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {reviewedRejections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma rejeição revisada</h3>
                <p className="text-gray-600">As rejeições revisadas aparecerão aqui.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reviewedRejections.map((rejection) => (
                <Card key={rejection.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Contrato {rejection.contracts?.contract_number || 'N/A'}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(rejection.review_status)}
                        <Badge variant="outline">{getTypeLabel(rejection.rejection_type)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>
                          {rejection.contractors?.name || 'Empresa não encontrada'} - {rejection.contractors?.responsible_name || 'Responsável não encontrado'}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">Motivo da Rejeição:</p>
                        <p className="text-sm text-gray-600">{rejection.reason}</p>
                      </div>
                      {rejection.admin_explanation && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-700 mb-1">Explicação do Admin:</p>
                          <p className="text-sm text-blue-600">{rejection.admin_explanation}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Revisado em: {rejection.reviewed_at ? new Date(rejection.reviewed_at).toLocaleDateString("pt-BR") : "N/A"}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(rejection)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <RejectionDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        rejection={selectedRejection}
      />

      <ReviewDecisionModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        rejection={selectedRejection}
        onComplete={handleReviewComplete}
      />
    </div>
  );
};

export default RejectionReview;
