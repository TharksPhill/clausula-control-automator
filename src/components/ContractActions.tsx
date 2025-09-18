
import React, { useState } from "react";
import { MoreHorizontal, Edit, Trash2, Eye, Share2, Download, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ShareContractModal from "./ShareContractModal";
import ContractPreviewModal from "./ContractPreviewModal";
import ContractStatusModal from "./ContractStatusModal";
import { generateContractPDF } from "@/utils/contractPdfGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContractActionsProps {
  contract: any;
  onView?: (contract: any) => void;
  onEdit?: (contract: any) => void;
  onShare?: (contract: any) => void;
  onDelete?: (contractId: string) => Promise<void>;
  onActivate?: (contractId: string, date: string) => Promise<void>;
  onDeactivate?: (contractId: string, date: string) => Promise<void>;
  compact?: boolean;
}

const ContractActions = ({ 
  contract, 
  onView,
  onEdit, 
  onShare,
  onDelete,
  onActivate,
  onDeactivate,
  compact = false 
}: ContractActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalMode, setStatusModalMode] = useState<"activate" | "deactivate">("deactivate");
  const { toast } = useToast();

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(contract.id);
    }
    setShowDeleteDialog(false);
  };

  const handleStatusToggle = () => {
    if (contract.status === "Ativo") {
      setStatusModalMode("deactivate");
    } else {
      setStatusModalMode("activate");
    }
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async (date: string) => {
    if (statusModalMode === "deactivate" && onDeactivate) {
      await onDeactivate(contract.id, date);
    } else if (statusModalMode === "activate" && onActivate) {
      await onActivate(contract.id, date);
    }
    setShowStatusModal(false);
  };

  const handleDownloadPDF = async () => {
    try {
      console.log("🔍 Iniciando download do PDF para contrato:", contract.id);
      
      // Primeiro tentar buscar documento Autentique assinado com PDF anexado
      const { data: autentiqueDocuments, error: autentiqueError } = await supabase
        .from('autentique_documents')
        .select('*')
        .eq('contract_id', contract.id)
        .eq('status', 'signed')
        .not('pdf_file_path', 'is', null);

      console.log("🔍 Documentos Autentique encontrados:", autentiqueDocuments);

      if (autentiqueError) {
        console.error("❌ Erro ao buscar documentos Autentique:", autentiqueError);
        throw autentiqueError;
      }

      // Se encontrou documento Autentique com PDF anexado, baixar ele
      if (autentiqueDocuments && autentiqueDocuments.length > 0) {
        const autentiqueDoc = autentiqueDocuments[0]; // Pegar o primeiro documento encontrado
        console.log("✅ Baixando PDF do Autentique:", autentiqueDoc.pdf_file_path);

        const { data, error } = await supabase.storage
          .from('autentique-contracts')
          .download(autentiqueDoc.pdf_file_path);

        if (error) {
          console.error("❌ Erro ao baixar PDF do Autentique:", error);
          throw error;
        }

        // Criar e baixar o arquivo
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contrato-${contract.contract_number}-autentique.pdf`;
        link.click();
        
        URL.revokeObjectURL(url);

        toast({
          title: 'Download concluído',
          description: 'PDF do documento Autentique baixado com sucesso',
        });

        return;
      }

      // Se não encontrou documento Autentique, gerar PDF padrão do contrato
      console.log("ℹ️ Nenhum PDF do Autentique encontrado, gerando PDF padrão do contrato");
      await generateContractPDF(contract, contract.contractors || {});
      
      toast({
        title: 'Download iniciado',
        description: 'PDF do contrato gerado com sucesso',
      });

    } catch (error) {
      console.error("❌ Erro ao baixar PDF:", error);
      toast({
        title: 'Erro no download',
        description: 'Erro ao baixar PDF do contrato',
        variant: 'destructive',
      });
    }
  };

  const handleView = () => {
    if (onView) {
      onView(contract);
    } else {
      setShowPreview(true);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(contract);
    } else {
      setShowShare(true);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleView}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(contract)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleStatusToggle}>
              {contract.status === "Ativo" ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Inativar
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Ativar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Modals and Dialogs */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir contrato</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O contrato será permanentemente removido do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ContractPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          contractData={contract}
          contractorData={contract.contractors || {}}
          onDownload={handleDownloadPDF}
        />

        <ShareContractModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          contract={contract}
        />

        <ContractStatusModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          onConfirm={handleStatusConfirm}
          mode={statusModalMode}
          contractNumber={contract.contract_number}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={handleView}>
        <Eye className="mr-2 h-4 w-4" />
        Ver Detalhes
      </Button>
      
      {onEdit && (
        <Button variant="outline" onClick={() => onEdit(contract)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      )}
      
      <Button variant="outline" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" />
        Compartilhar
      </Button>
      
      <Button variant="outline" onClick={handleDownloadPDF}>
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>

      <Button variant="outline" onClick={handleStatusToggle}>
        {contract.status === "Ativo" ? (
          <>
            <PowerOff className="mr-2 h-4 w-4" />
            Inativar
          </>
        ) : (
          <>
            <Power className="mr-2 h-4 w-4" />
            Ativar
          </>
        )}
      </Button>

      <Button 
        variant="destructive" 
        onClick={() => setShowDeleteDialog(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>

      {/* All modals */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contrato será permanentemente removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ContractPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        contractData={contract}
        contractorData={contract.contractors || {}}
        onDownload={handleDownloadPDF}
      />

      <ShareContractModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        contract={contract}
      />

      <ContractStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleStatusConfirm}
        mode={statusModalMode}
        contractNumber={contract.contract_number}
      />
    </div>
  );
};

export default ContractActions;
