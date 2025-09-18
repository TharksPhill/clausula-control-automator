
import React, { useEffect, useState } from "react";
import { useContract } from "@/context/ContractContext";
import { supabase } from "@/integrations/supabase/client";
import DocuSignSyncButton from "./DocuSignSyncButton";

interface ContractSignaturesProps {
  className?: string;
  planChangeSignatures?: any[];
}

interface SignedContract {
  id: string;
  contractor_id: string;
  signed_at: string;
  signature_data: string;
  contractor?: {
    responsible_name: string;
    name: string;
  };
}

const ContractSignatures: React.FC<ContractSignaturesProps> = ({ 
  className = "",
  planChangeSignatures = []
}) => {
  const { contractData } = useContract();
  const { contractors, companyData } = contractData;
  const [signedContracts, setSignedContracts] = useState<SignedContract[]>([]);
  const [autentiqueDocuments, setAutentiqueDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  console.log("🔍 ContractSignatures - contractData:", contractData);
  console.log("🔍 ContractSignatures - contractNumber:", contractData.contractNumber);

  // Buscar assinaturas registradas
  const fetchSignedContracts = async () => {
    console.log("🔍 Iniciando busca de assinaturas...");
    
    if (!contractData.contractNumber) {
      console.log("❌ Número do contrato não encontrado");
      setLoading(false);
      return;
    }

    try {
      console.log("🔍 Buscando contrato com número:", contractData.contractNumber);
      
      // Primeiro buscar o contrato pelo número
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('id')
        .eq('contract_number', contractData.contractNumber)
        .maybeSingle();

      console.log("🔍 Resultado da busca do contrato:", { contract, contractError });

      if (contractError || !contract) {
        console.log("❌ Contrato não encontrado ou erro:", contractError);
        setLoading(false);
        return;
      }

      console.log("✅ Contrato encontrado, ID:", contract.id);

      // Buscar assinaturas do contrato
      const { data: signatures, error: signaturesError } = await supabase
        .from('signed_contracts')
        .select(`
          id,
          contractor_id,
          signed_at,
          signature_data,
          is_cancelled,
          contractor:contractors(
            responsible_name,
            name
          )
        `)
        .eq('contract_id', contract.id)
        .eq('is_cancelled', false);

      console.log("🔍 Resultado da busca de assinaturas:", { signatures, signaturesError });

      // Buscar documentos Autentique assinados
      const { data: autentiqueDocuments, error: autentiqueError } = await supabase
        .from('autentique_documents')
        .select(`
          id,
          contract_id,
          contractor_id,
          document_id,
          public_id,
          signer_name,
          signer_email,
          status,
          signed_at,
          autentique_data
        `)
        .eq('contract_id', contract.id)
        .eq('status', 'signed');

      console.log("🔍 Resultado da busca de documentos Autentique:", { autentiqueDocuments, autentiqueError });

      if (signaturesError) {
        console.error("❌ Erro ao buscar assinaturas:", signaturesError);
      } else {
        console.log("✅ Assinaturas encontradas:", signatures);
        setSignedContracts(signatures || []);
      }

      if (autentiqueError) {
        console.error("❌ Erro ao buscar documentos Autentique:", autentiqueError);
      } else {
        console.log("✅ Documentos Autentique encontrados:", autentiqueDocuments);
        setAutentiqueDocuments(autentiqueDocuments || []);
      }
    } catch (error) {
      console.error("❌ Erro geral ao buscar assinaturas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignedContracts();
  }, [contractData.contractNumber]);

  // Verificar se um contratante específico já assinou
  const getSignatureForContractor = (contractorId: string) => {
    const signature = signedContracts.find(signature => signature.contractor_id === contractorId);
    console.log(`🔍 Buscando assinatura para contratante ${contractorId}:`, signature);
    return signature;
  };

  // Verificar se há assinatura Autentique para o contratante
  const getAutentiqueSignatureForContractor = (contractorId: string) => {
    const autentiqueDoc = autentiqueDocuments.find(doc => doc.contractor_id === contractorId);
    console.log(`🔍 Buscando assinatura Autentique para contratante ${contractorId}:`, autentiqueDoc);
    return autentiqueDoc;
  };

  // Verificar se é uma assinatura DocuSign
  const isDocuSignSignature = (signatureData: string) => {
    return signatureData && signatureData.startsWith('docusign_');
  };

  // Determinar se usar singular ou plural para contratantes
  const contractorTermLabel = contractors.length === 1 ? "CONTRATANTE" : "CONTRATANTES";

  console.log("🔍 Render - signedContracts:", signedContracts);
  console.log("🔍 Render - loading:", loading);

  return (
    <div className={`signatures-container ${className} space-y-8 mt-8`}>
      {/* Botão de sincronização DocuSign */}
      <div className="flex justify-end mb-4">
        <DocuSignSyncButton onSyncComplete={fetchSignedContracts} />
      </div>

      {/* Texto do termo de assinatura */}
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold mb-3 border-b border-gray-400 pb-1">TERMO DE ASSINATURA</h3>
        <p className="text-sm text-gray-700 mb-4">
          As partes abaixo identificadas declaram ter lido e compreendido integralmente os termos e condições do contrato mencionado, concordando em cumpri-los em sua totalidade.
        </p>
        <p className="text-sm text-gray-600 mb-6">
          Araraquara, {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* Debug info - remover em produção */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 p-4 rounded text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Contract Number: {contractData.contractNumber}</p>
          <p>Loading: {loading ? 'Sim' : 'Não'}</p>
          <p>Signed Contracts: {signedContracts.length}</p>
          <p>Contractors: {contractors.length}</p>
        </div>
      )}

      {/* Assinaturas dos contratantes */}
      {contractors.map((contractor, index) => {
        const signature = getSignatureForContractor(contractor.id);
        const autentiqueSignature = getAutentiqueSignatureForContractor(contractor.id);
        const isDocuSign = signature && isDocuSignSignature(signature.signature_data);
        const hasAnySignature = signature || autentiqueSignature;
        
        console.log(`🔍 Renderizando contratante ${index}:`, {
          contractor: contractor.id,
          hasSignature: !!signature,
          hasAutentiqueSignature: !!autentiqueSignature,
          isDocuSign,
          signature,
          autentiqueSignature
        });
        
        return (
          <div key={contractor.id} className="signature-block text-left mb-12 page-break-inside-avoid">
            <div className="signature-name text-sm font-medium mb-6">
              {contractors.length === 1 ? (
                <>Assinatura do(a) responsável do {contractorTermLabel}: {contractor.responsibleName || contractor.name}</>
              ) : (
                <>Assinatura do(a) responsável do CONTRATANTE {index + 1}: {contractor.responsibleName || contractor.name}</>
              )}
            </div>
            
            {/* Linha de assinatura visual */}
            <div className="signature-line-area">
              <div className="w-96 h-12 border-2 border-black bg-gray-50 relative mb-2">
                {hasAnySignature ? (
                  // Mostrar informações da assinatura registrada
                  <div className={`absolute inset-0 flex flex-col justify-center px-2 ${
                    autentiqueSignature ? 'bg-orange-50' : 
                    isDocuSign ? 'bg-blue-50' : 'bg-green-50'
                  }`}>
                    <div className={`text-xs font-medium ${
                      autentiqueSignature ? 'text-orange-700' : 
                      isDocuSign ? 'text-blue-700' : 'text-green-700'
                    }`}>
                      ✓ {
                        autentiqueSignature ? 'Assinado via Autentique' :
                        isDocuSign ? 'Assinado via DocuSign' : 'Assinado'
                      } em {
                        autentiqueSignature ? 
                          new Date(autentiqueSignature.signed_at).toLocaleDateString('pt-BR') + ' às ' + new Date(autentiqueSignature.signed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) :
                          new Date(signature.signed_at).toLocaleDateString('pt-BR') + ' às ' + new Date(signature.signed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      }
                    </div>
                    <div className="text-xs text-gray-600">
                      Por: {
                        autentiqueSignature ? autentiqueSignature.signer_name :
                        signature.contractor?.responsible_name || signature.contractor?.name || 'Responsável'
                      }
                    </div>
                    {autentiqueSignature && (
                      <div className="text-xs text-orange-600">
                        Doc ID: {autentiqueSignature.public_id}
                      </div>
                    )}
                    {isDocuSign && (
                      <div className="text-xs text-blue-600">
                        ID: {signature.signature_data.replace('docusign_', '')}
                      </div>
                    )}
                  </div>
                ) : (
                  // Mostrar placeholder para assinatura pendente
                  <div className="absolute top-1/2 left-2 transform -translate-y-1/2 text-xs text-gray-400">
                    {loading ? 'Verificando assinatura...' : 'Pendente de assinatura'}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-600 text-center">
                (Assinatura e carimbo do responsável)
              </div>
            </div>
          </div>
        );
      })}

      {/* Assinatura da empresa contratada */}
      <div className="signature-block text-left mb-12 page-break-inside-avoid">
        <div className="signature-name text-sm font-medium mb-6">
          Assinatura do(a) responsável da CONTRATADA: {companyData?.responsibleName || "Empresa Padrão"}
        </div>
        
        {/* Linha de assinatura visual da empresa (sempre vazia por enquanto) */}
        <div className="signature-line-area">
          <div className="w-96 h-12 border-2 border-black bg-gray-50 relative mb-2">
            <div className="absolute top-1/2 left-2 transform -translate-y-1/2 text-xs text-gray-400">
              Assinatura da empresa
            </div>
          </div>
          <div className="text-xs text-gray-600 text-center">
            (Assinatura e carimbo do responsável)
          </div>
        </div>
      </div>

      {/* Finalização */}
      <div className="text-center text-sm text-gray-600 mt-8 border-t pt-4">
        <p>Este Termo de Assinatura tem a finalidade de confirmar o acordo mútuo entre as partes e será considerado parte integrante do contrato.</p>
      </div>
    </div>
  );
};

export default ContractSignatures;
