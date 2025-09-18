import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock,
  Download,
  Calendar,
  User,
  Building,
  Trash2,
  Search,
  Eye,
  MoreVertical,
  Printer
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import Footer from '@/components/Footer';
import ContractsPagination from '@/components/ContractsPagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { NotificationBell } from '@/components/NotificationBell';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import ThemeToggle from '@/components/ThemeToggle';

const ContractSignatures = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [signatures, setSignatures] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractsWithAttachments, setContractsWithAttachments] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeView, setActiveView] = useState("contract-signatures");
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchSignatures();
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const { data: contractsData, error } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          plan_type,
          contractors (
            name,
            cnpj
          )
        `)
        .order('contract_number', { ascending: false });

      if (error) throw error;
      setContracts(contractsData || []);
      
      // Buscar contratos com anexos
      const { data: attachments } = await supabase
        .from('contract_attachments')
        .select('contract_id, uploaded_at');
      
      const attachmentsByContractId = new Map(
        attachments?.map(a => [a.contract_id, a.uploaded_at]) || []
      );
      
      // Combinar dados dos contratos com status de anexo
      const contractsWithStatus = (contractsData || []).map(contract => ({
        ...contract,
        hasAttachment: attachmentsByContractId.has(contract.id),
        signedAt: attachmentsByContractId.get(contract.id)
      }));
      
      setContractsWithAttachments(contractsWithStatus);
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
    }
  };

  const fetchSignatures = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('contract_attachments')
        .select(`
          *,
          contracts (
            contract_number,
            contractors (
              name,
              cnpj
            )
          )
        `)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setSignatures(data || []);
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar assinaturas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo PDF",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedContract || !selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione um contrato e um arquivo PDF",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Upload do arquivo para o Supabase Storage
      const fileName = `${selectedContract.contract_number}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('autentique-contracts')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('autentique-contracts')
        .getPublicUrl(fileName);

      // Salvar informações da assinatura no banco
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: dbError } = await supabase
        .from('contract_attachments')
        .insert({
          contract_id: selectedContract.id,
          file_name: fileName,
          file_url: publicUrl,
          file_size: selectedFile.size,
          uploaded_by: user?.id
        });

      if (dbError) throw dbError;

      // Atualizar o status do contrato para "Assinado"
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ status: 'Assinado' })
        .eq('id', selectedContract.id);

      if (updateError) {
        console.error('Erro ao atualizar status:', updateError);
      }

      toast({
        title: "Sucesso!",
        description: "Contrato assinado anexado com sucesso",
      });

      setShowUploadModal(false);
      setSelectedContract(null);
      setSelectedFile(null);
      fetchSignatures();
      fetchContracts(); // Recarregar contratos para atualizar o status
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao anexar contrato assinado",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contract_attachments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Anexo removido com sucesso",
      });
      fetchSignatures();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover assinatura",
        variant: "destructive"
      });
    }
  };

  const filteredContracts = contractsWithAttachments.filter(contract => {
    const matchesSearch = searchTerm === '' || 
      contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractors?.[0]?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractors?.[0]?.cnpj?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'signed' && contract.hasAttachment) ||
      (statusFilter === 'pending' && !contract.hasAttachment);
    
    return matchesSearch && matchesStatus;
  });

  // Cálculo da paginação
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

  // Reset para primeira página quando os filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const stats = {
    total: contracts.length,
    signed: contractsWithAttachments.filter(c => c.hasAttachment).length,
    pending: contractsWithAttachments.filter(c => !c.hasAttachment).length
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar 
          activeView={activeView}
          onViewChange={setActiveView}
          onNewContract={() => {}}
        />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card">
            <div className="flex items-center gap-2 px-4 w-full">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex-1">
                <h1 className="text-lg font-semibold">Contratos Assinados</h1>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell onViewAll={() => {}} />
                <ThemeToggle />
                <UserProfileDropdown />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 bg-background p-6 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <div className="mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold">Gestão de Contratos Assinados</h2>
                    <p className="text-muted-foreground mt-1">Anexe e gerencie contratos já assinados</p>
                  </div>
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Anexar Contrato Assinado
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Contratos Ativos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{stats.total}</span>
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Contratos cadastrados</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Assinados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">{stats.signed}</span>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Contratos com assinatura</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-yellow-600">{stats.pending}</span>
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Aguardando assinatura</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Taxa de Conclusão
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        {stats.total > 0 ? Math.round((stats.signed / stats.total) * 100) : 0}%
                      </span>
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">
                          {stats.signed}/{stats.total}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Percentual assinado</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Search */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Filtros e Busca</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por número, CNPJ ou razão social..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="signed">Assinado</option>
                      <option value="pending">Pendente</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Contracts Table */}
              <Card>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Carregando...</p>
                    </div>
                  ) : filteredContracts.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum contrato encontrado</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setShowUploadModal(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Anexar Contrato Assinado
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-3 font-medium">Número do Contrato</th>
                            <th className="text-left p-3 font-medium">Nome do Contratante</th>
                            <th className="text-left p-3 font-medium">CNPJ</th>
                            <th className="text-left p-3 font-medium">Tipo de Plano</th>
                            <th className="text-left p-3 font-medium">Data Assinatura</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-left p-3 font-medium">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedContracts.map((contract) => (
                            <tr key={contract.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-3">
                                <span className="font-medium">
                                  {contract.contract_number}
                                </span>
                              </td>
                              <td className="p-3">
                                {contract.contractors?.[0]?.name || 'N/A'}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {contract.contractors?.[0]?.cnpj || 'N/A'}
                              </td>
                              <td className="p-3">
                                <span className="capitalize">
                                  {contract.plan_type || 'Mensal'}
                                </span>
                              </td>
                              <td className="p-3">
                                {contract.signedAt ? (
                                  <span className="text-sm">
                                    {format(new Date(contract.signedAt), 'dd/MM/yyyy HH:mm')}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="p-3">
                                {contract.hasAttachment ? (
                                  <Badge className="bg-green-500 text-white hover:bg-green-600">
                                    Assinado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                    Pendente
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-background">
                                      {contract.hasAttachment ? (
                                        <>
                                          <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={async () => {
                                              try {
                                                // Buscar a URL do arquivo anexado
                                                const { data, error } = await supabase
                                                  .from('contract_attachments')
                                                  .select('file_url, file_name')
                                                  .eq('contract_id', contract.id)
                                                  .single();
                                                
                                                if (error) {
                                                  console.error('Erro ao buscar arquivo:', error);
                                                  toast({
                                                    title: "Erro",
                                                    description: "Erro ao buscar arquivo",
                                                    variant: "destructive"
                                                  });
                                                  return;
                                                }
                                                
                                                if (data?.file_url) {
                                                  // Fazer download direto do arquivo
                                                  const response = await fetch(data.file_url);
                                                  const blob = await response.blob();
                                                  const url = window.URL.createObjectURL(blob);
                                                  const link = document.createElement('a');
                                                  link.href = url;
                                                  link.download = data.file_name || `contrato_${contract.contract_number}.pdf`;
                                                  document.body.appendChild(link);
                                                  link.click();
                                                  document.body.removeChild(link);
                                                  window.URL.revokeObjectURL(url);
                                                  
                                                  toast({
                                                    title: "Sucesso",
                                                    description: "Download iniciado",
                                                  });
                                                } else {
                                                  toast({
                                                    title: "Erro",
                                                    description: "Arquivo não encontrado",
                                                    variant: "destructive"
                                                  });
                                                }
                                              } catch (err) {
                                                console.error('Erro ao processar arquivo:', err);
                                                toast({
                                                  title: "Erro",
                                                  description: "Erro ao fazer download do arquivo",
                                                  variant: "destructive"
                                                });
                                              }
                                            }}
                                          >
                                            <Printer className="h-4 w-4 mr-2" />
                                            Imprimir
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                            onClick={async () => {
                                              const { data } = await supabase
                                                .from('contract_attachments')
                                                .select('id')
                                                .eq('contract_id', contract.id)
                                                .single();
                                              if (data?.id) {
                                                await handleDelete(data.id);
                                                fetchContracts();
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Excluir
                                          </DropdownMenuItem>
                                        </>
                                      ) : (
                                        <DropdownMenuItem
                                          className="cursor-pointer"
                                          onClick={() => {
                                            setSelectedContract(contract);
                                            setShowUploadModal(true);
                                          }}
                                        >
                                          <Upload className="h-4 w-4 mr-2" />
                                          Anexar Contrato
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {/* Pagination */}
                      {filteredContracts.length > 0 && (
                        <ContractsPagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          itemsPerPage={itemsPerPage}
                          totalItems={filteredContracts.length}
                          onPageChange={handlePageChange}
                          onItemsPerPageChange={handleItemsPerPageChange}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </SidebarInset>
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anexar Contrato Assinado</DialogTitle>
            <DialogDescription>
              Selecione o contrato e faça upload do arquivo PDF assinado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedContract ? (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Contrato Selecionado:</p>
                <p className="text-sm">{selectedContract.contract_number} - {selectedContract.contractors?.[0]?.name || 'Sem contratante'}</p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedContract(null)}
                  className="mt-2"
                >
                  Trocar contrato
                </Button>
              </div>
            ) : (
              <div>
                <Label>Buscar Contrato</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Digite o número do contrato ou nome da empresa..."
                    onChange={(e) => {
                      const searchValue = e.target.value.toLowerCase();
                      const filtered = contracts.filter(c => 
                        c.contract_number?.toLowerCase().includes(searchValue) ||
                        c.contractors?.[0]?.name?.toLowerCase().includes(searchValue)
                      );
                      if (filtered.length === 1) {
                        setSelectedContract(filtered[0]);
                      }
                    }}
                  />
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={selectedContract?.id || ''}
                    onChange={(e) => {
                      const contract = contracts.find(c => c.id === e.target.value);
                      setSelectedContract(contract);
                    }}
                  >
                    <option value="">Selecione um contrato...</option>
                    {contracts.filter(c => !contractsWithAttachments.find(ca => ca.id === c.id && ca.hasAttachment)).map(contract => (
                      <option key={contract.id} value={contract.id}>
                        {contract.contract_number} - {contract.contractors?.[0]?.name || 'Sem contratante'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <Label>Arquivo PDF Assinado</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedContract || !selectedFile || uploading}
            >
              {uploading ? 'Enviando...' : 'Anexar Contrato'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default ContractSignatures;