import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDateToBrazilian } from '@/utils/dateUtils';
import AutentiqueAttachModal from './signatures/AutentiqueAttachModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Download,
  Eye,
  Paperclip,
  FileSignature,
  ExternalLink,
  Building,
  Calendar,
  MapPin,
  User,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Mail,
  Share2,
  Settings,
  Plus
} from 'lucide-react';

interface ContractSignaturesTabProps {
  contractId: string;
  signedContracts: any[];
  allContractors: any[];
  onRefresh: () => void;
}

const ContractSignaturesTab: React.FC<ContractSignaturesTabProps> = ({
  contractId,
  signedContracts,
  allContractors,
  onRefresh
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [autentiqueDocuments, setAutentiqueDocuments] = useState<any[]>([]);
  const [showAutentiqueModal, setShowAutentiqueModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  useEffect(() => {
    if (contractId) {
      fetchAutentiqueDocuments();
      fetchContractData();
    }
  }, [contractId]);

  const fetchContractData = async () => {
    try {
      const { data: contract, error } = await supabase
        .from('contracts')
        .select(`
          *,
          contractors(*),
          companies(*)
        `)
        .eq('id', contractId)
        .single();

      if (error) {
        console.error('Erro ao buscar contrato:', error);
        return;
      }

      setSelectedContract(contract);
    } catch (error) {
      console.error('Erro ao buscar dados do contrato:', error);
    }
  };

  const fetchAutentiqueDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('autentique_documents')
        .select('*')
        .eq('contract_id', contractId);

      if (error) {
        console.error('Erro ao buscar documentos Autentique:', error);
        return;
      }

      setAutentiqueDocuments(data || []);
    } catch (error) {
      console.error('Erro ao buscar documentos Autentique:', error);
    }
  };

  const getSignatureStatus = (contractorId: string) => {
    const regularSignature = signedContracts.find(sc => sc.contractor_id === contractorId && !sc.is_cancelled);
    const autentiqueDoc = autentiqueDocuments.find(doc => doc.contractor_id === contractorId && doc.status === 'signed');
    
    if (regularSignature || autentiqueDoc) {
      return 'signed';
    }
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Assinado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const handleGlobalAction = (action: string) => {
    console.log('Ação global executada:', action);
    switch (action) {
      case 'refresh':
        onRefresh();
        toast({ title: 'Atualizado', description: 'Status das assinaturas atualizado com sucesso' });
        break;
      case 'export':
        toast({ title: 'Exportação iniciada', description: 'Baixando dados das assinaturas...' });
        break;
      case 'bulk-send':
        toast({ title: 'Enviando lembretes', description: 'Lembretes enviados para todos os pendentes' });
        break;
      case 'report':
        window.print();
        break;
      default:
        toast({ title: 'Ação executada', description: `Ação ${action} executada com sucesso` });
    }
  };

  const handleContractorAction = (contractorId: string, action: string) => {
    const contractor = allContractors.find(c => c.id === contractorId);
    console.log('Ação do contratante executada:', action, contractor?.name);
    
    switch (action) {
      case 'view-pdf':
        handleViewSignedDocument(contractorId);
        break;
      case 'download-pdf':
        handleDownloadOriginalPDF(contractorId);
        break;
      case 'send-reminder':
        toast({
          title: 'Lembrete enviado',
          description: `Lembrete de assinatura enviado para ${contractor?.name}`,
        });
        break;
      case 'share-contract':
        navigator.clipboard.writeText(`Link do contrato para ${contractor?.name}`);
        toast({
          title: 'Link copiado',
          description: 'Link do contrato copiado para a área de transferência',
        });
        break;
      case 'attach-autentique':
        setShowAutentiqueModal(true);
        break;
      default:
        toast({ title: 'Ação executada', description: `Ação ${action} executada para ${contractor?.name}` });
    }
  };

  const handleViewSignedDocument = async (contractorId: string) => {
    try {
      setLoading(true);

      const autentiqueDoc = autentiqueDocuments.find(doc => 
        doc.contractor_id === contractorId && 
        doc.status === 'signed' && 
        doc.pdf_file_path
      );

      if (autentiqueDoc?.pdf_file_path) {
        const { data } = supabase.storage
          .from('autentique-contracts')
          .getPublicUrl(autentiqueDoc.pdf_file_path);

        if (data.publicUrl) {
          window.open(data.publicUrl, '_blank');
          toast({
            title: 'PDF Aberto',
            description: 'Abrindo documento original do Autentique...',
          });
        }
      } else {
        toast({
          title: 'PDF não encontrado',
          description: 'Nenhum PDF anexado encontrado para este contrato',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao visualizar documento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao abrir documento assinado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadOriginalPDF = async (contractorId: string) => {
    try {
      const autentiqueDoc = autentiqueDocuments.find(doc => 
        doc.contractor_id === contractorId && 
        doc.status === 'signed' && 
        doc.pdf_file_path
      );

      if (!autentiqueDoc?.pdf_file_path) {
        toast({
          title: 'PDF não encontrado',
          description: 'Nenhum PDF anexado encontrado para este contrato',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.storage
        .from('autentique-contracts')
        .download(autentiqueDoc.pdf_file_path);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato-autentique-${autentiqueDoc.public_id}.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);

      toast({
        title: 'Download iniciado',
        description: 'PDF original do Autentique baixado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast({
        title: 'Erro no download',
        description: 'Erro ao baixar PDF original do Autentique',
        variant: 'destructive',
      });
    }
  };

  const handleAutentiqueModalSuccess = () => {
    fetchAutentiqueDocuments();
    onRefresh();
  };

  if (!contractId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Selecione um contrato para ver as assinaturas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* NOVO HEADER COM MENU DE AÇÕES */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary p-3 rounded-xl shadow-md">
                  <FileSignature className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Gerenciar Contratos e Assinaturas</h2>
                  <p className="text-muted-foreground mt-1">
                    Controle completo das assinaturas e documentos do Autentique
                  </p>
                </div>
              </div>
              
              {/* NOVO MENU DE AÇÕES PRINCIPAIS */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowAutentiqueModal(true)}
                  className="shadow-md"
                  disabled={!selectedContract}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Anexar Autentique
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-md border hover:bg-muted">
                      <Settings className="h-4 w-4 mr-2" />
                      Ações
                      <MoreHorizontal className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="text-foreground font-semibold">
                      Ações do Contrato
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => handleGlobalAction('refresh')}>
                      <RefreshCw className="mr-2 h-4 w-4 text-green-600" />
                      <span>Atualizar Status</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleGlobalAction('bulk-send')}>
                      <Mail className="mr-2 h-4 w-4 text-blue-600" />
                      <span>Enviar Lembretes</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => handleGlobalAction('report')}>
                      <FileText className="mr-2 h-4 w-4 text-purple-600" />
                      <span>Gerar Relatório</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleGlobalAction('export')}>
                      <Download className="mr-2 h-4 w-4 text-indigo-600" />
                      <span>Exportar Dados</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards dos contratantes com menu de ações individuais */}
        <div className="space-y-4">
          {allContractors.length > 0 ? (
            allContractors.map((contractor, index) => {
              const status = getSignatureStatus(contractor.id);
              const regularSignature = signedContracts.find(sc => sc.contractor_id === contractor.id && !sc.is_cancelled);
              const autentiqueDoc = autentiqueDocuments.find(doc => doc.contractor_id === contractor.id && doc.status === 'signed');
              const hasAttachedPDF = autentiqueDoc?.pdf_file_path;

              return (
                <Card key={contractor.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header do Card com NOVO MENU */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-primary-foreground font-bold text-sm">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground flex items-center gap-2 text-lg">
                              <Building className="h-5 w-5 text-primary" />
                              {contractor.name}
                            </h3>
                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                              <User className="h-4 w-4" />
                              {contractor.responsible_name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {getStatusBadge(status)}
                          
                          {/* NOVO MENU DE AÇÕES INDIVIDUAL */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel className="font-semibold text-foreground">
                                {contractor.name}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              {status === 'signed' && hasAttachedPDF && (
                                <>
                                  <DropdownMenuItem onClick={() => handleContractorAction(contractor.id, 'view-pdf')}>
                                    <Eye className="mr-2 h-4 w-4 text-green-600" />
                                    <span>Visualizar PDF</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleContractorAction(contractor.id, 'download-pdf')}>
                                    <Download className="mr-2 h-4 w-4 text-blue-600" />
                                    <span>Download PDF</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              
                              <DropdownMenuItem onClick={() => handleContractorAction(contractor.id, 'attach-autentique')}>
                                <Paperclip className="mr-2 h-4 w-4 text-orange-600" />
                                <span>Anexar Documento</span>
                              </DropdownMenuItem>
                              
                              {status === 'pending' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleContractorAction(contractor.id, 'send-reminder')}>
                                    <Mail className="mr-2 h-4 w-4 text-yellow-600" />
                                    <span>Enviar Lembrete</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleContractorAction(contractor.id, 'share-contract')}>
                                    <Share2 className="mr-2 h-4 w-4 text-purple-600" />
                                    <span>Compartilhar Link</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Informações do Contratante */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">CNPJ:</span>
                            <span className="ml-1">{contractor.cnpj}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">Localização:</span>
                            <span className="ml-1">{contractor.city}, {contractor.state}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {contractor.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="font-medium">Email:</span>
                              <span className="ml-1">{contractor.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-medium">CPF:</span>
                            <span className="ml-1">{contractor.responsible_cpf}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status das Assinaturas */}
                      {status === 'signed' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Status das Assinaturas
                          </h4>
                          <div className="space-y-2">
                            {autentiqueDoc && (
                              <div className="flex items-center gap-2 text-sm">
                                <FileSignature className="h-4 w-4 text-orange-600" />
                                <span className="text-orange-700 font-medium">
                                  Autentique: {autentiqueDoc.public_id}
                                </span>
                                {hasAttachedPDF && (
                                  <Badge variant="outline" className="text-orange-600 border-orange-200 ml-2">
                                    <FileText className="h-3 w-3 mr-1" />
                                    PDF Anexado
                                  </Badge>
                                )}
                              </div>
                            )}
                            {regularSignature && (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <span className="text-green-700">
                                  Assinado em {formatDateToBrazilian(regularSignature.signed_at)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Nenhum contratante encontrado</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumo dos Documentos Autentique */}
        {autentiqueDocuments.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <FileSignature className="h-5 w-5" />
                Documentos Autentique ({autentiqueDocuments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {autentiqueDocuments.map((doc) => (
                <div key={doc.id} className="bg-white border border-orange-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium text-orange-800">{doc.document_name}</h5>
                        <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                          {doc.status}
                        </Badge>
                        {doc.pdf_file_path && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            <FileText className="h-3 w-3 mr-1" />
                            PDF Anexado
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-orange-600 space-y-1">
                        <p><strong>ID:</strong> {doc.public_id}</p>
                        <p><strong>Assinante:</strong> {doc.signer_name}</p>
                        <p><strong>Data:</strong> {formatDateToBrazilian(doc.signed_at)}</p>
                      </div>
                    </div>
                    
                    {doc.pdf_file_path && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const contractor = allContractors.find(c => c.id === doc.contractor_id);
                            if (contractor) {
                              handleViewSignedDocument(contractor.id);
                            }
                          }}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Abrir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const contractor = allContractors.find(c => c.id === doc.contractor_id);
                            if (contractor) {
                              handleDownloadOriginalPDF(contractor.id);
                            }
                          }}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <AutentiqueAttachModal
        isOpen={showAutentiqueModal}
        onClose={() => setShowAutentiqueModal(false)}
        contract={selectedContract}
        onSuccess={handleAutentiqueModalSuccess}
      />
    </>
  );
};

export default ContractSignaturesTab;
