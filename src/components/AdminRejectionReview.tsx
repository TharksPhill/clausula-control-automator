import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit,
  Save,
  X,
  MessageSquare,
  Clock,
  User,
  Building,
  FileText,
  Loader2,
  Plus,
  Trash2,
  ThumbsDown,
  ThumbsUp,
  PenTool
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ContractPreviewModal from '@/components/ContractPreviewModal';

const AdminRejectionReview = () => {
  const { toast } = useToast();
  const [rejections, setRejections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminResponses, setAdminResponses] = useState<{[key: string]: string}>({});
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContractData, setSelectedContractData] = useState<any>(null);
  const [selectedContractorData, setSelectedContractorData] = useState<any>(null);
  const [editingContract, setEditingContract] = useState<string | null>(null);
  const [contractEdits, setContractEdits] = useState<{[key: string]: any}>({});

  useEffect(() => {
    loadRejections();
  }, []);

  const loadRejections = async () => {
    try {
      setLoading(true);
      console.log("🔍 Carregando rejeições...");
      
      const { data: rejectionsData, error: rejectionsError } = await supabase
        .from('contractor_rejections')
        .select('*')
        .order('rejected_at', { ascending: false });

      if (rejectionsError) {
        console.error("❌ Erro ao carregar rejeições:", rejectionsError);
        throw rejectionsError;
      }

      console.log("📋 Rejeições encontradas:", rejectionsData?.length || 0);

      const enrichedRejections = await Promise.all(
        (rejectionsData || []).map(async (rejection) => {
          try {
            const { data: contractData, error: contractError } = await supabase
              .from('contracts')
              .select(`
                *,
                companies!contracts_company_id_fkey (
                  id,
                  name
                )
              `)
              .eq('id', rejection.contract_id)
              .single();

            if (contractError) {
              console.error(`❌ Erro ao carregar contrato ${rejection.contract_id}:`, contractError);
            }

            const { data: contractorData, error: contractorError } = await supabase
              .from('contractors')
              .select('*')
              .eq('id', rejection.contractor_id)
              .single();

            if (contractorError) {
              console.error(`❌ Erro ao carregar contratante ${rejection.contractor_id}:`, contractorError);
            }

            const { data: allContractors, error: allContractorsError } = await supabase
              .from('contractors')
              .select('*')
              .eq('contract_id', rejection.contract_id);

            if (allContractorsError) {
              console.error(`❌ Erro ao carregar todos os contratantes:`, allContractorsError);
            }

            return {
              ...rejection,
              contracts: contractData || null,
              contractors: contractorData || null,
              allContractors: allContractors || []
            };
          } catch (error) {
            console.error(`❌ Erro ao enriquecer rejeição ${rejection.id}:`, error);
            return {
              ...rejection,
              contracts: null,
              contractors: null,
              allContractors: []
            };
          }
        })
      );

      console.log("✅ Rejeições enriquecidas:", enrichedRejections.length);
      setRejections(enrichedRejections);
    } catch (error: any) {
      console.error("❌ Erro completo ao carregar rejeições:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar rejeições. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendNotificationEmail = async (rejectionId: string, status: 'rejected' | 'contract_revised', explanation?: string) => {
    try {
      const rejection = rejections.find(r => r.id === rejectionId);
      if (!rejection || !rejection.contracts) {
        console.log("❌ Dados insuficientes para enviar email");
        return;
      }

      console.log("📧 Enviando email de notificação...");
      
      const emailData = status === 'rejected' ? {
        type: 'rejection_rejected',
        title: 'Solicitação de Revisão Recusada',
        message: `Sua solicitação de revisão para o contrato ${rejection.contracts.contract_number} foi recusada pela administração.`,
        custom_subject: `❌ Solicitação recusada - Contrato ${rejection.contracts.contract_number}`
      } : {
        type: 'contract_revised',
        title: 'Contrato Revisado - Pronto para Assinatura',
        message: `O contrato ${rejection.contracts.contract_number} foi revisado conforme sua solicitação e está pronto para assinatura.`,
        custom_subject: `✅ Contrato revisado - ${rejection.contracts.contract_number} pronto para assinatura`
      };
      
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          user_email: rejection.contracts.user_id,
          ...emailData,
          contract_number: rejection.contracts.contract_number,
          admin_explanation: explanation
        }
      });

      if (error) {
        console.error("❌ Erro ao enviar email:", error);
      } else {
        console.log("✅ Email enviado com sucesso:", data);
      }
    } catch (error) {
      console.error("❌ Erro ao enviar email de notificação:", error);
    }
  };

  const handleRejectRequest = async (rejectionId: string, explanation: string) => {
    try {
      setProcessingId(rejectionId);
      console.log(`❌ Recusando solicitação: ${rejectionId}`);
      
      const { data, error } = await supabase
        .from('contractor_rejections')
        .update({
          review_status: 'rejected',
          admin_explanation: explanation,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin'
        })
        .eq('id', rejectionId)
        .select();

      if (error) {
        console.error("❌ Erro ao processar recusa:", error);
        throw error;
      }

      console.log("✅ Solicitação recusada com sucesso:", data);

      await sendNotificationEmail(rejectionId, 'rejected', explanation);

      const rejection = rejections.find(r => r.id === rejectionId);
      if (rejection && rejection.contracts) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: rejection.contracts.user_id,
            contract_id: rejection.contract_id,
            type: 'rejection_rejected',
            title: 'Solicitação de Revisão Recusada',
            message: `Sua solicitação de revisão para o contrato ${rejection.contracts.contract_number} foi recusada. Motivo: ${explanation}`,
            is_read: false
          });

        if (notifError) {
          console.error("❌ Erro ao criar notificação:", notifError);
        }
      }

      toast({
        title: "Solicitação Recusada",
        description: "A solicitação de revisão foi recusada. O contratante foi notificado.",
      });

      await loadRejections();
      setExpandedId(null);
      setAdminResponses(prev => ({ ...prev, [rejectionId]: '' }));
    } catch (error: any) {
      console.error("❌ Erro ao recusar solicitação:", error);
      toast({
        title: "Erro",
        description: `Erro ao recusar solicitação: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewContract = async (rejection: any) => {
    try {
      if (rejection.contracts && rejection.contractors) {
        console.log("📄 Usando dados já carregados para visualização");
        setSelectedContractData(rejection.contracts);
        setSelectedContractorData(rejection.contractors);
        setShowContractModal(true);
        return;
      }

      console.log("🔍 Buscando dados do contrato para visualização...");
      
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          companies!contracts_company_id_fkey(*)
        `)
        .eq('id', rejection.contract_id)
        .single();

      if (contractError) {
        console.error("❌ Erro ao carregar contrato:", contractError);
        throw contractError;
      }

      const { data: contractor, error: contractorError } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', rejection.contractor_id)
        .single();

      if (contractorError) {
        console.error("❌ Erro ao carregar contratante:", contractorError);
        throw contractorError;
      }

      setSelectedContractData(contract);
      setSelectedContractorData(contractor);
      setShowContractModal(true);
    } catch (error: any) {
      console.error("❌ Erro ao carregar dados do contrato:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do contrato. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditContract = (rejectionId: string, contractData: any, allContractors: any[]) => {
    if (!contractData) {
      console.error("❌ Dados do contrato não disponíveis para edição");
      toast({
        title: "Erro",
        description: "Dados do contrato não disponíveis. Tente recarregar a página.",
        variant: "destructive",
      });
      return;
    }

    setEditingContract(rejectionId);
    setContractEdits(prev => ({
      ...prev,
      [rejectionId]: {
        contractNumber: contractData.contract_number || '',
        employeeCount: contractData.employee_count || '',
        cnpjCount: contractData.cnpj_count || '',
        monthlyValue: contractData.monthly_value || '',
        trialDays: contractData.trial_days || '',
        startDate: contractData.start_date || '',
        renewalDate: contractData.renewal_date || '',
        paymentStartDate: contractData.payment_start_date || '',
        paymentDay: contractData.payment_day || '',
        planType: contractData.plan_type || 'mensal',
        semestralDiscount: contractData.semestral_discount || '0',
        anualDiscount: contractData.anual_discount || '0',
        
        contractors: allContractors.map(contractor => ({
          id: contractor.id,
          name: contractor.name || '',
          cnpj: contractor.cnpj || '',
          city: contractor.city || '',
          state: contractor.state || '',
          address: contractor.address || '',
          responsibleName: contractor.responsible_name || '',
          responsibleCpf: contractor.responsible_cpf || '',
          responsibleRg: contractor.responsible_rg || ''
        }))
      }
    }));
  };

  const addContractor = (rejectionId: string) => {
    setContractEdits(prev => ({
      ...prev,
      [rejectionId]: {
        ...prev[rejectionId],
        contractors: [
          ...prev[rejectionId].contractors,
          {
            id: `new-${Date.now()}`,
            name: '',
            cnpj: '',
            city: '',
            state: '',
            address: '',
            responsibleName: '',
            responsibleCpf: '',
            responsibleRg: ''
          }
        ]
      }
    }));
  };

  const removeContractor = (rejectionId: string, contractorIndex: number) => {
    setContractEdits(prev => ({
      ...prev,
      [rejectionId]: {
        ...prev[rejectionId],
        contractors: prev[rejectionId].contractors.filter((_: any, index: number) => index !== contractorIndex)
      }
    }));
  };

  const updateContractor = (rejectionId: string, contractorIndex: number, field: string, value: string) => {
    setContractEdits(prev => ({
      ...prev,
      [rejectionId]: {
        ...prev[rejectionId],
        contractors: prev[rejectionId].contractors.map((contractor: any, index: number) =>
          index === contractorIndex ? { ...contractor, [field]: value } : contractor
        )
      }
    }));
  };

  const handleSaveContractEdits = async (rejectionId: string, contractId: string) => {
    try {
      setProcessingId(rejectionId);
      
      const edits = contractEdits[rejectionId];
      if (!edits) return;

      console.log("💾 Salvando alterações e marcando como revisado...");

      // Atualizar dados básicos do contrato
      const contractPayload = {
        contract_number: edits.contractNumber,
        employee_count: edits.employeeCount,
        cnpj_count: edits.cnpjCount,
        monthly_value: edits.monthlyValue,
        trial_days: edits.trialDays,
        start_date: edits.startDate,
        renewal_date: edits.renewalDate,
        payment_start_date: edits.paymentStartDate,
        payment_day: edits.paymentDay,
        plan_type: edits.planType,
        semestral_discount: edits.semestralDiscount,
        anual_discount: edits.anualDiscount
      };

      const { error: contractError } = await supabase
        .from('contracts')
        .update(contractPayload)
        .eq('id', contractId);

      if (contractError) {
        console.error("❌ Erro ao salvar alterações do contrato:", contractError);
        throw contractError;
      }

      // Atualizar contratantes
      const { error: deleteError } = await supabase
        .from('contractors')
        .delete()
        .eq('contract_id', contractId);

      if (deleteError) {
        console.error("❌ Erro ao deletar contratantes existentes:", deleteError);
        throw deleteError;
      }

      if (edits.contractors && edits.contractors.length > 0) {
        const contractorsPayload = edits.contractors.map((contractor: any) => ({
          contract_id: contractId,
          name: contractor.name,
          cnpj: contractor.cnpj,
          city: contractor.city,
          state: contractor.state,
          address: contractor.address,
          responsible_name: contractor.responsibleName,
          responsible_cpf: contractor.responsibleCpf,
          responsible_rg: contractor.responsibleRg || ''
        }));

        const { error: contractorsError } = await supabase
          .from('contractors')
          .insert(contractorsPayload);

        if (contractorsError) {
          console.error("❌ Erro ao salvar contratantes:", contractorsError);
          throw contractorsError;
        }
      }

      // Marcar a rejeição como aceita e revisada
      const { error: rejectionError } = await supabase
        .from('contractor_rejections')
        .update({
          review_status: 'approved',
          admin_explanation: 'Contrato revisado conforme solicitação. Pronto para assinatura.',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin'
        })
        .eq('id', rejectionId);

      if (rejectionError) {
        console.error("❌ Erro ao atualizar status da rejeição:", rejectionError);
        throw rejectionError;
      }

      const rejection = rejections.find(r => r.id === rejectionId);
      if (rejection && rejection.contracts) {
        // Criar notificação de contrato pronto para assinatura
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: rejection.contracts.user_id,
            contract_id: contractId,
            type: 'contract_ready_to_sign',
            title: 'Contrato Revisado - Pronto para Assinatura',
            message: `O contrato ${rejection.contracts.contract_number} foi revisado conforme sua solicitação e está pronto para assinatura. Acesse o link para revisar e assinar.`,
            is_read: false
          });

        if (notifError) {
          console.error("❌ Erro ao criar notificação:", notifError);
        }

        // Enviar email de notificação
        await sendNotificationEmail(rejectionId, 'contract_revised');
      }

      toast({
        title: "Contrato Revisado com Sucesso! ✅",
        description: "O contrato foi revisado e o contratante foi notificado que está pronto para assinatura.",
      });

      setEditingContract(null);
      setContractEdits(prev => {
        const newEdits = { ...prev };
        delete newEdits[rejectionId];
        return newEdits;
      });
      
      await loadRejections();
    } catch (error: any) {
      console.error("❌ Erro ao salvar alterações:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar alterações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Revisão Aceita</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">❌ Solicitação Recusada</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⏳ Aguardando Resposta</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">Carregando solicitações de revisão...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Solicitações de Revisão de Contratos</h1>
      </div>

      {rejections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma solicitação de revisão
            </h3>
            <p className="text-gray-600">
              Não há solicitações de revisão pendentes no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rejections.map((rejection) => (
            <Card key={rejection.id} className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Contrato #{rejection.contracts?.contract_number || rejection.contract_id?.substring(0, 8) || 'N/A'}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {rejection.contractors?.name || 'Empresa não disponível'}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {rejection.contractors?.responsible_name || 'Responsável não disponível'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(rejection.rejected_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(rejection.review_status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Solicitação do Contratante:
                  </h4>
                  <p className="text-orange-700 text-sm">{rejection.reason}</p>
                </div>

                {rejection.review_status !== 'pending' && rejection.admin_explanation && (
                  <div className={`p-4 rounded-lg border ${
                    rejection.review_status === 'approved' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <h4 className={`font-medium mb-2 flex items-center gap-2 ${
                      rejection.review_status === 'approved' 
                        ? 'text-green-800' 
                        : 'text-red-800'
                    }`}>
                      {rejection.review_status === 'approved' ? (
                        <>
                          <ThumbsUp className="h-4 w-4" />
                          Revisão Aceita - Resposta da Administração:
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="h-4 w-4" />
                          Solicitação Recusada - Motivo:
                        </>
                      )}
                    </h4>
                    <p className={`text-sm ${
                      rejection.review_status === 'approved' 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      {rejection.admin_explanation}
                    </p>
                    <p className={`text-xs mt-2 ${
                      rejection.review_status === 'approved' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      Respondido em {formatDate(rejection.reviewed_at)}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => handleViewContract(rejection)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Contrato
                  </Button>

                  {rejection.review_status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleEditContract(rejection.id, rejection.contracts, rejection.allContractors)}
                        className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                        disabled={!rejection.contracts}
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        Aceitar e Revisar
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => setExpandedId(expandedId === rejection.id ? null : rejection.id)}
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        Recusar Solicitação
                      </Button>
                    </>
                  )}
                </div>

                {/* Formulário completo de edição do contrato */}
                {editingContract === rejection.id && contractEdits[rejection.id] && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                      <PenTool className="h-4 w-4" />
                      Revisando Contrato - Aceita a Solicitação
                    </h4>
                    <p className="text-sm text-green-700 mb-4">
                      Faça as alterações necessárias no contrato. Ao salvar, o contratante será notificado que o contrato revisado está pronto para assinatura.
                    </p>
                    
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">Básico</TabsTrigger>
                        <TabsTrigger value="contractors">Contratantes</TabsTrigger>
                        <TabsTrigger value="service">Serviço</TabsTrigger>
                        <TabsTrigger value="payment">Pagamento</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="basic" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Número do Contrato
                            </Label>
                            <Input
                              value={contractEdits[rejection.id]?.contractNumber || ''}
                              onChange={(e) => setContractEdits(prev => ({
                                ...prev,
                                [rejection.id]: {
                                  ...prev[rejection.id],
                                  contractNumber: e.target.value
                                }
                              }))}
                            />
                          </div>
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Funcionários
                            </Label>
                            <Input
                              value={contractEdits[rejection.id]?.employeeCount || ''}
                              onChange={(e) => setContractEdits(prev => ({
                                ...prev,
                                [rejection.id]: {
                                  ...prev[rejection.id],
                                  employeeCount: e.target.value
                                }
                              }))}
                            />
                          </div>
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              CNPJs
                            </Label>
                            <Input
                              value={contractEdits[rejection.id]?.cnpjCount || ''}
                              onChange={(e) => setContractEdits(prev => ({
                                ...prev,
                                [rejection.id]: {
                                  ...prev[rejection.id],
                                  cnpjCount: e.target.value
                                }
                              }))}
                            />
                          </div>
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Dias de Teste
                            </Label>
                            <Input
                              value={contractEdits[rejection.id]?.trialDays || ''}
                              onChange={(e) => setContractEdits(prev => ({
                                ...prev,
                                [rejection.id]: {
                                  ...prev[rejection.id],
                                  trialDays: e.target.value
                                }
                              }))}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="contractors" className="space-y-4 mt-4">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium text-gray-700">Contratantes</h5>
                          <Button
                            size="sm"
                            onClick={() => addContractor(rejection.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          {contractEdits[rejection.id]?.contractors?.map((contractor: any, index: number) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                              <div className="flex justify-between items-center">
                                <h6 className="font-medium text-gray-700">Contratante {index + 1}</h6>
                                {contractEdits[rejection.id].contractors.length > 1 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeContractor(rejection.id, index)}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-sm">Nome da Empresa</Label>
                                  <Input
                                    value={contractor.name}
                                    onChange={(e) => updateContractor(rejection.id, index, 'name', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">CNPJ</Label>
                                  <Input
                                    value={contractor.cnpj}
                                    onChange={(e) => updateContractor(rejection.id, index, 'cnpj', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">Cidade</Label>
                                  <Input
                                    value={contractor.city}
                                    onChange={(e) => updateContractor(rejection.id, index, 'city', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">Estado</Label>
                                  <Input
                                    value={contractor.state}
                                    onChange={(e) => updateContractor(rejection.id, index, 'state', e.target.value)}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label className="text-sm">Endereço</Label>
                                  <Input
                                    value={contractor.address}
                                    onChange={(e) => updateContractor(rejection.id, index, 'address', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">Nome do Responsável</Label>
                                  <Input
                                    value={contractor.responsibleName}
                                    onChange={(e) => updateContractor(rejection.id, index, 'responsibleName', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">CPF do Responsável</Label>
                                  <Input
                                    value={contractor.responsibleCpf}
                                    onChange={(e) => updateContractor(rejection.id, index, 'responsibleCpf', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="service" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Data de Início
                            </Label>
                            <Input
                              type="date"
                              value={contractEdits[rejection.id]?.startDate || ''}
                              onChange={(e) => setContractEdits(prev => ({
                                ...prev,
                                [rejection.id]: {
                                  ...prev[rejection.id],
                                  startDate: e.target.value
                                }
                              }))}
                            />
                          </div>
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Data de Renovação
                            </Label>
                            <Input
                              type="date"
                              value={contractEdits[rejection.id]?.renewalDate || ''}
                              onChange={(e) => setContractEdits(prev => ({
                                ...prev,
                                [rejection.id]: {
                                  ...prev[rejection.id],
                                  renewalDate: e.target.value
                                }
                              }))}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="payment" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Valor Mensal
                            </Label>
                            <Input
                              value={contractEdits[rejection.id]?.monthlyValue || ''}
                              onChange={(e) => setContractEdits(prev => ({
                                ...prev,
                                [rejection.id]: {
                                  ...prev[rejection.id],
                                  monthlyValue: e.target.value
                                }
                              }))}
                            />
                          </div>
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Tipo de Plano
                            </Label>
                            <Select
                              value={contractEdits[rejection.id]?.planType || 'mensal'}
                              onValueChange={(value) => setContractEdits(prev => ({
                                ...prev,
                                [rejection.id]: {
                                  ...prev[rejection.id],
                                  planType: value
                                }
                              }))}
                            >
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
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Dia de Pagamento
                            </Label>
                            <Input
                              value={contractEdits[rejection.id]?.paymentDay || ''}
                              onChange={(e) => setContractEdits(prev => ({
                                ...prev,
                                [rejection.id]: {
                                  ...prev[rejection.id],
                                  paymentDay: e.target.value
                                }
                              }))}
                            />
                          </div>
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Data Início Pagamento
                            </Label>
                            <Input
                              type="date"
                              value={contractEdits[rejection.id]?.paymentStartDate || ''}
                              onChange={(e) => setContractEdits(prev => ({
                                ...prev,
                                [rejection.id]: {
                                  ...prev[rejection.id],
                                  paymentStartDate: e.target.value
                                }
                              }))}
                            />
                          </div>
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Desconto Semestral (%)
                            </Label>
                            <Input
                              value={contractEdits[rejection.id]?.semestralDiscount || ''}
                              onChange={(e) => setContractEdits(prev => ({
                                ...prev,
                                [rejection.id]: {
                                  ...prev[rejection.id],
                                  semestralDiscount: e.target.value
                                }
                              }))}
                            />
                          </div>
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-1">
                              Desconto Anual (%)
                            </Label>
                            <Input
                              value={contractEdits[rejection.id]?.anualDiscount || ''}
                              onChange={(e) => setContractEdits(prev => ({
                                ...prev,
                                [rejection.id]: {
                                  ...prev[rejection.id],
                                  anualDiscount: e.target.value
                                }
                              }))}
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                      <Button
                        onClick={() => handleSaveContractEdits(rejection.id, rejection.contract_id)}
                        disabled={processingId === rejection.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingId === rejection.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar Revisão e Notificar Contratante
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingContract(null)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Formulário de recusa */}
                {expandedId === rejection.id && rejection.review_status === 'pending' && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4" />
                      Recusar Solicitação de Revisão
                    </h4>
                    <p className="text-sm text-red-700 mb-3">
                      Explique ao contratante por que a solicitação de revisão não pode ser atendida:
                    </p>
                    <Textarea
                      placeholder="Ex: A cláusula solicitada não pode ser alterada devido às políticas da empresa, ou o valor proposto está fora dos parâmetros aceitáveis..."
                      value={adminResponses[rejection.id] || ''}
                      onChange={(e) => setAdminResponses(prev => ({
                        ...prev,
                        [rejection.id]: e.target.value
                      }))}
                      className="mb-4"
                      rows={3}
                    />
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleRejectRequest(rejection.id, adminResponses[rejection.id])}
                        disabled={processingId === rejection.id || !adminResponses[rejection.id]?.trim()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {processingId === rejection.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Enviar Recusa ao Contratante
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => setExpandedId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de visualização do contrato */}
      {showContractModal && selectedContractData && selectedContractorData && (
        <ContractPreviewModal
          isOpen={showContractModal}
          onClose={() => {
            setShowContractModal(false);
            setSelectedContractData(null);
            setSelectedContractorData(null);
          }}
          contractData={selectedContractData}
          contractorData={selectedContractorData}
          onDownload={() => {
            toast({
              title: "Download",
              description: "Funcionalidade de download em desenvolvimento.",
            });
          }}
        />
      )}
    </div>
  );
};

export default AdminRejectionReview;
