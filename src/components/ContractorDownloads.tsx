
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  Calendar,
  Eye,
  Loader2
} from 'lucide-react';
import ContractPreviewModal from '@/components/ContractPreviewModal';
import { generateContractPDF } from '@/utils/contractPdfGenerator';

interface ContractorDownloadsProps {
  contractId: string;
  contractorId: string;
  contractData: any;
  contractorData: any;
}

const ContractorDownloads: React.FC<ContractorDownloadsProps> = ({
  contractId,
  contractorId,
  contractData,
  contractorData
}) => {
  const { toast } = useToast();
  const [signedContracts, setSignedContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewType, setPreviewType] = useState<'original' | 'signed'>('original');
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    loadSignedContracts();
  }, [contractId, contractorId]);

  const loadSignedContracts = async () => {
    try {
      console.log("📋 Carregando contratos assinados:", { contractId, contractorId });
      
      const { data: signed, error } = await supabase
        .from('signed_contracts')
        .select('*')
        .eq('contract_id', contractId)
        .eq('contractor_id', contractorId)
        .eq('is_cancelled', false)
        .order('signed_at', { ascending: false });

      if (error) {
        console.error("❌ Erro ao carregar contratos assinados:", error);
        throw error;
      }

      console.log("✅ Contratos assinados carregados:", signed);
      setSignedContracts(signed || []);
    } catch (error: any) {
      console.error("❌ Erro ao carregar contratos assinados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contratos assinados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateProgress = () => {
    setDownloadProgress(0);
    setShowProgress(true);
    
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Simula um progresso mais realista
        if (prev < 30) return prev + Math.random() * 15;
        if (prev < 60) return prev + Math.random() * 12;
        if (prev < 90) return prev + Math.random() * 8;
        return prev + Math.random() * 3;
      });
    }, 150);

    return progressInterval;
  };

  const downloadOriginalContract = async () => {
    try {
      console.log("🚀 INICIANDO DOWNLOAD - Dados:", {
        contractData,
        contractorData,
        type: 'original'
      });

      setDownloading('original');
      const progressInterval = simulateProgress();
      
      // Verificar se os dados estão completos
      if (!contractData || !contractorData) {
        console.error("❌ Dados insuficientes para gerar PDF:", { contractData, contractorData });
        throw new Error('Dados do contrato ou contratante não encontrados');
      }

      console.log("📄 Gerando PDF com dados verificados...");
      await generateContractPDF(contractData, contractorData, 'original');
      
      // Garante que chegue a 100%
      clearInterval(progressInterval);
      setDownloadProgress(100);
      
      setTimeout(() => {
        setShowProgress(false);
        setDownloadProgress(0);
      }, 1000);
      
      console.log("✅ PDF gerado com sucesso!");
      toast({
        title: "Download concluído",
        description: "O contrato original foi baixado com sucesso.",
      });
    } catch (error: any) {
      console.error("❌ Erro detalhado ao baixar contrato:", error);
      setShowProgress(false);
      setDownloadProgress(0);
      toast({
        title: "Erro",
        description: `Erro ao gerar PDF: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const downloadSignedContract = async (signedContract: any) => {
    try {
      console.log("🚀 INICIANDO DOWNLOAD ASSINADO - Dados:", {
        contractData,
        contractorData,
        signedContract,
        type: 'signed'
      });

      setDownloading(signedContract.id);
      const progressInterval = simulateProgress();
      
      // Verificar se os dados estão completos
      if (!contractData || !contractorData) {
        console.error("❌ Dados insuficientes para gerar PDF assinado:", { contractData, contractorData });
        throw new Error('Dados do contrato ou contratante não encontrados');
      }

      console.log("📄 Gerando PDF assinado com dados verificados...");
      await generateContractPDF(contractData, contractorData, 'signed');
      
      // Garante que chegue a 100%
      clearInterval(progressInterval);
      setDownloadProgress(100);
      
      setTimeout(() => {
        setShowProgress(false);
        setDownloadProgress(0);
      }, 1000);
      
      console.log("✅ PDF assinado gerado com sucesso!");
      toast({
        title: "Download concluído", 
        description: "O contrato assinado foi baixado com sucesso.",
      });
    } catch (error: any) {
      console.error("❌ Erro detalhado ao baixar contrato assinado:", error);
      setShowProgress(false);
      setDownloadProgress(0);
      toast({
        title: "Erro",
        description: `Erro ao gerar PDF assinado: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const previewContract = (type: 'original' | 'signed', contract?: any) => {
    console.log("🔍 PREVIEW CONTRACT - Type:", type);
    console.log("🔍 PREVIEW CONTRACT - Contract Data:", contractData);
    console.log("🔍 PREVIEW CONTRACT - Contractor Data:", contractorData);
    console.log("🔍 PREVIEW CONTRACT - Selected Contract:", contract);
    
    setPreviewType(type);
    setSelectedContract(contract);
    setShowPreview(true);
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

  // Adicionar logs de debugging
  console.log("🔍 CONTRACTOR DOWNLOADS - Props recebidas:", {
    contractId,
    contractorId,
    contractData,
    contractorData,
    signedContractsCount: signedContracts.length
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Download className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Downloads</h2>
      </div>

      {/* Barra de Progresso Global */}
      {showProgress && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Gerando PDF do contrato...
                </span>
                <span className="text-sm font-bold text-blue-900">
                  {Math.round(downloadProgress)}%
                </span>
              </div>
              <Progress 
                value={downloadProgress} 
                className="h-3 bg-blue-100" 
              />
              <p className="text-xs text-blue-700">
                Por favor, aguarde. O PDF está sendo processado e otimizado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Original Contract */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Contrato Original (Sem Assinatura)
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Número do Contrato</p>
              <p className="font-semibold">#{contractData?.contract_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Contratante</p>
              <p className="font-semibold">{contractorData?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Valor Mensal</p>
              <p className="font-semibold">R$ {contractData?.monthly_value || '0,00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Tipo de Plano</p>
              <Badge variant="outline">{contractData?.plan_type || 'N/A'}</Badge>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => previewContract('original')}
              className="flex-1"
              disabled={downloading === 'original'}
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
            <Button
              onClick={downloadOriginalContract}
              disabled={downloading === 'original' || showProgress}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {downloading === 'original' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signed Contracts */}
      {signedContracts.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Contratos Assinados ({signedContracts.length})
          </h3>
          
          {signedContracts.map((signed, index) => (
            <Card key={signed.id} className="border border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Contrato Assinado #{index + 1}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Data da Assinatura</p>
                    <p className="font-semibold">{formatDate(signed.signed_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">IP da Assinatura</p>
                    <p className="font-semibold">{signed.ip_address || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-green-200">
                  <Button
                    variant="outline"
                    onClick={() => previewContract('signed', signed)}
                    className="flex-1 border-green-300 hover:bg-green-100"
                    disabled={downloading === signed.id}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button
                    onClick={() => downloadSignedContract(signed)}
                    disabled={downloading === signed.id || showProgress}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {downloading === signed.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum contrato assinado
            </h3>
            <p className="text-gray-600">
              Após assinar o contrato, os documentos assinados aparecerão aqui para download.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      <ContractPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        contractData={contractData}
        contractorData={contractorData}
        signedContractData={previewType === 'signed' ? selectedContract : undefined}
        onDownload={() => {
          if (previewType === 'original') {
            downloadOriginalContract();
          } else if (selectedContract) {
            downloadSignedContract(selectedContract);
          }
        }}
      />
    </div>
  );
};

export default ContractorDownloads;
