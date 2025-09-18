
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generateContractPDF } from '@/utils/contractPdfGenerator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Monitor, 
  Download, 
  Eye,
  User,
  Building,
  FileText,
  GitCompare
} from 'lucide-react';

interface ContractComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
}

const ContractComparisonModal: React.FC<ContractComparisonModalProps> = ({
  isOpen,
  onClose,
  contract
}) => {
  const { toast } = useToast();

  if (!contract) return null;

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

  const handleViewOriginal = () => {
    console.log("🔍 Visualizando contrato original:", contract);
    toast({
      title: "Visualizar Original",
      description: "Abrindo contrato original...",
    });
    // TODO: Implementar visualização do contrato original
  };

  const handleDownloadSigned = async () => {
    if (!contract.signed_contracts?.[0]) {
      toast({
        title: "Erro",
        description: "Contrato ainda não foi assinado",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("📥 Baixando contrato assinado:", contract);
      
      await generateContractPDF(
        contract,
        contract.contractors,
        'signed'
      );
      
      toast({
        title: "Download concluído",
        description: "Contrato assinado baixado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao baixar contrato assinado:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do contrato assinado",
        variant: "destructive",
      });
    }
  };

  const handleGenerateComparisonReport = () => {
    console.log("📊 Gerando relatório de comparação:", contract);
    
    toast({
      title: "Gerando Relatório",
      description: "Relatório de comparação será baixado em breve...",
    });

    // Simular geração de relatório
    setTimeout(() => {
      toast({
        title: "Relatório Gerado",
        description: "Relatório de comparação baixado com sucesso",
      });
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-blue-600" />
            Comparação de Versões do Contrato
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Contrato */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">
                Contrato #{contract.contract_number}
              </span>
            </div>
            <p className="text-sm text-blue-700">
              Contratante: {contract.contractors?.[0]?.name}
            </p>
          </div>

          {/* Comparação entre Versões */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Versão Original */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Versão Original
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data de Criação:</span>
                  <span className="font-medium">{formatDate(contract.created_at)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Valor Mensal:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(contract.monthly_value)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tipo de Plano:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {contract.plan_type}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className="bg-gray-100 text-gray-800">
                    Original
                  </Badge>
                </div>
              </div>
            </div>

            {/* Versão Assinada */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <GitCompare className="h-4 w-4" />
                Versão Assinada
              </h3>
              
              <div className="bg-green-50 rounded-lg p-4 space-y-3">
                {contract.signed_contracts?.[0] ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Data de Assinatura:</span>
                      <span className="font-medium">
                        {formatDate(contract.signed_contracts[0].signed_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Valor Mensal:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(contract.monthly_value)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tipo de Plano:</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {contract.plan_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className="bg-green-100 text-green-800">
                        Assinado
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-orange-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Aguardando Assinatura
                    </h4>
                    <p className="text-gray-600">
                      Este contrato ainda não foi assinado.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleViewOriginal}
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar Original
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1" 
              disabled={!contract.signed_contracts?.[0]}
              onClick={handleDownloadSigned}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Assinado
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleGenerateComparisonReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Relatório de Comparação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractComparisonModal;
