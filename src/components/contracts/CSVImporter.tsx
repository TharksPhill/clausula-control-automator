import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Download, AlertCircle, CheckCircle, Clock, FileText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  contract_number: string;
  success: boolean;
  message: string;
  data?: any;
  isUpdate?: boolean;
}

interface ImportSummary {
  total: number;
  success: number;
  errors: number;
  created?: number;
  updated?: number;
}

interface CSVImporterProps {
  onImportSuccess?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function CSVImporter({ onImportSuccess, isOpen, onClose }: CSVImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (!isProcessing) {
      setFile(null);
      setResults([]);
      setSummary(null);
      setProgress(0);
      onClose();
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Número do contrato (*)',
      'Nome do contratante (*)',
      'CPF do contratante (*)',
      'CNPJ (*)',
      'Quantidade de funcionários (*)',
      'Quantidade de CNPJs (*)',
      'Nome do responsável (*)',
      'CPF do responsável (*)',
      'Data de pagamento (dia do mês)',
      'Data de início do contrato (*)',
      'Data de início dos pagamentos',
      'Cidade (*)',
      'Estado (*)',
      'Email',
      'Endereço completo',
      'Valor do contrato (*)',
      'Tipo de plano (*)',
      'RG do responsável',
      'Desconto semestral (%)',
      'Desconto anual (%)',
      'Dias de teste',
      'Data de renovação'
    ];

    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_importacao_contratos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const separator = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
    const contracts = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
      if (values.length < headers.length) continue;

      const contract = {
        contract_number: values[0],
        contractor_name: values[1],
        contractor_cpf: values[2],
        contractor_cnpj: values[3],
        employee_count: values[4],
        cnpj_count: values[5],
        responsible_name: values[6],
        responsible_cpf: values[7],
        payment_date: values[8],
        start_date: values[9],
        payment_start_date: values[10],
        city: values[11],
        state: values[12],
        email: values[13],
        address: values[14],
        contract_value: values[15],
        plan_type: values[16],
        responsible_rg: values[17],
        semestral_discount: values[18],
        anual_discount: values[19],
        trial_days: values[20],
        renewal_date: values[21]
      };

      contracts.push(contract);
    }

    return contracts;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults([]);
      setSummary(null);
    }
  };

  const processImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo CSV para importar",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setSummary(null);

    try {
      const text = await file.text();
      const contracts = parseCSV(text);

      if (contracts.length === 0) {
        throw new Error('Nenhum contrato válido encontrado no arquivo');
      }

      const batchSize = 5;
      const allResults: ImportResult[] = [];

      for (let i = 0; i < contracts.length; i += batchSize) {
        const batch = contracts.slice(i, i + batchSize);

        const { data, error } = await supabase.functions.invoke('import-contracts-csv', {
          body: { contracts: batch }
        });

        if (error) {
          throw new Error(`Erro na API: ${error.message}`);
        }

        if (data?.results) {
          allResults.push(...data.results);
        }

        setProgress(Math.round(((i + batch.length) / contracts.length) * 100));
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setResults(allResults);
      
      const successCount = allResults.filter(r => r.success).length;
      const errorCount = allResults.filter(r => !r.success).length;
      const createdCount = allResults.filter(r => r.success && !r.isUpdate).length;
      const updatedCount = allResults.filter(r => r.success && r.isUpdate).length;
      
      setSummary({
        total: allResults.length,
        success: successCount,
        errors: errorCount,
        created: createdCount,
        updated: updatedCount
      });

      let message = '';
      if (createdCount > 0) {
        message += `${createdCount} novos contratos`;
      }
      if (updatedCount > 0) {
        if (message) message += ' e ';
        message += `${updatedCount} contratos atualizados`;
      }
      
      toast({
        title: "Importação Concluída",
        description: message || `${successCount} contratos processados com sucesso! ${errorCount > 0 ? `, ${errorCount} erros` : ''}`
      });
      
      if (successCount > 0 && onImportSuccess) {
        onImportSuccess();
      }

    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na Importação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importação de Contratos via CSV
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Importe contratos em lote usando um arquivo CSV. Os dados do CNPJ serão preenchidos automaticamente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4 max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Template Section */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Template CSV</div>
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                className="w-full bg-secondary/50 hover:bg-secondary"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Template
              </Button>
            </div>

            {/* File Upload Section */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Arquivo CSV</div>
              <div 
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-primary/50 ${
                  file ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessing}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12 text-primary" />
                    <div className="text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                    {!isProcessing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="mt-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div className="text-sm font-medium">Escolher arquivo</div>
                    <div className="text-xs text-muted-foreground">
                      ou arraste e solte aqui
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Section */}
            {isProcessing && (
              <div className="space-y-3 p-4 bg-secondary/30 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    Processando...
                  </span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Summary Section */}
            {summary && (
              <div className="p-4 bg-secondary/30 rounded-lg">
                <div className="text-sm font-medium mb-3">Resumo da Importação</div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold">{summary.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-green-500">{summary.created || 0}</div>
                    <div className="text-xs text-muted-foreground">Criados</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-blue-500">{summary.updated || 0}</div>
                    <div className="text-xs text-muted-foreground">Atualizados</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-red-500">{summary.errors}</div>
                    <div className="text-xs text-muted-foreground">Erros</div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Section */}
            {results.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium">Detalhes da Importação</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.map((result, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-sm">
                            Contrato {result.contract_number}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {result.message}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={result.success ? "default" : "destructive"}
                        className="flex-shrink-0"
                      >
                        {result.success ? (result.isUpdate ? "Atualizado" : "Criado") : "Erro"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-secondary/10">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button 
            onClick={processImport}
            disabled={!file || isProcessing}
          >
            {isProcessing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar Contratos
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}