import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  useCreateOrUpdateMonthlyFinancialCost, 
  useCreateOrUpdateMultipleMonthlyFinancialCosts,
  useDeleteMonthlyFinancialCost 
} from "@/hooks/useMonthlyFinancialCosts";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";

interface MonthlyFinancialCostEditorProps {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  year: number;
  month: number;
  initialValue?: number;
  initialDescription?: string;
  initialNotes?: string;
}

export const MonthlyFinancialCostEditor: React.FC<MonthlyFinancialCostEditorProps> = ({
  open,
  onClose,
  categoryId,
  year,
  month,
  initialValue = 0,
  initialDescription = "",
  initialNotes = "",
}) => {
  const [value, setValue] = useState(initialValue);
  const [displayValue, setDisplayValue] = useState(
    initialValue > 0 ? initialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
  );
  const [description, setDescription] = useState(initialDescription);
  const [notes, setNotes] = useState(initialNotes);
  const [applyToMultipleMonths, setApplyToMultipleMonths] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([month]);

  const { data: categories } = useFinancialCategories();
  const createOrUpdateCost = useCreateOrUpdateMonthlyFinancialCost();
  const createOrUpdateMultipleCosts = useCreateOrUpdateMultipleMonthlyFinancialCosts();
  const deleteCost = useDeleteMonthlyFinancialCost();

  const category = categories?.find((cat) => cat.id === categoryId);

  useEffect(() => {
    setValue(initialValue);
    setDisplayValue(
      initialValue > 0 ? initialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
    );
    setDescription(initialDescription);
    setNotes(initialNotes);
    setSelectedMonths([month]);
    setApplyToMultipleMonths(false);
  }, [initialValue, initialDescription, initialNotes, month]);

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
    if (!formattedValue) return 0;
    
    // Remove pontos e substitui vírgula por ponto
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

  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
  const isAllSelected = selectedMonths.length === 12;
  const handleToggleAllMonths = (checked: boolean) => {
    setSelectedMonths(checked ? allMonths : []);
  };

  const handleSave = async () => {
    try {
      if (applyToMultipleMonths && selectedMonths.length > 1) {
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
      onClose();
    } catch (error) {
      console.error("Error saving cost:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover este custo?")) return;

    try {
      await deleteCost.mutateAsync({
        category_id: categoryId,
        year,
        month,
      });
      onClose();
    } catch (error) {
      console.error("Error deleting cost:", error);
    }
  };

  const handleMonthToggle = (monthNumber: number, checked: boolean) => {
    if (checked) {
      setSelectedMonths(prev => [...prev, monthNumber].sort());
    } else {
      setSelectedMonths(prev => prev.filter(m => m !== monthNumber));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Editar Custo - {category?.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {monthNames[month - 1]} de {year}
          </p>
        </DialogHeader>

        <div className="space-y-4">
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
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
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
              placeholder="Observações adicionais"
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
                <div className="space-y-2">
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

        <div className="flex gap-2 justify-between">
          <div>
            {initialValue > 0 && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteCost.isPending}
              >
                Remover
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
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
  );
};