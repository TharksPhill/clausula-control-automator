import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { AlertTriangle, Trash2 } from "lucide-react";
import { useCreateOrUpdateSectionCost, useCreateOrUpdateMultipleSectionCosts } from "@/hooks/useMonthlyFinancialCostsBySection";
import { useDeleteMultipleSectionCosts } from "@/hooks/useDeleteMultipleSectionCosts";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { toast } from "sonner";

interface SectionFinancialCostEditorProps {
  open: boolean;
  onClose: () => void;
  sectionId: string;
  categoryId: string;
  year: number;
  month: number;
  initialValue?: number;
  initialDescription?: string;
  initialNotes?: string;
  onSaveStart?: () => void;
  onSaveEnd?: () => void;
}

export const SectionFinancialCostEditor: React.FC<SectionFinancialCostEditorProps> = ({
  open,
  onClose,
  sectionId,
  categoryId,
  year,
  month,
  initialValue = 0,
  initialDescription = "",
  initialNotes = "",
  onSaveStart,
  onSaveEnd,
}) => {
  const [value, setValue] = useState(initialValue);
  const [displayValue, setDisplayValue] = useState(
    initialValue > 0 ? initialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
  );
  const [description, setDescription] = useState(initialDescription);
  const [notes, setNotes] = useState(initialNotes);
  const [applyToMultipleMonths, setApplyToMultipleMonths] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([month]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMultipleMonths, setDeleteMultipleMonths] = useState(false);
  const [deleteSelectedMonths, setDeleteSelectedMonths] = useState<number[]>([month]);

  const { data: categories } = useFinancialCategories();
  const createOrUpdateCost = useCreateOrUpdateSectionCost(sectionId);
  const createOrUpdateMultipleCosts = useCreateOrUpdateMultipleSectionCosts(sectionId);
  const deleteMultipleCosts = useDeleteMultipleSectionCosts(sectionId);

  const category = categories?.find((cat) => cat.id === categoryId);
  const isAllSelected = selectedMonths.length === 12;
  const isAllDeleteSelected = deleteSelectedMonths.length === 12;

  useEffect(() => {
    setValue(initialValue);
    setDisplayValue(
      initialValue > 0 ? initialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
    );
    setDescription(initialDescription);
    setNotes(initialNotes);
  }, [initialValue, initialDescription, initialNotes]);

  const formatCurrency = (val: string) => {
    // Remove tudo que não for dígito
    const numbers = val.replace(/\D/g, '');
    if (!numbers) return '';
    
    // Converte para número com decimais
    const numberValue = parseInt(numbers) / 100;
    
    // Formata como moeda brasileira
    return numberValue.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const parseFormattedValue = (formattedValue: string): number => {
    const cleanValue = formattedValue.replace(/\./g, '').replace(',', '.');
    const numberValue = parseFloat(cleanValue);
    
    return isNaN(numberValue) ? 0 : numberValue;
  };

  const handleValueChange = (inputValue: string) => {
    const formatted = formatCurrency(inputValue);
    setDisplayValue(formatted);
    setValue(parseFormattedValue(formatted));
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const handleMonthToggle = (monthNumber: number, checked: boolean) => {
    if (checked) {
      setSelectedMonths([...selectedMonths, monthNumber].sort((a, b) => a - b));
    } else {
      setSelectedMonths(selectedMonths.filter(m => m !== monthNumber));
    }
  };

  const handleToggleAllMonths = (checked: boolean) => {
    if (checked) {
      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    } else {
      setSelectedMonths([month]);
    }
  };

  const handleSave = async () => {
    try {
      onSaveStart?.();
      
      if (applyToMultipleMonths && selectedMonths.length > 0) {
        await createOrUpdateMultipleCosts.mutateAsync({
          category_id: categoryId,
          year,
          months: selectedMonths,
          value: value,
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await createOrUpdateCost.mutateAsync({
          category_id: categoryId,
          year,
          month,
          value: value,
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      onSaveEnd?.();
      onClose();
    } catch (error) {
      console.error("Error saving cost:", error);
      toast.error("Erro ao salvar valor");
      onSaveEnd?.();
    }
  };

  const handleDelete = async () => {
    try {
      onSaveStart?.();
      
      if (deleteMultipleMonths && deleteSelectedMonths.length > 0) {
        await deleteMultipleCosts.mutateAsync({
          category_id: categoryId,
          year,
          months: deleteSelectedMonths,
        });
      } else {
        await createOrUpdateCost.mutateAsync({
          category_id: categoryId,
          year,
          month,
          value: 0,
          description: undefined,
          notes: undefined,
        });
      }
      
      onSaveEnd?.();
      setShowDeleteConfirm(false);
      onClose(); // Fecha o modal principal após deletar
      toast.success(deleteMultipleMonths ? "Valores removidos com sucesso" : "Valor removido com sucesso");
    } catch (error) {
      console.error("Error deleting cost(s):", error);
      toast.error("Erro ao remover valor(es)");
      onSaveEnd?.();
    }
  };

  const handleDeleteToggleMonth = (monthNumber: number, checked: boolean) => {
    if (checked) {
      setDeleteSelectedMonths([...deleteSelectedMonths, monthNumber].sort((a, b) => a - b));
    } else {
      setDeleteSelectedMonths(deleteSelectedMonths.filter(m => m !== monthNumber));
    }
  };

  const handleToggleAllDeleteMonths = (checked: boolean) => {
    if (checked) {
      setDeleteSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    } else {
      setDeleteSelectedMonths([month]);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Editar Valor - {category?.name || "Categoria"}
            </DialogTitle>
            <DialogDescription>
              {monthNames[month - 1]} de {year}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                type="text"
                value={displayValue}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="0,00"
                className="text-right font-mono"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do custo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre este valor"
                rows={3}
              />
            </div>

            {/* Opção para aplicar a múltiplos meses */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="apply-multiple"
                  checked={applyToMultipleMonths}
                  onCheckedChange={setApplyToMultipleMonths}
                />
                <Label htmlFor="apply-multiple" className="text-sm">
                  Aplicar a múltiplos meses
                </Label>
              </div>

              {applyToMultipleMonths && (
                <div className="space-y-2 animate-fade-in">
                  <Label className="text-sm font-medium">Selecione os meses:</Label>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="select-all-months"
                      checked={isAllSelected}
                      onCheckedChange={(checked) => handleToggleAllMonths(Boolean(checked))}
                    />
                    <Label htmlFor="select-all-months" className="text-xs cursor-pointer">
                      Selecionar todos
                    </Label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {monthNames.map((monthName, index) => {
                      const monthNumber = index + 1;
                      return (
                        <div key={monthNumber} className="flex items-center space-x-2">
                          <Checkbox
                            id={`month-${monthNumber}`}
                            checked={selectedMonths.includes(monthNumber)}
                            onCheckedChange={(checked) => handleMonthToggle(monthNumber, checked as boolean)}
                          />
                          <Label 
                            htmlFor={`month-${monthNumber}`} 
                            className="text-xs cursor-pointer"
                          >
                            {monthName.slice(0, 3)}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedMonths.length} meses selecionados
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between gap-2">
            {initialValue > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={createOrUpdateCost.isPending || deleteMultipleCosts.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </Button>
            )}
            
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={createOrUpdateCost.isPending || createOrUpdateMultipleCosts.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão moderno */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Tem certeza que deseja remover os valores de {category?.name}?</p>
              
              {/* Opção para deletar múltiplos meses */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="delete-multiple"
                    checked={deleteMultipleMonths}
                    onCheckedChange={setDeleteMultipleMonths}
                  />
                  <Label htmlFor="delete-multiple" className="text-sm">
                    Remover de múltiplos meses
                  </Label>
                </div>

                {deleteMultipleMonths && (
                  <div className="space-y-2 animate-fade-in">
                    <Label className="text-sm font-medium">Selecione os meses:</Label>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="select-all-delete-months"
                        checked={isAllDeleteSelected}
                        onCheckedChange={(checked) => handleToggleAllDeleteMonths(Boolean(checked))}
                      />
                      <Label htmlFor="select-all-delete-months" className="text-xs cursor-pointer">
                        Selecionar todos
                      </Label>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {monthNames.map((monthName, index) => {
                        const monthNumber = index + 1;
                        return (
                          <div key={monthNumber} className="flex items-center space-x-2">
                            <Checkbox
                              id={`delete-month-${monthNumber}`}
                              checked={deleteSelectedMonths.includes(monthNumber)}
                              onCheckedChange={(checked) => handleDeleteToggleMonth(monthNumber, checked as boolean)}
                            />
                            <Label 
                              htmlFor={`delete-month-${monthNumber}`} 
                              className="text-xs cursor-pointer"
                            >
                              {monthName.slice(0, 3)}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {deleteSelectedMonths.length} meses selecionados para exclusão
                    </p>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-destructive font-medium">
                Esta ação não pode ser desfeita.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};