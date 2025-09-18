import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Download, Upload, FileText } from 'lucide-react';
import { CSVExporter } from './CSVExporter';
import { CSVImporter } from './CSVImporter';
import { ImportLayoutGenerator } from '@/utils/importLayoutGenerator';
import { useToast } from '@/hooks/use-toast';

interface ContractsActionsProps {
  contracts: any[];
  onImportSuccess: () => void;
}

const ContractsActions: React.FC<ContractsActionsProps> = ({ contracts, onImportSuccess }) => {
  const [showImporter, setShowImporter] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = () => {
    console.log('📤 Exportando contratos CSV');
    CSVExporter.exportContracts(contracts);
  };

  const handleDownloadLayout = () => {
    console.log('📋 Gerando layout de importação');
    try {
      ImportLayoutGenerator.generateImportLayout();
      toast({
        title: "Layout gerado",
        description: "O arquivo de layout de importação foi baixado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao gerar layout:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o layout de importação",
        variant: "destructive",
      });
    }
  };

  const handleImportClick = () => {
    console.log('📂 Abrindo seletor de arquivo');
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📁 Arquivo selecionado:', file?.name);
    
    if (file) {
      // Verificar se é um arquivo CSV
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo CSV",
          variant: "destructive",
        });
        return;
      }

      // Verificar tamanho do arquivo (limite de 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Arquivo válido, abrindo modal de importação');
      setSelectedFile(file);
      setShowImporter(true);
      
      toast({
        title: "Arquivo carregado",
        description: `Arquivo ${file.name} selecionado para importação`,
      });
    }
    
    // Reset input para permitir selecionar o mesmo arquivo novamente se necessário
    event.target.value = '';
  };

  const handleImporterClose = () => {
    console.log('🚪 Fechando modal de importação');
    setShowImporter(false);
    setSelectedFile(null);
  };

  const handleImportSuccess = () => {
    console.log('🎉 Importação bem-sucedida');
    setShowImporter(false);
    setSelectedFile(null);
    onImportSuccess();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDownloadLayout}>
            <FileText className="mr-2 h-4 w-4" />
            Layout de Importação
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <CSVImporter 
        isOpen={showImporter}
        onClose={handleImporterClose}
        onImportSuccess={handleImportSuccess} 
      />
    </>
  );
};

export default ContractsActions;
