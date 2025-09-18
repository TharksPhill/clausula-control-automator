
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, TrendingUp, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateNextRenewalFromAdjustment } from '@/utils/dateUtils';

interface BulkAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedContracts: any[];
  onSuccess: () => void;
}

const BulkAdjustmentModal: React.FC<BulkAdjustmentModalProps> = ({
  open,
  onOpenChange,
  selectedContracts,
  onSuccess
}) => {
  const { toast } = useToast();
  const [adjustmentPercentage, setAdjustmentPercentage] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Verificar se algum contrato está bloqueado
  const lockedContracts = selectedContracts.filter(contract => contract.isLocked);
  const hasLockedContracts = lockedContracts.length > 0;

  const handleApplyBulkAdjustment = async () => {
    if (!adjustmentPercentage || !adjustmentReason) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (hasLockedContracts) {
      toast({
        title: "Contratos Bloqueados",
        description: `${lockedContracts.length} contrato(s) estão bloqueados e não podem ser reajustados.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const percentage = parseFloat(adjustmentPercentage);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Processar cada contrato individualmente
      for (const contract of selectedContracts) {
        try {
          const currentValue = parseFloat(contract.monthly_value || '0');
          const newValue = currentValue * (1 + percentage / 100);
          
          // Criar registro do reajuste
          const { error: adjustmentError } = await supabase
            .from('contract_addons')
            .insert({
              contract_id: contract.id,
              addon_type: 'adjustment',
              description: `Reajuste em massa de ${percentage}% - ${adjustmentReason}`,
              previous_value: currentValue.toFixed(2),
              new_value: newValue.toFixed(2),
              requested_by: 'company'
            });

          if (adjustmentError) {
            console.error(`Erro ao criar reajuste para contrato ${contract.contract_number}:`, adjustmentError);
            errorCount++;
            continue;
          }

          // Atualizar valor do contrato
          const { error: contractError } = await supabase
            .from('contracts')
            .update({
              monthly_value: newValue.toFixed(2),
              updated_at: new Date().toISOString()
            })
            .eq('id', contract.id);

          if (contractError) {
            console.error(`Erro ao atualizar valor do contrato ${contract.contract_number}:`, contractError);
            errorCount++;
            continue;
          }

          // Calcular nova data de renovação
          const newRenewalDate = calculateNextRenewalFromAdjustment(
            contract.start_date, 
            new Date().toISOString(),
            12
          );

          // Atualizar data de renovação
          const { error: renewalError } = await supabase
            .from('contracts')
            .update({
              renewal_date: newRenewalDate
            })
            .eq('id', contract.id);

          if (renewalError) {
            console.error(`Erro ao atualizar data de renovação do contrato ${contract.contract_number}:`, renewalError);
            // Não contar como erro crítico, pois o valor foi atualizado
          }

          // Criar notificação automática para a próxima renovação
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: contract.user_id,
              contract_id: contract.id,
              type: 'renewal_reminder',
              title: `Renovação programada - Contrato ${contract.contract_number}`,
              message: `O contrato ${contract.contract_number} está programado para renovação em ${format(new Date(newRenewalDate), "dd/MM/yyyy", { locale: ptBR })}`,
              expires_at: format(new Date(newRenewalDate), 'yyyy-MM-dd HH:mm:ss')
            });

          if (notificationError) {
            console.warn(`Erro ao criar notificação para contrato ${contract.contract_number}:`, notificationError);
          }

          successCount++;
        } catch (error) {
          console.error(`Erro ao processar contrato ${contract.contract_number}:`, error);
          errorCount++;
        }
      }

      // Mostrar resultado final
      if (successCount > 0) {
        toast({
          title: "Reajuste em Massa Concluído",
          description: `${successCount} contrato(s) reajustado(s) com sucesso. ${errorCount > 0 ? `${errorCount} erro(s) encontrado(s).` : ''}`,
        });
      } else {
        toast({
          title: "Erro",
          description: "Nenhum contrato foi reajustado com sucesso.",
          variant: "destructive"
        });
      }

      onOpenChange(false);
      setAdjustmentPercentage("");
      setAdjustmentReason("");
      onSuccess();
      
    } catch (error) {
      console.error('Erro no reajuste em massa:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar reajuste em massa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePreviewValue = (currentValue: number) => {
    if (!adjustmentPercentage) return currentValue;
    const percentage = parseFloat(adjustmentPercentage);
    return currentValue * (1 + percentage / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Reajuste em Massa
          </DialogTitle>
          <DialogDescription>
            Aplicar reajuste a {selectedContracts.length} contrato(s) selecionado(s)
          </DialogDescription>
        </DialogHeader>
        
        {hasLockedContracts && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <Lock className="h-4 w-4" />
              <span className="font-medium">Contratos Bloqueados Encontrados</span>
            </div>
            <p className="text-red-700 text-sm">
              {lockedContracts.length} contrato(s) estão com o período de reajuste bloqueado e não podem ser reajustados:
            </p>
            <ul className="mt-2 text-sm text-red-700">
              {lockedContracts.map((contract) => (
                <li key={contract.id} className="flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  {contract.contract_number} - {contract.contractor?.name || 'N/A'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-percentage">Percentual de Reajuste (%)</Label>
            <Input
              id="bulk-percentage"
              type="number"
              step="0.01"
              placeholder="Ex: 10.5"
              value={adjustmentPercentage}
              onChange={(e) => setAdjustmentPercentage(e.target.value)}
              disabled={hasLockedContracts}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bulk-reason">Motivo do Reajuste</Label>
            <Select value={adjustmentReason} onValueChange={setAdjustmentReason} disabled={hasLockedContracts}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inflacao">Reajuste por Inflação</SelectItem>
                <SelectItem value="ipca">Reajuste IPCA</SelectItem>
                <SelectItem value="inpc">Reajuste INPC</SelectItem>
                <SelectItem value="igpm">Reajuste IGP-M</SelectItem>
                <SelectItem value="negociacao">Renegociação Comercial</SelectItem>
                <SelectItem value="melhoria">Melhoria de Serviços</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {adjustmentPercentage && !hasLockedContracts && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-blue-800 mb-3">Prévia do Reajuste</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedContracts.map((contract) => {
                  const currentValue = parseFloat(contract.monthly_value || '0');
                  const newValue = calculatePreviewValue(currentValue);
                  const difference = newValue - currentValue;
                  
                  return (
                    <div key={contract.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{contract.contract_number}</span>
                      <div className="text-right">
                        <div>R$ {currentValue.toFixed(2)} → R$ {newValue.toFixed(2)}</div>
                        <div className="text-blue-600 text-xs">+R$ {difference.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApplyBulkAdjustment} 
            disabled={loading || !adjustmentPercentage || !adjustmentReason || hasLockedContracts}
          >
            {loading ? "Aplicando..." : "Aplicar Reajuste em Massa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkAdjustmentModal;
