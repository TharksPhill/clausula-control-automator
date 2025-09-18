import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Shield, CheckCircle, ArrowLeft, AlertTriangle, XCircle } from "lucide-react";
import ContractPreview from "@/components/ContractPreview";
import { ContractProvider } from "@/context/ContractContext";
import ContractSignature from "@/components/ContractSignature";
import ContractorSidebar from "@/components/ContractorSidebar";
import ContractorPlanChanges from "@/components/ContractorPlanChanges";
import ContractorDownloads from "@/components/ContractorDownloads";
import ContractRejectionModal from "@/components/ContractRejectionModal";
import ReviewNotificationModal from "@/components/ReviewNotificationModal";

const ContractView = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState<any>(null);
  const [contractorData, setContractorData] = useState<any>(null);
  const [allContractors, setAllContractors] = useState<any[]>([]);
  const [tokenData, setTokenData] = useState<any>(null);
  const [step, setStep] = useState<'contract' | 'signature' | 'success'>('contract');
  const [currentSection, setCurrentSection] = useState<string>('contract');
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [signedPlanChanges, setSignedPlanChanges] = useState<any[]>([]);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionData, setRejectionData] = useState<any>(null);
  const [rejectionReview, setRejectionReview] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasShownReviewModal, setHasShownReviewModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contractAlreadySigned, setContractAlreadySigned] = useState(false);
  const [signatureInfo, setSignatureInfo] = useState<any>(null);

  const validateToken = async () => {
    if (!contractId) {
      console.log("❌ Contract ID não encontrado");
      navigate("/");
      return;
    }

    try {
      console.log("🔍 Validando token:", contractId);
      
      const { data: tokenCheck, error: tokenCheckError } = await supabase
        .from('contract_access_tokens')
        .select('*')
        .eq('token', contractId)
        .maybeSingle();

      console.log("🔍 Verificação direta do token na tabela:", { tokenCheck, tokenCheckError });

      if (tokenCheckError) {
        console.error("❌ Erro ao verificar token diretamente:", tokenCheckError);
        toast({
          title: "Erro",
          description: "Erro ao verificar acesso ao contrato. Tente novamente.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      if (!tokenCheck) {
        console.log("❌ Token não encontrado na tabela contract_access_tokens");
        toast({
          title: "Link inválido",
          description: "Este link não foi encontrado no sistema.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      if (new Date(tokenCheck.expires_at) < new Date()) {
        console.log("❌ Token expirado");
        toast({
          title: "Link expirado",
          description: "Este link expirou. Solicite um novo link.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      console.log("✅ Token válido, carregando dados do contrato...");
      setTokenData(tokenCheck);
      await loadContractData(tokenCheck.contract_id, tokenCheck.contractor_id);
    } catch (error) {
      console.error("❌ Erro geral na validação do token:", error);
      toast({
        title: "Erro",
        description: "Erro ao validar acesso ao contrato. Tente novamente.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadContractData = async (contractDataId: string, contractorId: string) => {
    try {
      console.log("📋 Carregando dados do contrato:", { contractDataId, contractorId });
      
      // Verificar se o contrato já foi assinado
      await checkContractSignatureStatus(contractDataId, contractorId);
      
      // Verificar se o contrato existe
      const { data: contractCheck, error: contractCheckError } = await supabase
        .from("contracts")
        .select("id, contract_number, status")
        .eq("id", contractDataId)
        .maybeSingle();

      console.log("📋 Verificação inicial do contrato:", { contractCheck, contractCheckError });

      if (contractCheckError) {
        console.error("❌ Erro ao verificar contrato:", contractCheckError);
        throw new Error("Erro ao verificar contrato: " + contractCheckError.message);
      }

      if (!contractCheck) {
        console.log("❌ Contrato não encontrado com ID:", contractDataId);
        toast({
          title: "Contrato não encontrado",
          description: "O contrato associado a este link não foi encontrado no sistema.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      console.log("✅ Contrato encontrado:", contractCheck);

      // Carregar dados completos do contrato COM a empresa
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select(`
          *,
          company:companies(*)
        `)
        .eq("id", contractDataId)
        .maybeSingle();

      console.log("📋 Resultado do carregamento completo do contrato:", { contract, contractError });
      console.log("💰 VALOR MENSAL NO BANCO DE DADOS:", contract?.monthly_value);
      console.log("🏢 DADOS DA EMPRESA CARREGADOS:", contract?.company);

      if (contractError) {
        console.error("❌ Erro ao carregar contrato completo:", contractError);
        throw new Error("Erro ao carregar contrato: " + contractError.message);
      }

      if (!contract) {
        console.log("❌ Contrato completo não encontrado");
        toast({
          title: "Contrato não encontrado",
          description: "O contrato associado a este link não foi encontrado.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Carregar TODOS os contratantes do contrato
      const { data: allContractorsData, error: allContractorsError } = await supabase
        .from("contractors")
        .select("*")
        .eq("contract_id", contractDataId);

      console.log("👥 Resultado do carregamento de TODOS os contratantes:", { allContractorsData, allContractorsError });

      if (allContractorsError) {
        console.error("❌ Erro ao carregar todos os contratantes:", allContractorsError);
        throw new Error("Erro ao carregar contratantes: " + allContractorsError.message);
      }

      if (!allContractorsData || allContractorsData.length === 0) {
        console.log("❌ Nenhum contratante encontrado para o contrato:", contractDataId);
        toast({
          title: "Contratantes não encontrados",
          description: "Nenhum contratante foi encontrado para este contrato.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Carregar o contratante específico do token (para identificar quem está acessando)
      const { data: specificContractor, error: contractorError } = await supabase
        .from("contractors")
        .select("*")
        .eq("id", contractorId)
        .maybeSingle();

      console.log("👤 Resultado do carregamento do contratante específico:", { specificContractor, contractorError });

      if (contractorError) {
        console.error("❌ Erro ao carregar contratante específico:", contractorError);
        throw new Error("Erro ao carregar contratante: " + contractorError.message);
      }

      if (!specificContractor) {
        console.log("❌ Contratante específico não encontrado com ID:", contractorId);
        toast({
          title: "Contratante não encontrado",
          description: "O contratante associado a este link não foi encontrado.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      console.log("✅ Dados carregados com sucesso:", { 
        contract, 
        specificContractor, 
        allContractors: allContractorsData 
      });
      
      setContractData(contract);
      setContractorData(specificContractor);
      setAllContractors(allContractorsData);

      const tempProfile = {
        id: `temp_${contractorId}`,
        contractor_id: contractorId,
        first_name: specificContractor.responsible_name?.split(' ')[0] || 'Responsável',
        last_name: specificContractor.responsible_name?.split(' ').slice(1).join(' ') || '',
        email: 'contato@empresa.com'
      };
      setCurrentProfile(tempProfile);

      // Carregar mudanças de plano assinadas
      await loadSignedPlanChanges(contract.id);

      // Verificar rejeições e revisões pendentes
      await loadRejectionStatus(contractDataId, contractorId);
    } catch (error: any) {
      console.error("❌ Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar dados do contrato. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const checkContractSignatureStatus = async (contractDataId: string, contractorId: string) => {
    try {
      const { data: signatureData, error } = await supabase
        .from("signed_contracts")
        .select("id, created_at, is_cancelled")
        .eq("contract_id", contractDataId)
        .eq("contractor_id", contractorId)
        .eq("is_cancelled", false)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao verificar assinatura:", error);
        return;
      }

      if (signatureData) {
        console.log("✅ Contrato já foi assinado:", signatureData);
        setContractAlreadySigned(true);
        setSignatureInfo(signatureData);
      } else {
        console.log("📝 Contrato ainda não foi assinado");
        setContractAlreadySigned(false);
        setSignatureInfo(null);
      }
    } catch (error) {
      console.error("Erro ao verificar status da assinatura:", error);
    }
  };

  const loadRejectionStatus = async (contractDataId: string, contractorId: string) => {
    try {
      console.log("🔍 Verificando status de rejeições...");

      // Buscar a rejeição mais recente do contratante
      const { data: rejectionData, error: rejectionError } = await supabase
        .from("contractor_rejections")
        .select("*")
        .eq("contract_id", contractDataId)
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rejectionError && rejectionError.code !== 'PGRST116') {
        console.error("❌ Erro ao buscar rejeições:", rejectionError);
        return;
      }

      if (rejectionData) {
        console.log("📋 Rejeição encontrada:", rejectionData);
        setRejectionData(rejectionData);
        setIsRejected(true);

        // Buscar revisão da rejeição se existir
        const { data: reviewData, error: reviewError } = await supabase
          .from("justification_reviews")
          .select("*")
          .eq("rejection_id", rejectionData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (reviewError && reviewError.code !== 'PGRST116') {
          console.error("❌ Erro ao buscar revisão:", reviewError);
          return;
        }

        if (reviewData) {
          console.log("📝 Revisão encontrada:", reviewData);
          setRejectionReview({
            ...reviewData,
            reason: rejectionData.reason // Adicionar o motivo original da rejeição
          });

          // Mostrar modal automaticamente se há uma revisão e ainda não foi mostrado
          if (!hasShownReviewModal) {
            setShowReviewModal(true);
            setHasShownReviewModal(true);
          }
        }
      }

    } catch (error) {
      console.error("❌ Erro ao verificar status de rejeições:", error);
    }
  };

  const loadSignedPlanChanges = async (contractDataId: string) => {
    try {
      const { data: addons, error } = await supabase
        .from('contract_addons')
        .select('*')
        .eq('contract_id', contractDataId)
        .eq('addon_type', 'plan_change');

      if (!error && addons) {
        const signed = addons.filter(addon => {
          if (addon.description && typeof addon.description === 'string' && addon.description.includes('ASSINADO EM')) {
            return true;
          }
          
          if (addon.plan_change_details && 
              typeof addon.plan_change_details === 'object' && 
              addon.plan_change_details !== null &&
              'signature' in addon.plan_change_details) {
            return true;
          }
          
          return false;
        });
        setSignedPlanChanges(signed);
      }
    } catch (error) {
      console.error("Erro ao carregar mudanças de plano assinadas:", error);
    }
  };

  useEffect(() => {
    if (contractId) {
      validateToken();
    }
  }, [contractId]);

  const handleSignatureComplete = async () => {
    console.log("✅ Assinatura concluída - as notificações serão criadas automaticamente pelos triggers do banco");
    setStep('success');
    setContractAlreadySigned(true);
  };

  const handleSectionNavigate = (section: string) => {
    setCurrentSection(section);
    if (section === 'signature') {
      setStep('signature');
    } else {
      setStep('contract');
    }
    // Fechar sidebar no mobile após navegação
    setSidebarOpen(false);
  };

  const handleContractRejection = async (reason: string) => {
    try {
      const { error } = await supabase
        .from('contractor_rejections')
        .insert({
          contract_id: contractData.id,
          contractor_id: contractorData.id,
          rejection_type: 'contract',
          reason: reason,
          rejected_at: new Date().toISOString()
        });

      if (error) {
        console.error("Erro ao rejeitar contrato:", error);
        toast({
          title: "Erro",
          description: "Erro ao rejeitar contrato. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setIsRejected(true);
      setRejectionData({
        reason,
        rejected_at: new Date().toISOString()
      });

      toast({
        title: "Contrato Rejeitado",
        description: "O contrato foi rejeitado com sucesso. O administrador será notificado.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao rejeitar contrato:", error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar contrato. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-700">Carregando contrato...</p>
        </div>
      </div>
    );
  }

  if (step === 'signature') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <ContractSignature
          contractData={contractData}
          contractorData={contractorData}
          currentProfile={currentProfile}
          onSignatureComplete={handleSignatureComplete}
          onCancel={() => {
            setStep('contract');
            setCurrentSection('contract');
          }}
        />
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Contrato Assinado!
            </h2>
            <p className="text-gray-600 mb-2 text-lg">
              Sua assinatura foi registrada com sucesso.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Você receberá uma confirmação por email em breve.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setStep('contract');
                  setCurrentSection('downloads');
                }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-3 shadow-lg"
              >
                Ver Downloads
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/")} 
                className="w-full py-3"
              >
                Finalizar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contractData || !contractorData || !allContractors.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-700">Carregando dados do contrato...</p>
        </div>
      </div>
    );
  }

  console.log("🔍 CONTRACTVIEW: Dados brutos do contrato antes do mapeamento:", contractData);
  console.log("🔍 CONTRACTVIEW: Dados brutos dos contratantes antes do mapeamento:", allContractors);
  console.log("🔍 CONTRACTVIEW: Contratante específico (quem está acessando):", contractorData);
  console.log("🏢 CONTRACTVIEW: DADOS DA EMPRESA PARA MAPEAMENTO:", contractData?.company);

  // Mapear os dados do contrato com os dados corretos da empresa
  const editingContract = {
    id: contractData.id,
    contract_number: contractData.contract_number,
    employee_count: contractData.employee_count,
    cnpj_count: contractData.cnpj_count,
    monthly_value: contractData.monthly_value,
    trial_days: contractData.trial_days,
    start_date: contractData.start_date,
    renewal_date: contractData.renewal_date,
    payment_start_date: contractData.payment_start_date,
    payment_day: contractData.payment_day,
    plan_type: contractData.plan_type || 'mensal',
    semestral_discount: contractData.semestral_discount || '0',
    anual_discount: contractData.anual_discount || '0',
    contractors: allContractors.map(contractor => ({
      id: contractor.id,
      name: contractor.name || '',
      cnpj: contractor.cnpj || '',
      address: contractor.address || '',
      city: contractor.city || '',
      state: contractor.state || '',
      responsible_name: contractor.responsible_name || '',
      responsible_cpf: contractor.responsible_cpf || '',
      responsible_rg: contractor.responsible_rg || ''
    })),
    companyData: {
      name: contractData?.company?.name || "Empresa não informada",
      cnpj: contractData?.company?.cnpj || "",
      address: contractData?.company?.address || "", 
      city: contractData?.company?.city || "",
      state: contractData?.company?.state || "",
      responsibleName: contractData?.company?.responsible_name || "",
      phone: contractData?.company?.phone || "",
      email: contractData?.company?.email || "",
      website: contractData?.company?.website || "",
      logo: contractData?.company?.logo || ""
    },
    planChangeSignatures: signedPlanChanges
  };

  console.log("🔍 CONTRACTVIEW: Objeto editingContract mapeado com TODOS os dados:", editingContract);
  console.log("💰 CONTRACTVIEW: VALOR MENSAL NO editingContract:", editingContract.monthly_value);
  console.log("👥 CONTRACTVIEW: CONTRATANTES NO editingContract:", editingContract.contractors);
  console.log("🏢 CONTRACTVIEW: DADOS DA EMPRESA NO editingContract:", editingContract.companyData);
  console.log("📋 CONTRACTVIEW: MUDANÇAS DE PLANO ASSINADAS:", editingContract.planChangeSignatures);

  // Determinar se o contrato pode ser assinado
  const canSignContract = !contractAlreadySigned && (!isRejected || (rejectionReview && rejectionReview.review_status === 'approved'));
  
  // Determinar se pode mostrar o botão de rejeitar
  const canRejectContract = !contractAlreadySigned && (!isRejected || (rejectionReview && rejectionReview.review_status === 'rejected'));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Layout para Mobile */}
      <div className="md:hidden">
        {/* Header Mobile com toggle do sidebar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰ Menu
            </Button>
            <div className="text-center">
              <h1 className="font-semibold text-gray-900">Contrato #{contractData?.contract_number}</h1>
              <p className="text-xs text-gray-600">{contractorData?.name}</p>
            </div>
          </div>
        </div>

        {/* Overlay do Sidebar Mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Mobile */}
        <div className={`fixed left-0 top-0 z-50 h-full transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <ContractorSidebar
            contractData={contractData}
            contractorData={contractorData}
            onNavigate={handleSectionNavigate}
            currentSection={currentSection}
            linkExpiresAt={tokenData?.expires_at || ''}
          />
        </div>

        {/* Conteúdo Principal Mobile */}
        <main className="p-4">
          {currentSection === 'contract' && (
            <div>
              {/* ... keep existing code (contract signed message, rejection review messages, contract preview) */}
              {contractAlreadySigned && (
                <Card className="mb-4 border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 text-green-800 text-sm">
                          Contrato já Assinado
                        </h3>
                        <p className="mb-2 text-green-700 text-sm">
                          Este contrato foi assinado em {signatureInfo ? new Date(signatureInfo.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}.
                        </p>
                        <p className="text-xs text-green-600">
                          Você pode acessar a seção de Downloads para obter os documentos assinados.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {rejectionReview && rejectionReview.review_status === 'approved' && (
                <Card className="mb-4 border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 text-green-800 text-sm">
                          Rejeição Aprovada pelo Administrador
                        </h3>
                        <p className="mb-2 text-green-700 text-sm">
                          O administrador analisou sua rejeição e aprovou suas justificativas. Você pode prosseguir com a assinatura do contrato.
                        </p>
                        
                        <div className="bg-white p-3 rounded border mb-2">
                          <p className="text-xs font-medium mb-1 text-green-800">
                            Seu motivo original:
                          </p>
                          <p className="text-xs text-gray-700">{rejectionReview.reason}</p>
                        </div>

                        {rejectionReview.admin_explanation && (
                          <div className="bg-white p-3 rounded border">
                            <p className="text-xs font-medium mb-1 text-green-800">
                              Resposta do administrador:
                            </p>
                            <p className="text-xs text-gray-700">{rejectionReview.admin_explanation}</p>
                          </div>
                        )}

                        <p className="text-xs text-gray-600 mt-2">
                          Revisado em {rejectionReview.reviewed_at ? new Date(rejectionReview.reviewed_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {rejectionReview && rejectionReview.review_status === 'rejected' && (
                <Card className="mb-4 border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 text-red-800 text-sm">
                          Rejeição Não Aprovada pelo Administrador
                        </h3>
                        <p className="mb-2 text-red-700 text-sm">
                          O administrador analisou sua rejeição mas não aprovou as justificativas apresentadas.
                        </p>
                        
                        <div className="bg-white p-3 rounded border mb-2">
                          <p className="text-xs font-medium mb-1 text-red-800">
                            Seu motivo original:
                          </p>
                          <p className="text-xs text-gray-700">{rejectionReview.reason}</p>
                        </div>

                        {rejectionReview.admin_explanation && (
                          <div className="bg-white p-3 rounded border">
                            <p className="text-xs font-medium mb-1 text-red-800">
                              Resposta do administrador:
                            </p>
                            <p className="text-xs text-gray-700">{rejectionReview.admin_explanation}</p>
                          </div>
                        )}

                        <p className="text-xs text-gray-600 mt-2">
                          Revisado em {rejectionReview.reviewed_at ? new Date(rejectionReview.reviewed_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isRejected && rejectionData && !rejectionReview && (
                <Card className="border-blue-200 bg-blue-50 mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-800 mb-2 text-sm">Aguardando Revisão do Administrador</h3>
                        <p className="text-blue-700 mb-2 text-sm">
                          Você rejeitou este contrato em {new Date(rejectionData.rejected_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}.
                        </p>
                        <div className="bg-white p-3 rounded border border-blue-200">
                          <p className="text-xs font-medium text-blue-800 mb-1">Motivo da rejeição:</p>
                          <p className="text-xs text-blue-700">{rejectionData.reason}</p>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          O administrador foi notificado e está analisando suas justificativas. Você será notificado quando a revisão for concluída.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5" />
                    {contractAlreadySigned ? 'Contrato Assinado' : 'Revisão do Contrato'}
                  </CardTitle>
                  <p className="text-blue-100 text-sm">
                    {contractAlreadySigned 
                      ? 'Visualize o contrato assinado e acesse os downloads'
                      : 'Revise todos os termos antes de prosseguir'
                    }
                  </p>
                </CardHeader>
                <CardContent className="p-4">
                  <ContractProvider editingContract={editingContract}>
                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                      <ContractPreview />
                    </div>
                  </ContractProvider>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/")}
                  className="border-gray-300 hover:bg-gray-50 py-3"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                
                {contractAlreadySigned && (
                  <Button 
                    onClick={() => {
                      setCurrentSection('downloads');
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-3 shadow-lg"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ver Downloads
                  </Button>
                )}
                
                {canRejectContract && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowRejectionModal(true)}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50 py-3"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Rejeitar Contrato
                  </Button>
                )}
                
                {canSignContract && (
                  <Button 
                    onClick={() => setStep('signature')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 shadow-lg"
                  >
                    Prosseguir para Assinatura
                    <Shield className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {!canSignContract && !canRejectContract && !contractAlreadySigned && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-600 text-sm">
                      Aguardando revisão do administrador. Você será notificado quando a análise for concluída.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentSection === 'plan-changes' && (
            <ContractorPlanChanges
              contractId={contractData?.id}
              contractorId={contractorData?.id}
            />
          )}

          {currentSection === 'downloads' && (
            <ContractorDownloads
              contractId={contractData?.id}
              contractorId={contractorData?.id}
              contractData={contractData}
              contractorData={contractorData}
            />
          )}
        </main>
      </div>

      {/* Layout para Desktop */}
      <div className="hidden md:flex">
        <ContractorSidebar
          contractData={contractData}
          contractorData={contractorData}
          onNavigate={handleSectionNavigate}
          currentSection={currentSection}
          linkExpiresAt={tokenData?.expires_at || ''}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="flex-1 overflow-y-auto">
          <main className="p-8">
            {currentSection === 'contract' && (
              <div className="max-w-5xl mx-auto">
                {/* ... keep existing code (all status messages for desktop) */}
                {contractAlreadySigned && (
                  <Card className="mb-6 border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2 text-green-800">
                            Contrato já Assinado
                          </h3>
                          <p className="mb-3 text-green-700">
                            Este contrato foi assinado em {signatureInfo ? new Date(signatureInfo.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}.
                          </p>
                          <p className="text-sm text-green-600">
                            Você pode acessar a seção de Downloads para obter os documentos assinados.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {rejectionReview && rejectionReview.review_status === 'approved' && (
                  <Card className="mb-6 border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2 text-green-800">
                            Rejeição Aprovada pelo Administrador
                          </h3>
                          <p className="mb-3 text-green-700">
                            O administrador analisou sua rejeição e aprovou suas justificativas. Você pode prosseguir com a assinatura do contrato.
                          </p>
                          
                          <div className="bg-white p-3 rounded border mb-3">
                            <p className="text-sm font-medium mb-1 text-green-800">
                              Seu motivo original:
                            </p>
                            <p className="text-sm text-gray-700">{rejectionReview.reason}</p>
                          </div>

                          {rejectionReview.admin_explanation && (
                            <div className="bg-white p-3 rounded border">
                              <p className="text-sm font-medium mb-1 text-green-800">
                                Resposta do administrador:
                              </p>
                              <p className="text-sm text-gray-700">{rejectionReview.admin_explanation}</p>
                            </div>
                          )}

                          <p className="text-sm text-gray-600 mt-3">
                            Revisado em {rejectionReview.reviewed_at ? new Date(rejectionReview.reviewed_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {rejectionReview && rejectionReview.review_status === 'rejected' && (
                  <Card className="mb-6 border-red-200 bg-red-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2 text-red-800">
                            Rejeição Não Aprovada pelo Administrador
                          </h3>
                          <p className="mb-3 text-red-700">
                            O administrador analisou sua rejeição mas não aprovou as justificativas apresentadas.
                          </p>
                          
                          <div className="bg-white p-3 rounded border mb-3">
                            <p className="text-sm font-medium mb-1 text-red-800">
                              Seu motivo original:
                            </p>
                            <p className="text-sm text-gray-700">{rejectionReview.reason}</p>
                          </div>

                          {rejectionReview.admin_explanation && (
                            <div className="bg-white p-3 rounded border">
                              <p className="text-sm font-medium mb-1 text-red-800">
                                Resposta do administrador:
                              </p>
                              <p className="text-sm text-gray-700">{rejectionReview.admin_explanation}</p>
                            </div>
                          )}

                          <p className="text-sm text-gray-600 mt-3">
                            Revisado em {rejectionReview.reviewed_at ? new Date(rejectionReview.reviewed_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isRejected && rejectionData && !rejectionReview && (
                  <Card className="border-blue-200 bg-blue-50 mb-6">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-800 mb-2">Aguardando Revisão do Administrador</h3>
                          <p className="text-blue-700 mb-3">
                            Você rejeitou este contrato em {new Date(rejectionData.rejected_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}.
                          </p>
                          <div className="bg-white p-3 rounded border border-blue-200">
                            <p className="text-sm font-medium text-blue-800 mb-1">Motivo da rejeição:</p>
                            <p className="text-sm text-blue-700">{rejectionData.reason}</p>
                          </div>
                          <p className="text-sm text-blue-600 mt-3">
                            O administrador foi notificado e está analisando suas justificativas. Você será notificado quando a revisão for concluída.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Shield className="h-6 w-6" />
                      {contractAlreadySigned ? 'Contrato Assinado' : 'Revisão do Contrato'}
                    </CardTitle>
                    <p className="text-blue-100 text-sm">
                      {contractAlreadySigned 
                        ? 'Visualize o contrato assinado e acesse os downloads'
                        : 'Revise todos os termos antes de prosseguir para a assinatura'
                      }
                    </p>
                  </CardHeader>
                  <CardContent className="p-8">
                    <ContractProvider editingContract={editingContract}>
                      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                        <ContractPreview />
                      </div>
                    </ContractProvider>
                  </CardContent>
                </Card>

                <div className="flex justify-center gap-4 mt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/")}
                    className="border-gray-300 hover:bg-gray-50 px-6 py-3"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  
                  {contractAlreadySigned && (
                    <Button 
                      onClick={() => {
                        setCurrentSection('downloads');
                      }}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-3 shadow-lg"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Ver Downloads
                    </Button>
                  )}
                  
                  {canRejectContract && (
                    <Button 
                      variant="outline"
                      onClick={() => setShowRejectionModal(true)}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50 px-6 py-3"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Rejeitar Contrato
                    </Button>
                  )}
                  
                  {canSignContract && (
                    <Button 
                      onClick={() => setStep('signature')}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3 shadow-lg"
                    >
                      Prosseguir para Assinatura
                      <Shield className="w-4 h-4 ml-2" />
                    </Button>
                  )}

                  {!canSignContract && !canRejectContract && !contractAlreadySigned && (
                    <div className="text-center">
                      <p className="text-blue-600 text-sm mb-2">
                        Aguardando revisão do administrador. Você será notificado quando a análise for concluída.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentSection === 'plan-changes' && (
              <div className="max-w-5xl mx-auto">
                <ContractorPlanChanges
                  contractId={contractData?.id}
                  contractorId={contractorData?.id}
                />
              </div>
            )}

            {currentSection === 'downloads' && (
              <div className="max-w-5xl mx-auto">
                <ContractorDownloads
                  contractId={contractData?.id}
                  contractorId={contractorData?.id}
                  contractData={contractData}
                  contractorData={contractorData}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      <ReviewNotificationModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        reviewData={rejectionReview}
      />

      <ContractRejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onReject={handleContractRejection}
        title="Rejeitar Contrato"
        description="Por favor, informe o motivo da rejeição do contrato. Esta informação será enviada ao administrador para análise."
      />
    </div>
  );
};

export default ContractView;
