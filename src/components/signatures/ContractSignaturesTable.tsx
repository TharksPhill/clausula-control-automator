import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Download,
  Calendar,
  Building,
  GitCompare,
  FileSignature,
  Shield,
  User,
  XCircle,
  Trash2,
  Paperclip,
  ExternalLink
} from 'lucide-react';
import ContractsPagination from '../ContractsPagination';
import AutentiqueAttachModal from './AutentiqueAttachModal';
import { supabase } from '@/integrations/supabase/client';

interface ContractSignaturesTableProps {
  contracts: any[];
  loading: boolean;
  onViewSignature: (signature: any) => void;
  onCompareContracts: (contract: any) => void;
  onRefresh?: () => void;
  onBulkDelete?: (contractIds: string[]) => void;
}

const ContractSignaturesTable: React.FC<ContractSignaturesTableProps> = ({
  contracts,
  loading,
  onViewSignature,
  onCompareContracts,
  onRefresh,
  onBulkDelete
}) => {
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAutentiqueModal, setShowAutentiqueModal] = useState(false);
  const [selectedContractForAutentique, setSelectedContractForAutentique] = useState<any>(null);

  // Calcular contratos para a página atual
  const totalItems = contracts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContracts = contracts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedContracts([]); // Limpar seleção ao mudar de página
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Voltar para primeira página
    setSelectedContracts([]); // Limpar seleção
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const isDocuSignSignature = (signatureData: string) => {
    return signatureData && signatureData.startsWith('docusign_');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContracts(paginatedContracts.map(contract => contract.id));
    } else {
      setSelectedContracts([]);
    }
  };

  const handleSelectContract = (contractId: string, checked: boolean) => {
    if (checked) {
      setSelectedContracts([...selectedContracts, contractId]);
    } else {
      setSelectedContracts(selectedContracts.filter(id => id !== contractId));
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedContracts.length > 0) {
      onBulkDelete(selectedContracts);
      setSelectedContracts([]);
    }
  };

  const getSignatureStatus = (contract: any) => {
    const isSignedContract = contract.signed_contracts && contract.signed_contracts.length > 0;
    const signatureData = isSignedContract ? contract.signed_contracts[0] : null;
    
    console.log(`🔍 Verificando status do contrato ${contract.contract_number}:`, {
      isSignedContract,
      signatureData,
      signed_contracts_count: contract.signed_contracts?.length || 0,
      admin_contract_signatures_count: contract.admin_contract_signatures?.length || 0
    });
    
    const contractorSigned = isSignedContract;
    const companySigned = !!(
      contract.admin_contract_signatures && 
      contract.admin_contract_signatures.length > 0
    );

    return {
      contractorSigned,
      companySigned,
      isDocuSign: signatureData && isDocuSignSignature(signatureData.signature_data),
      signatureData,
      isFullySigned: contractorSigned && companySigned
    };
  };

  const renderSignatureStatusBadges = (status: any) => {
    const { contractorSigned, companySigned, isDocuSign } = status;
    
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-muted-foreground" />
          {contractorSigned ? (
            <Badge className={isDocuSign ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs" : "bg-green-500/10 text-green-600 dark:text-green-400 text-xs"}>
              {isDocuSign ? (
                <>
                  <Shield className="h-3 w-3 mr-1" />
                  DocuSign
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Assinado
                </>
              )}
            </Badge>
          ) : (
            <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Pendente
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Building className="h-3 w-3 text-muted-foreground" />
          {companySigned ? (
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Assinado
            </Badge>
          ) : (
            <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Pendente
            </Badge>
          )}
        </div>
      </div>
    );
  };

  const handleViewSignedContract = (contract: any) => {
    console.log("🔍 Visualizando contrato assinado:", contract);
    
    const signatureData = {
      id: contract.signed_contracts[0].id,
      signed_at: contract.signed_contracts[0].signed_at,
      ip_address: contract.signed_contracts[0].ip_address,
      user_agent: contract.signed_contracts[0].user_agent,
      signature_data: contract.signed_contracts[0].signature_data,
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        monthly_value: contract.monthly_value,
        plan_type: contract.plan_type,
        employee_count: contract.employee_count,
        cnpj_count: contract.cnpj_count,
        start_date: contract.start_date,
        renewal_date: contract.renewal_date,
        payment_start_date: contract.payment_start_date,
        payment_day: contract.payment_day,
        trial_days: contract.trial_days,
        semestral_discount: contract.semestral_discount,
        anual_discount: contract.anual_discount,
        created_at: contract.created_at,
        company: contract.company || {},
        admin_contract_signatures: contract.admin_contract_signatures || []
      },
      contractors: contract.contractors || []
    };
    
    console.log("📝 Dados preparados para visualização:", signatureData);
    onViewSignature(signatureData);
  };

  const handleViewPendingContract = (contract: any) => {
    console.log("🔍 Visualizando contrato pendente para assinatura:", contract);
    
    const contractData = {
      id: contract.id,
      contract_number: contract.contract_number,
      monthly_value: contract.monthly_value,
      plan_type: contract.plan_type,
      employee_count: contract.employee_count,
      cnpj_count: contract.cnpj_count,
      start_date: contract.start_date,
      renewal_date: contract.renewal_date,
      payment_start_date: contract.payment_start_date,
      payment_day: contract.payment_day,
      trial_days: contract.trial_days,
      semestral_discount: contract.semestral_discount,
      anual_discount: contract.anual_discount,
      created_at: contract.created_at,
      company: contract.company || {}
    };

    const pendingSignatureData = {
      contract: contractData,
      contractors: contract.contractors || [],
      isPending: true
    };
    
    console.log("📝 Dados preparados para assinatura:", pendingSignatureData);
    onViewSignature(pendingSignatureData);
  };

  const handleOpenAutentiqueModal = (contract: any) => {
    setSelectedContractForAutentique(contract);
    setShowAutentiqueModal(true);
  };

  const handleAutentiqueSuccess = () => {
    onRefresh?.();
    setShowAutentiqueModal(false);
    setSelectedContractForAutentique(null);
  };

  const handleViewAutentiquePdf = async (contract: any) => {
    try {
      // Buscar documento Autentique com PDF
      const { data: autentiqueDoc, error } = await supabase
        .from('autentique_documents')
        .select('pdf_file_path, public_id')
        .eq('contract_id', contract.id)
        .not('pdf_file_path', 'is', null)
        .single();

      if (error || !autentiqueDoc?.pdf_file_path) {
        console.error('PDF não encontrado:', error);
        return;
      }

      // Gerar URL pública do arquivo
      const { data } = supabase.storage
        .from('autentique-contracts')
        .getPublicUrl(autentiqueDoc.pdf_file_path);

      if (data.publicUrl) {
        window.open(data.publicUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao abrir PDF:', error);
    }
  };

  // Verificar se contrato tem PDF do Autentique anexado
  const hasAutentiquePdf = (contract: any) => {
    return contract.autentique_documents && 
           contract.autentique_documents.some((doc: any) => doc.pdf_file_path);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando contratos...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Contratos e Status de Assinaturas
          </CardTitle>
          {selectedContracts.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Excluir {selectedContracts.length} selecionado(s)
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum contrato encontrado
            </h3>
            <p className="text-muted-foreground">
              Não há contratos que correspondam aos filtros selecionados.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedContracts.length === paginatedContracts.length && paginatedContracts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Contratante</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Status das Assinaturas</TableHead>
                    <TableHead>Data da Assinatura</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedContracts.map((contract) => {
                    const signatureStatus = getSignatureStatus(contract);
                    const isSignedContract = signatureStatus.contractorSigned;
                    const signatureData = isSignedContract ? contract.signed_contracts[0] : null;
                    const contractor = contract.contractors?.[0];

                    console.log(`📊 Status do contrato ${contract.contract_number}:`, signatureStatus);

                    return (
                      <TableRow key={contract.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedContracts.includes(contract.id)}
                            onCheckedChange={(checked) => handleSelectContract(contract.id, checked as boolean)}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">#{contract.contract_number}</div>
                            <div className="text-sm text-muted-foreground">
                              {contract.plan_type}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{contractor?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {contractor?.responsible_name}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-medium text-green-600">
                            {formatCurrency(contract.monthly_value)}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(contract.created_at)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {renderSignatureStatusBadges(signatureStatus)}
                        </TableCell>

                        <TableCell>
                          {signatureData ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDate(signatureData.signed_at)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isSignedContract ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewSignedContract(contract)}
                                className={signatureStatus.isDocuSign ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20" : "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/20"}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {signatureStatus.isDocuSign ? 'Ver DocuSign' : 'Ver Assinado'}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewPendingContract(contract)}
                                className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                              >
                                <FileSignature className="h-4 w-4 mr-1" />
                                Assinar Contrato
                              </Button>
                            )}
                            
                            {hasAutentiquePdf(contract) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewAutentiquePdf(contract)}
                                className="bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Ver PDF
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onCompareContracts(contract)}
                            >
                              <GitCompare className="h-4 w-4 mr-1" />
                              Comparar
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAutentiqueModal(contract)}
                              className="bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20"
                            >
                              <Paperclip className="h-4 w-4 mr-1" />
                              Anexar Autentique
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!isSignedContract}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Componente de Paginação */}
            <ContractsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </>
        )}
      </CardContent>
      
      {/* Modal do Autentique */}
      <AutentiqueAttachModal
        isOpen={showAutentiqueModal}
        onClose={() => {
          setShowAutentiqueModal(false);
          setSelectedContractForAutentique(null);
        }}
        contract={selectedContractForAutentique}
        onSuccess={handleAutentiqueSuccess}
      />
    </Card>
  );
};

export default ContractSignaturesTable;
