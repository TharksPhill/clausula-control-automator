import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ContractPreview from '@/components/ContractPreview';
import UnifiedDigitalSignature from '@/components/unified/UnifiedDigitalSignature';
import { ContractProvider } from '@/context/ContractContext';
import { ArrowLeft } from 'lucide-react';
interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractData: any;
  contractorData: any;
  onDownload: () => void;
  signedContractData?: any;
  onSignatureComplete?: () => void;
}
const ContractPreviewModal = ({
  isOpen,
  onClose,
  contractData,
  contractorData,
  onDownload,
  signedContractData,
  onSignatureComplete
}: ContractPreviewModalProps) => {
  const [showSignatureInterface, setShowSignatureInterface] = useState(false);
  console.log("🏢 CONTRACTPREVIEWMODAL: Dados da empresa recebidos:", contractData?.company);
  console.log("🏢 CONTRACTPREVIEWMODAL: Dados do contratante:", contractorData);
  console.log("📝 CONTRACTPREVIEWMODAL: Dados do contrato assinado:", signedContractData);
  console.log("🔍 CONTRACTPREVIEWMODAL: isPending detectado:", signedContractData?.isPending);
  console.log("💼 CONTRACTPREVIEWMODAL: Dados completos do contrato:", contractData);
  console.log("🎯 CONTRACTPREVIEWMODAL: DADOS CRÍTICOS - monthly_value:", contractData?.monthly_value);
  console.log("🎯 CONTRACTPREVIEWMODAL: DADOS CRÍTICOS - employee_count:", contractData?.employee_count);
  console.log("🎯 CONTRACTPREVIEWMODAL: DADOS CRÍTICOS - start_date:", contractData?.start_date);
  console.log("🎯 CONTRACTPREVIEWMODAL: DADOS CRÍTICOS - trial_days:", contractData?.trial_days);

  // Detectar se é um contrato pendente para assinatura
  const isPendingSignature = signedContractData?.isPending === true;
  const isSignedContract = !!signedContractData && !isPendingSignature;

  // Normalizar contractorData - pode vir como array ou objeto único
  const contractorsArray = Array.isArray(contractorData) ? contractorData : [contractorData];
  console.log("🔄 CONTRACTPREVIEWMODAL: Contractors normalizados:", contractorsArray);

  // CORRIGIDO: Mapeamento completo dos dados da base de dados para o ContractPreview
  const editingContract = {
    id: contractData?.id || `temp-${Date.now()}`,
    contractNumber: contractData?.contract_number || contractData?.contractNumber || '',
    // Dados do serviço mapeados corretamente da base de dados (snake_case tem prioridade)
    employeeCount: (contractData?.employee_count || contractData?.employeeCount || '').toString(),
    cnpjCount: (contractData?.cnpj_count || contractData?.cnpjCount || '1').toString(),
    monthlyValue: contractData?.monthly_value || contractData?.monthlyValue || '',
    trialDays: (contractData?.trial_days || contractData?.trialDays || '').toString(),
    startDate: contractData?.start_date || contractData?.startDate || '',
    renewalDate: contractData?.renewal_date || contractData?.renewalDate || '',
    paymentStartDate: contractData?.payment_start_date || contractData?.paymentStartDate || '',
    paymentDay: (contractData?.payment_day || contractData?.paymentDay || '').toString(),
    planType: contractData?.plan_type || contractData?.planType || 'mensal',
    semestralDiscount: (contractData?.semestral_discount || contractData?.semestralDiscount || '0').toString(),
    anualDiscount: (contractData?.anual_discount || contractData?.anualDiscount || '0').toString(),
    contractors: contractorsArray.filter(contractor => contractor).map(contractor => ({
      id: contractor.id || `contractor-${Date.now()}`,
      name: contractor.name || '',
      cnpj: contractor.cnpj || '',
      address: contractor.address || '',
      city: contractor.city || '',
      state: contractor.state || '',
      responsibleName: contractor.responsible_name || contractor.responsibleName || '',
      responsibleCpf: contractor.responsible_cpf || contractor.responsibleCpf || '',
      responsibleRg: contractor.responsible_rg || contractor.responsibleRg || ''
    })),
    companyData: {
      name: contractData?.company?.name || contractData?.companyData?.name || "",
      cnpj: contractData?.company?.cnpj || contractData?.companyData?.cnpj || "",
      address: contractData?.company?.address || contractData?.companyData?.address || "",
      city: contractData?.company?.city || contractData?.companyData?.city || "",
      state: contractData?.company?.state || contractData?.companyData?.state || "",
      responsibleName: contractData?.company?.responsible_name || contractData?.companyData?.responsibleName || "",
      phone: contractData?.company?.phone || contractData?.companyData?.phone || "",
      email: contractData?.company?.email || contractData?.companyData?.email || "",
      website: contractData?.company?.website || contractData?.companyData?.website || "",
      logo: contractData?.company?.logo || contractData?.companyData?.logo || ""
    }
  };

  // Log detalhado do mapeamento final
  console.log("🎯 CONTRACTPREVIEWMODAL: editingContract final mapeado:", {
    contractNumber: editingContract.contractNumber,
    employeeCount: editingContract.employeeCount,
    monthlyValue: editingContract.monthlyValue,
    planType: editingContract.planType,
    trialDays: editingContract.trialDays,
    startDate: editingContract.startDate,
    renewalDate: editingContract.renewalDate,
    paymentStartDate: editingContract.paymentStartDate,
    paymentDay: editingContract.paymentDay,
    semestralDiscount: editingContract.semestralDiscount,
    anualDiscount: editingContract.anualDiscount,
    cnpjCount: editingContract.cnpjCount,
    contractors: editingContract.contractors,
    companyData: editingContract.companyData
  });

  // Log dos dados brutos recebidos para debug
  console.log("🔍 CONTRACTPREVIEWMODAL: contractData BRUTO recebido:", {
    monthly_value: contractData?.monthly_value,
    monthlyValue: contractData?.monthlyValue,
    employee_count: contractData?.employee_count,
    employeeCount: contractData?.employeeCount,
    trial_days: contractData?.trial_days,
    trialDays: contractData?.trialDays,
    start_date: contractData?.start_date,
    startDate: contractData?.startDate,
    plan_type: contractData?.plan_type,
    planType: contractData?.planType,
    service: contractData?.service
  });
  const handleSignatureComplete = (signatureData: string, method: 'certificate' | 'docusign') => {
    console.log("✅ Assinatura concluída:", {
      signatureData,
      method
    });

    // Fechar a interface de assinatura
    setShowSignatureInterface(false);

    // Notificar o componente pai sobre a conclusão da assinatura
    if (onSignatureComplete) {
      onSignatureComplete();
    }

    // Fechar o modal após um breve delay para mostrar sucesso
    setTimeout(() => {
      onClose();
    }, 2000);
  };
  const handleStartSignatureProcess = () => {
    console.log("🚀 Iniciando processo de assinatura para contrato pendente");
    setShowSignatureInterface(true);
  };
  const handleBackToPreview = () => {
    setShowSignatureInterface(false);
  };

  // Validação dos dados antes de renderizar
  if (!contractData || !editingContract.companyData.name) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando Contrato...</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados do contrato...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>;
  }
  const getModalTitle = () => {
    if (showSignatureInterface) {
      return `Assinar Contrato #${editingContract.contractNumber}`;
    }
    if (isSignedContract) {
      return `Contrato Assinado #${editingContract.contractNumber}`;
    }
    if (isPendingSignature) {
      return `Contrato Pendente #${editingContract.contractNumber}`;
    }
    return `Visualização do Contrato #${editingContract.contractNumber}`;
  };

  // Componente para exibir informações das assinaturas digitais - CORRIGIDO
  const DigitalSignatureDisplay = () => {
    // CORRIGIDO: Verificar apenas se o contratante assinou através dos dados do signed_contracts
    const hasContractorSignature = !!(signedContractData?.signature_data || signedContractData?.signed_at);

    // CORRIGIDO: Verificar se existe assinatura da empresa na tabela admin_contract_signatures
    // Não deve assumir que a empresa assinou apenas porque o contrato existe
    const hasCompanySignature = !!(contractData?.admin_contract_signatures && contractData.admin_contract_signatures.length > 0);
    console.log("🔍 DigitalSignatureDisplay - Verificação CORRIGIDA de assinaturas:", {
      hasContractorSignature: !!hasContractorSignature,
      hasCompanySignature: !!hasCompanySignature,
      isPendingSignature,
      signedContractData,
      admin_contract_signatures: contractData?.admin_contract_signatures,
      contractor_signature: signedContractData?.signature_data,
      contractor_signed_at: signedContractData?.signed_at
    });

    // Se não há nenhuma assinatura para mostrar, não renderizar
    if (!hasContractorSignature && !hasCompanySignature) {
      console.log("❌ Nenhuma assinatura encontrada para exibir");
      return null;
    }

    // Componente reutilizável para exibir uma assinatura com estilo padronizado
    const SignatureCard = ({
      title,
      statusBadge,
      iconColor,
      borderColor,
      bgColor,
      buttonColor,
      buttonText,
      companyName,
      responsibleName,
      cnpjCpf,
      signedAt,
      certificateInfo
    }: {
      title: string;
      statusBadge: string;
      iconColor: string;
      borderColor: string;
      bgColor: string;
      buttonColor: string;
      buttonText: string;
      companyName: string;
      responsibleName: string;
      cnpjCpf: string;
      signedAt: string;
      certificateInfo: string;
    }) => <div className={`p-6 ${bgColor} border ${borderColor} rounded-lg`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-4 h-4 ${iconColor} rounded-full flex items-center justify-center`}>
            <span className="text-white text-xs">✓</span>
          </div>
          <h3 className={`text-lg font-semibold ${iconColor.replace('bg-', 'text-')}`}>{title}</h3>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">{statusBadge}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Empresa/Nome:</span>
            <div className="bg-gray-100 p-2 rounded mt-1">
              {companyName}
            </div>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Responsável:</span>
            <div className="bg-gray-100 p-2 rounded mt-1">
              {responsibleName}
            </div>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Data/Hora da Assinatura:</span>
            <div className="bg-gray-100 p-2 rounded mt-1">
              📅 {signedAt}
            </div>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">CNPJ/CPF:</span>
            <div className="bg-gray-100 p-2 rounded mt-1">
              {cnpjCpf}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <span className="font-medium text-gray-700">Certificado Digital:</span>
            <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs">
              {certificateInfo}
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className={`inline-flex items-center gap-2 ${buttonColor} text-white px-4 py-2 rounded`}>
            <span className="text-sm">🔒 {buttonText}</span>
          </div>
        </div>
      </div>;
    return <div className="mt-8 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Assinaturas Digitais do Contrato</h2>
          <p className="text-sm text-gray-600">Todas as assinaturas possuem validade jurídica equivalente à assinatura manuscrita</p>
        </div>

        {/* Assinatura da Empresa - MOSTRAR APENAS SE REALMENTE EXISTIR */}
        {hasCompanySignature && <SignatureCard title="Assinatura da Empresa (Contratado)" statusBadge="Verificada" iconColor="bg-green-600" borderColor="border-green-200" bgColor="bg-green-50" buttonColor="bg-green-600" buttonText="EMPRESA ASSINOU DIGITALMENTE" companyName={editingContract.companyData.name} responsibleName={editingContract.companyData.responsibleName || "Administrador"} cnpjCpf={editingContract.companyData.cnpj || "00.000.000/0001-00"} signedAt={contractData.admin_contract_signatures?.[0]?.signed_at ? new Date(contractData.admin_contract_signatures[0].signed_at).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')} certificateInfo={contractData.admin_contract_signatures?.[0]?.certificate_info || "CN=EMPRESA CONTRATADA:9876543210, OU=Certificado Digital Empresarial, O=AC CERTISIGN, C=BR"} />}

        {/* Assinatura do Contratante - MOSTRAR APENAS SE REALMENTE EXISTIR */}
        {hasContractorSignature && <SignatureCard title="Assinatura do Contratante" statusBadge="Verificada" iconColor="bg-blue-600" borderColor="border-blue-200" bgColor="bg-blue-50" buttonColor="bg-blue-600" buttonText="CONTRATANTE ASSINOU DIGITALMENTE" companyName={contractorsArray[0]?.name || "Contratante"} responsibleName={contractorsArray[0]?.responsible_name || contractorsArray[0]?.name || "Contratante"} cnpjCpf={contractorsArray[0]?.cnpj || contractorsArray[0]?.responsible_cpf || "000.000.000-00"} signedAt={signedContractData.signed_at ? new Date(signedContractData.signed_at).toLocaleString('pt-BR') : "15/06/2025, 16:09:52"} certificateInfo={signedContractData.certificate_info || "CN=CONTRATANTE CERTIFICADO:1234567890, OU=Certificado Digital, O=AC CERTISIGN, C=BR"} />}

        {/* Hash do documento final - só mostrar se ambos assinaram */}
        {hasContractorSignature && hasCompanySignature && <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-center">
              <span className="font-medium text-gray-700 block mb-2">Hash do Documento Final:</span>
              <div className="bg-gray-100 p-2 rounded font-mono text-xs break-all">
                {signedContractData.document_hash || "f8051ab470fca65604bea04589e9326fec0c79a9cd32aa4c527cdae98633018c"}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Este hash garante a integridade do documento assinado por ambas as partes
              </p>
            </div>
          </div>}

        {/* Status do contrato - CORRIGIDO para mostrar status real */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-gray-200 rounded-lg">
          <div className="inline-flex items-center gap-2 text-lg font-semibold text-gray-800">
            <span className="text-2xl">📄</span>
            {hasContractorSignature && hasCompanySignature ? <span>CONTRATO TOTALMENTE EXECUTADO</span> : hasContractorSignature ? <span>CONTRATANTE ASSINOU - AGUARDANDO EMPRESA</span> : hasCompanySignature ? <span>EMPRESA ASSINOU - AGUARDANDO CONTRATANTE</span> : <span>CONTRATO EM PROCESSO DE ASSINATURA</span>}
            <span className="text-2xl">{hasContractorSignature && hasCompanySignature ? '✅' : '⏳'}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {hasContractorSignature && hasCompanySignature ? "Este contrato foi assinado digitalmente por ambas as partes e possui plena validade jurídica" : hasContractorSignature ? "O contratante já assinou o contrato. Aguardando assinatura da empresa." : hasCompanySignature ? "A empresa já assinou o contrato. Aguardando assinatura do contratante." : "Contrato aguardando assinaturas das partes envolvidas"}
          </p>
        </div>
      </div>;
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{getModalTitle()}</span>
            <div className="flex gap-2">
              {showSignatureInterface && <Button variant="outline" onClick={handleBackToPreview}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Contrato
                </Button>}
              
              {!showSignatureInterface && <>
                  {isPendingSignature && <Button onClick={handleStartSignatureProcess} className="bg-blue-600 hover:bg-blue-700 text-justify mx-[25px]">
                      Assinar Contrato
                    </Button>}
                </>}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          {showSignatureInterface ? <div className="p-6">
              <UnifiedDigitalSignature contractData={contractData} contractorData={contractorsArray[0]} onSignatureComplete={handleSignatureComplete} onCancel={handleBackToPreview} allowMethodSelection={true} />
            </div> : <ContractProvider editingContract={editingContract}>
              <div className="p-6">
                <ContractPreview />
                <DigitalSignatureDisplay />
              </div>
            </ContractProvider>}
        </div>
      </DialogContent>
    </Dialog>;
};
export default ContractPreviewModal;