import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useContracts } from "@/hooks/useContracts";
import {
  useCreateOrUpdateContractMonthlyRevenueOverride,
  useCreateOrUpdateMultipleContractRevenueOverrides,
  useDeleteContractMonthlyRevenueOverride,
} from "@/hooks/useContractMonthlyRevenueOverrides";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Edit, Calendar, XCircle, Loader2 } from "lucide-react";
interface ContractMonthlyRevenueEditorProps {
  open: boolean;
  onClose: () => void;
  contractId: string;
  year: number;
  month: number;
  initialValue?: number;
  initialDescription?: string;
  initialNotes?: string;
}

const monthNamesFull = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const ContractMonthlyRevenueEditor: React.FC<ContractMonthlyRevenueEditorProps> = ({
  open,
  onClose,
  contractId,
  year,
  month,
  initialValue = 0,
  initialDescription = "",
  initialNotes = "",
}) => {
  console.log('[DEBUG ContractMonthlyRevenueEditor] Componente montado');
  console.log('[DEBUG ContractMonthlyRevenueEditor] Props recebidas:', {
    open,
    contractId,
    year,
    month,
    initialValue
  });
  
  const { contracts, refetchContracts } = useContracts();
  const contract = useMemo(() => {
    const found = contracts?.find(c => c.id === contractId);
    console.log('[DEBUG ContractMonthlyRevenueEditor] Contrato encontrado:', found);
    return found;
  }, [contracts, contractId]);

  const [value, setValue] = useState(initialValue);
  const [displayValue, setDisplayValue] = useState(
    initialValue > 0 ? initialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
  );
  const [description, setDescription] = useState(initialDescription);
  const [notes, setNotes] = useState(initialNotes);
  const [applyToMultipleMonths, setApplyToMultipleMonths] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([month]);
  const [percentAdjustment, setPercentAdjustment] = useState<number>(0);
  const [terminationDate, setTerminationDate] = useState<string>("");
  const [showTerminateAlert, setShowTerminateAlert] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  // Define data de encerramento sugerida baseada na célula atual
  const suggestedTerminationDate = useMemo(() => {
    const cellDate = new Date(year, month - 1, 1);
    return cellDate.toISOString().split('T')[0];
  }, [year, month]);
  
  const adjustedValue = useMemo(() => {
    const raw = value * (1 + percentAdjustment / 100);
    return Math.round(raw * 100) / 100;
  }, [value, percentAdjustment]);

  const createOrUpdate = useCreateOrUpdateContractMonthlyRevenueOverride();
  const createOrUpdateMultiple = useCreateOrUpdateMultipleContractRevenueOverrides();
  const deleteOverride = useDeleteContractMonthlyRevenueOverride();
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('[DEBUG ContractMonthlyRevenueEditor] useEffect - atualizando estados');
    console.log('[DEBUG ContractMonthlyRevenueEditor] contract?.termination_date:', contract?.termination_date);
    console.log('[DEBUG ContractMonthlyRevenueEditor] suggestedTerminationDate:', suggestedTerminationDate);
    
    setValue(initialValue);
    setDisplayValue(
      initialValue > 0 ? initialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
    );
    setDescription(initialDescription);
    setNotes(initialNotes);
    setSelectedMonths([month]);
    setApplyToMultipleMonths(false);
    setPercentAdjustment(0);
    // Sempre usar a data sugerida baseada na célula atual
    setTerminationDate(suggestedTerminationDate);
  }, [initialValue, initialDescription, initialNotes, month, suggestedTerminationDate]);

  const formatCurrency = (val: string) => {
    const numbers = val.replace(/\D/g, '');
    if (!numbers) return '';
    const numberValue = parseInt(numbers) / 100;
    return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseFormattedValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    const cleanValue = formattedValue.replace(/\./g, '').replace(',', '.');
    const numberValue = parseFloat(cleanValue);
    return isNaN(numberValue) ? 0 : numberValue;
  };

  const handleValueChange = (inputValue: string) => {
    const formatted = formatCurrency(inputValue);
    setDisplayValue(formatted);
    setValue(parseFormattedValue(formatted));
  };

  const handleApplyAdjustedValue = () => {
    const newVal = adjustedValue;
    setValue(newVal);
    setDisplayValue(
      newVal.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
  const isAllSelected = selectedMonths.length === 12;
  const handleToggleAllMonths = (checked: boolean) => {
    setSelectedMonths(checked ? allMonths : []);
  };

  const handleSave = async () => {
    try {
      if (applyToMultipleMonths && selectedMonths.length > 1) {
        await createOrUpdateMultiple.mutateAsync({
          contract_id: contractId,
          year,
          months: selectedMonths,
          value,
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await createOrUpdate.mutateAsync({
          contract_id: contractId,
          year,
          month,
          value,
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      
      // Aguardar um pouco para garantir que as atualizações sejam processadas
      await new Promise(resolve => setTimeout(resolve, 500));
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar alterações");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover o faturamento deste mês?")) return;
    try {
      await deleteOverride.mutateAsync({ contract_id: contractId, year, month });
      
      // Aguardar um pouco para garantir que as atualizações sejam processadas
      await new Promise(resolve => setTimeout(resolve, 500));
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover faturamento");
    }
  };

  const handleTerminate = async () => {
    console.log('[DEBUG] handleTerminate chamado');
    console.log('[DEBUG] terminationDate:', terminationDate);
    console.log('[DEBUG] contractId:', contractId);
    
    if (!terminationDate) {
      console.log('[DEBUG] Data de encerramento não definida');
      toast.error("Por favor, selecione uma data de encerramento");
      return;
    }
    
    if (!contractId) {
      console.log('[DEBUG] ID do contrato não definido');
      toast.error("Erro: Contrato não identificado");
      return;
    }
    
    // Mostrar o AlertDialog ao invés de processar diretamente
    setShowTerminateAlert(true);
  };

  const confirmTermination = async () => {
    setShowTerminateAlert(false);
    setIsTerminating(true);
    
    try {
      console.log('[DEBUG] Iniciando atualização no Supabase');
      console.log('[DEBUG] Encerrando contrato:', contractId, 'na data:', terminationDate);
      
      const { data, error } = await supabase
        .from('contracts')
        .update({ termination_date: terminationDate })
        .eq('id', contractId)
        .select()
        .single();
      
      console.log('[DEBUG] Resposta do Supabase - data:', data);
      console.log('[DEBUG] Resposta do Supabase - error:', error);
      
      if (error) {
        console.error('Erro ao encerrar contrato:', error);
        toast.error(`Erro ao encerrar contrato: ${error.message}`);
        return;
      }
      
      if (!data) {
        console.log('[DEBUG] Nenhum dado retornado do Supabase');
        toast.error("Contrato não encontrado ou sem permissão para atualizar");
        return;
      }
      
      console.log('[DEBUG] Contrato encerrado com sucesso:', data);
      toast.success("Contrato encerrado com sucesso");
      
      // Forçar atualização completa e imediata de todas as queries
      console.log('[DEBUG] Forçando atualização completa do cache');
      
      // Resetar todas as queries relacionadas para forçar refetch
      await queryClient.resetQueries({ queryKey: ['contracts'] });
      await queryClient.resetQueries({ queryKey: ['financial-summary'] });
      await queryClient.resetQueries({ queryKey: ['contract-monthly-revenue-overrides'] });
      await queryClient.resetQueries({ queryKey: ['monthly-financial-costs'] });
      await queryClient.resetQueries({ queryKey: ['financial-sections'] });
      
      // Forçar refetch imediato
      await refetchContracts();
      await queryClient.refetchQueries({ queryKey: ['financial-summary'] });
      await queryClient.refetchQueries({ queryKey: ['monthly-financial-costs'] });
      
      // Invalidar novamente para garantir atualização em tempo real
      setTimeout(() => {
        queryClient.invalidateQueries();
      }, 50);
      
      // Aguardar um pouco antes de fechar
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('[DEBUG] Fechando modal');
      setIsTerminating(false);
      onClose();
    } catch (e) {
      console.error('[DEBUG] Erro inesperado ao encerrar contrato:', e);
      toast.error("Erro inesperado ao encerrar contrato");
      setIsTerminating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen && !createOrUpdate.isPending && !createOrUpdateMultiple.isPending && !deleteOverride.isPending && !isTerminating) {
          onClose();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Editar Faturamento - {contract?.contract_number || 'Contrato'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{monthNamesFull[month - 1]} de {year}</p>
          </DialogHeader>

          <Tabs defaultValue="edit-value" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="edit-value" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Editar Valor
              </TabsTrigger>
              <TabsTrigger value="multiple-months" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Múltiplos Meses
              </TabsTrigger>
              <TabsTrigger value="terminate" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Encerrar Contrato
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit-value" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="value">Valor (R$)</Label>
                <Input
                  id="value"
                  type="text"
                  value={displayValue}
                  onChange={(e) => handleValueChange(e.target.value)}
                  placeholder="0,00"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="percent-adjust">Ajuste percentual (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="percent-adjust"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={percentAdjustment}
                    onChange={(e) => {
                      const v = (e.target.value ?? '').toString().replace(',', '.');
                      const n = parseFloat(v);
                      setPercentAdjustment(isNaN(n) ? 0 : n);
                    }}
                    placeholder="0"
                    className="max-w-[160px]"
                  />
                </div>
                {percentAdjustment !== 0 && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>Novo valor calculado:</span>
                    <span className="font-medium">R$ {adjustedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <Button type="button" variant="secondary" size="sm" onClick={handleApplyAdjustedValue}>Aplicar</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações" rows={3} />
              </div>
            </TabsContent>

            <TabsContent value="multiple-months" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="apply-multiple" checked={applyToMultipleMonths} onCheckedChange={setApplyToMultipleMonths} />
                <Label htmlFor="apply-multiple" className="text-sm font-medium">Aplicar valor a múltiplos meses</Label>
              </div>

              {applyToMultipleMonths && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-2">Valor a ser aplicado:</p>
                    <p className="text-lg font-semibold">
                      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selecione os meses:</Label>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox id="select-all-months" checked={isAllSelected} onCheckedChange={(c) => handleToggleAllMonths(Boolean(c))} />
                      <Label htmlFor="select-all-months" className="text-sm cursor-pointer">Selecionar todos</Label>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {monthNamesFull.map((name, index) => {
                        const m = index + 1;
                        return (
                          <div key={m} className="flex items-center space-x-2">
                            <Checkbox id={`month-${m}`} checked={selectedMonths.includes(m)} onCheckedChange={(checked) => {
                              if (checked) setSelectedMonths(prev => [...prev, m].sort());
                              else setSelectedMonths(prev => prev.filter(x => x !== m));
                            }} />
                            <Label htmlFor={`month-${m}`} className="text-sm cursor-pointer">{name}</Label>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedMonths.length} {selectedMonths.length === 1 ? 'mês selecionado' : 'meses selecionados'}
                    </p>
                  </div>
                </div>
              )}

              {!applyToMultipleMonths && (
                <div className="p-8 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Ative a opção acima para aplicar o valor a múltiplos meses</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="terminate" className="space-y-4">
              <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Atenção: Encerramento de Contrato</p>
                    <p className="text-sm text-muted-foreground">
                      Esta ação irá definir uma data de encerramento para o contrato. 
                      A partir desta data, os valores recorrentes serão zerados automaticamente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="termination-date">Data de Encerramento</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="termination-date"
                    type="date"
                    value={terminationDate || suggestedTerminationDate}
                    onChange={(e) => {
                      console.log('[DEBUG] Data de encerramento alterada para:', e.target.value);
                      setTerminationDate(e.target.value);
                    }}
                    className="max-w-[200px]"
                  />
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => {
                      console.log('[DEBUG] Botão Encerrar clicado');
                      console.log('[DEBUG] terminationDate atual:', terminationDate);
                      handleTerminate();
                    }} 
                    disabled={(!terminationDate && !suggestedTerminationDate) || isTerminating}
                  >
                    {isTerminating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Encerrando...
                      </>
                    ) : (
                      'Encerrar Contrato'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Data sugerida baseada na célula atual: {new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Informações do Contrato:</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Número: {contract?.contract_number || 'Não disponível'}</p>
                  <p>Cliente: {contract?.contractor_name || 'Não disponível'}</p>
                  <p>Valor atual: R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-between mt-6">
            <div>
              {initialValue > 0 && (
                <Button variant="destructive" onClick={handleDelete} disabled={deleteOverride.isPending}>
                  {deleteOverride.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    'Remover Faturamento'
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={createOrUpdate.isPending || createOrUpdateMultiple.isPending || deleteOverride.isPending}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={createOrUpdate.isPending || createOrUpdateMultiple.isPending}>
                {(createOrUpdate.isPending || createOrUpdateMultiple.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showTerminateAlert} onOpenChange={setShowTerminateAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Encerramento do Contrato
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Tem certeza que deseja encerrar o contrato <strong>{contract?.contract_number || contractId}</strong>?</p>
              <p>Data de encerramento: <strong>{new Date(terminationDate).toLocaleDateString('pt-BR')}</strong></p>
              <p className="text-destructive">Esta ação não pode ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmTermination}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Encerrar Contrato
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContractMonthlyRevenueEditor;
