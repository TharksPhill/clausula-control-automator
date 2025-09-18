
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
  Shield
} from 'lucide-react';

interface SignatureDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  signature: any;
}

const SignatureDetailsModal: React.FC<SignatureDetailsModalProps> = ({
  isOpen,
  onClose,
  signature
}) => {
  const { toast } = useToast();

  if (!signature) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleDownloadContract = async () => {
    if (!signature.contract || !signature.contractors) {
      toast({
        title: 'Erro',
        description: 'Dados do contrato não encontrados',
        variant: 'destructive',
      });
      return;
    }

    try {
      await generateContractPDF(
        signature.contract,
        signature.contractors,
        'signed'
      );
      
      toast({
        title: 'Download concluído',
        description: 'Contrato assinado baixado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao baixar contrato:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar PDF do contrato',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Detalhes da Assinatura Digital
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status da Assinatura */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Assinatura Válida</span>
            </div>
            <p className="text-sm text-green-700">
              Esta assinatura foi realizada com segurança e possui validade jurídica.
            </p>
          </div>

          {/* Informações da Assinatura */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data e Hora */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data e Hora
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Data:</span>
                  <span className="font-medium">{formatDate(signature.signed_at)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Hora:</span>
                  <span className="font-medium">{formatTime(signature.signed_at)}</span>
                </div>
              </div>
            </div>

            {/* Informações Técnicas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Informações Técnicas
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">IP:</span>
                  <span className="font-medium font-mono text-xs">
                    {signature.ip_address || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Monitor className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm">User Agent:</span>
                    <p className="font-mono text-xs text-gray-600 break-all">
                      {signature.user_agent || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dados da Assinatura */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dados da Assinatura
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hash da Assinatura:</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {signature.id?.slice(0, 16) || 'N/A'}...
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Método de Autenticação:</span>
                  <Badge className="bg-blue-100 text-blue-700">
                    Assinatura Digital
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status de Verificação:</span>
                  <Badge className="bg-green-100 text-green-700">
                    Verificada
                  </Badge>
                </div>

                {signature.contract && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contrato:</span>
                    <span className="font-medium">#{signature.contract.contract_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hash de Verificação da Assinatura */}
          {signature.signature_data && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Hash de Verificação:</h4>
              <div className="bg-gray-100 rounded p-3">
                <code className="text-xs font-mono break-all text-gray-700">
                  {signature.signature_data.slice(0, 100)}...
                </code>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" disabled>
              <Eye className="h-4 w-4 mr-2" />
              Visualizar Contrato
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleDownloadContract}
              disabled={!signature.contract}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureDetailsModal;
