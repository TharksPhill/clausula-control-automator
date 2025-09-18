import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";
import { format, parseISO, addYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ContractAdjustmentModalProps {
  contract: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisDate?: Date;
}

const ContractAdjustmentModal = ({ contract, open, onOpenChange, analysisDate }: ContractAdjustmentModalProps) => {
  const { createAdjustment, isCreating, getEffectiveValueForContract, getAdjustmentsForContract } = useContractAdjustments();
  const [adjustmentType, setAdjustmentType] = useState<'value' | 'percentage'>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [notes, setNotes] = useState('');
  const [adjustmentDateOption, setAdjustmentDateOption] = useState<'renewal' | 'custom'>('renewal');
  const [customAdjustmentDate, setCustomAdjustmentDate] = useState<Date | undefined>(undefined);

  if (!contract) return null;

  const getNextRenewalDate = () => {
    if (!contract.renewal_date) return null;
    
    try {
      let originalRenewalDate: Date;
      
      if (contract.renewal_date.includes('/')) {
        const [day, month, year] = contract.renewal_date.split('/');
        originalRenewalDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        originalRenewalDate = parseISO(contract.renewal_date);
      }
      
      const today = analysisDate || new Date();
      const currentYear = today.getFullYear();
      
      // Buscar ajustes existentes para este contrato
      const contractAdjustments = getAdjustmentsForContract(contract.id);
      
      console.log(`📅 MODAL - Calculando próxima renovação MELHORADA:`, {
        contratoId: contract.id,
        dataRenovacaoOriginal: contract.renewal_date,
        dataHoje: today.toISOString().split('T')[0],
        anoAtual: currentYear,
        ajustesExistentes: contractAdjustments.length,
        ultimosAjustes: contractAdjustments.slice(0, 3).map(adj => ({
          id: adj.id,
          dataEfetiva: adj.effective_date,
          anoEfetivo: new Date(adj.effective_date).getFullYear(),
          valorNovo: adj.new_value
        }))
      });
      
      // Se não há ajustes, calcular para o período atual da renovação
      if (contractAdjustments.length === 0) {
        let nextRenewalDate = new Date(
          currentYear,
          originalRenewalDate.getMonth(),
          originalRenewalDate.getDate()
        );
        
        // CORREÇÃO: Se estamos no mês da renovação ou antes, usar este ano
        // Se já passou da data de renovação deste ano, usar o próximo ano
        const daysDiff = Math.ceil((nextRenewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < -30) {
          // Se já passou mais de 30 dias da renovação, usar o próximo ano
          nextRenewalDate = addYears(nextRenewalDate, 1);
        }
        
        console.log(`📅 MODAL - Sem ajustes existentes, próxima renovação CORRIGIDA:`, {
          proximaRenovacao: nextRenewalDate.toISOString().split('T')[0],
          anoCalculado: nextRenewalDate.getFullYear(),
          dataAnalise: today.toISOString().split('T')[0],
          logica: daysDiff < -30 ? 'Renovação passou há mais de 30 dias, usando próximo ano' : 'Usando ano atual da renovação',
          diasParaRenovacao: daysDiff
        });
        
        return nextRenewalDate;
      }
      
      // CORREÇÃO: Se há ajustes, encontrar o último ano com ajuste e calcular o próximo
      const adjustmentYears = contractAdjustments
        .map(adj => new Date(adj.effective_date).getFullYear())
        .sort((a, b) => b - a); // Ordenar do mais recente para o mais antigo
      
      const lastAdjustmentYear = adjustmentYears[0];
      
      // CORREÇÃO: Verificar se já existe ajuste para o ano atual de análise
      const hasAdjustmentForCurrentYear = adjustmentYears.includes(currentYear);
      
      // Se não há ajuste para o ano atual, usar o ano atual
      // Se já há ajuste para o ano atual, usar o próximo ano disponível
      let nextYearForAdjustment;
      if (!hasAdjustmentForCurrentYear) {
        nextYearForAdjustment = currentYear;
      } else {
        nextYearForAdjustment = lastAdjustmentYear + 1;
      }
      
      const nextRenewalDate = new Date(
        nextYearForAdjustment,
        originalRenewalDate.getMonth(),
        originalRenewalDate.getDate()
      );
      
      console.log(`📅 MODAL - Com ajustes existentes, próxima renovação:`, {
        ultimoAnoComAjuste: lastAdjustmentYear,
        proximoAnoParaAjuste: nextYearForAdjustment,
        proximaRenovacao: nextRenewalDate.toISOString().split('T')[0],
        logicaAplicada: `Último ajuste em ${lastAdjustmentYear}, próximo em ${nextYearForAdjustment}`
      });
      
      return nextRenewalDate;
      
    } catch (error) {
      console.error(`❌ MODAL - Erro ao calcular próxima renovação:`, error);
      return null;
    }
  };

  const renewalDate = getNextRenewalDate();

  const getCurrentEffectiveValue = () => {
    const baseValue = parseFloat(contract.monthly_value || '0');
    
    // Se escolheu data personalizada, calcular o valor efetivo nessa data específica
    if (adjustmentDateOption === 'custom' && customAdjustmentDate) {
      // Calcular um dia antes da data personalizada para obter o valor que estará vigente até então
      const dayBeforeCustomDate = new Date(customAdjustmentDate);
      dayBeforeCustomDate.setDate(dayBeforeCustomDate.getDate() - 1);
      
      const effectiveValue = getEffectiveValueForContract(contract.id, baseValue, dayBeforeCustomDate);
      
      console.log(`💰 MODAL - Valor efetivo para data personalizada:`, {
        contratoId: contract.id,
        valorBaseOriginal: baseValue,
        dataPersonalizada: customAdjustmentDate.toISOString().split('T')[0],
        dataConsulta: dayBeforeCustomDate.toISOString().split('T')[0],
        valorEfetivoNaData: effectiveValue,
        diferencaDoBase: effectiveValue - baseValue,
        explicacao: `Calculando valor efetivo que estará vigente em ${customAdjustmentDate.toISOString().split('T')[0]}`
      });
      
      return effectiveValue;
    }
    
    // Lógica original para data de renovação padrão
    if (!renewalDate) {
      console.log(`⚠️ MODAL - Sem data de renovação, usando valor base:`, baseValue);
      return baseValue;
    }
    
    // Calcular um dia antes da próxima renovação para obter o valor que estará vigente até então
    const dayBeforeRenewal = new Date(renewalDate);
    dayBeforeRenewal.setDate(dayBeforeRenewal.getDate() - 1);
    
    const effectiveValue = getEffectiveValueForContract(contract.id, baseValue, dayBeforeRenewal);
    
    console.log(`💰 MODAL - Valor base CORRIGIDO para NOVO reajuste (${renewalDate.getFullYear()}):`, {
      contratoId: contract.id,
      valorBaseOriginal: baseValue,
      dataConsultaCorrigida: dayBeforeRenewal.toISOString().split('T')[0],
      valorEfetivoNaDataAnterior: effectiveValue,
      proximaRenovacao: renewalDate.toISOString().split('T')[0],
      anoNovoReajuste: renewalDate.getFullYear(),
      diferencaDoBase: effectiveValue - baseValue,
      explicacao: `Usando valor efetivo em ${dayBeforeRenewal.toISOString().split('T')[0]} como base para reajuste de ${renewalDate.getFullYear()}`
    });
    
    return effectiveValue;
  };
  
  // Recalcular o valor atual sempre que a opção de data ou a data personalizada mudar
  const currentValue = useMemo(() => {
    return getCurrentEffectiveValue();
  }, [adjustmentDateOption, customAdjustmentDate, contract.id, renewalDate]);
  
  // Calculate new value based on adjustment
  const getNewValue = () => {
    const adjValue = parseFloat(adjustmentValue || '0');
    if (adjustmentType === 'percentage') {
      return currentValue * (1 + adjValue / 100);
    } else {
      return adjValue;
    }
  };

  const newValue = getNewValue();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar dados essenciais
    const adjustmentRenewalDate = adjustmentDateOption === 'custom' && customAdjustmentDate 
      ? customAdjustmentDate 
      : renewalDate;
      
    if (!adjustmentRenewalDate || !adjustmentValue) {
      console.warn("🚫 MODAL - Dados insuficientes para criar reajuste");
      return;
    }

    // Lógica para determinar a data de efetivação
    const today = new Date();
    let effectiveDate = adjustmentRenewalDate;
    let adjustmentNote = '';
    
    // Se foi escolhida data customizada
    if (adjustmentDateOption === 'custom' && customAdjustmentDate) {
      adjustmentNote = `Data de renovação personalizada: ${format(customAdjustmentDate, 'dd/MM/yyyy', { locale: ptBR })}`;
      effectiveDate = customAdjustmentDate;
    }
    // Lógica normal para contratos regulares
    else if (today > adjustmentRenewalDate) {
      // Extrair o dia de pagamento do contrato (assumindo que está no campo payment_day ou usando o dia da renovação)
      const paymentDay = contract.payment_day || adjustmentRenewalDate.getDate();
      
      // Criar data de pagamento do mês atual
      const currentMonthPayment = new Date(today.getFullYear(), today.getMonth(), paymentDay);
      
      // Se ainda não passou da data de pagamento do mês atual, aplicar neste mês
      if (today <= currentMonthPayment) {
        effectiveDate = new Date(today.getFullYear(), today.getMonth(), 1); // Primeiro dia do mês atual
        adjustmentNote = `Reajuste retroativo aplicado no mês atual (${format(effectiveDate, 'MM/yyyy', { locale: ptBR })}) - Pagamento ainda não vencido`;
      } else {
        // Se já passou da data de pagamento, aplicar no próximo mês
        effectiveDate = new Date(today.getFullYear(), today.getMonth() + 1, 1); // Primeiro dia do próximo mês
        adjustmentNote = `Reajuste aplicado a partir do próximo mês (${format(effectiveDate, 'MM/yyyy', { locale: ptBR })}) - Pagamento do mês atual já vencido`;
      }
      
      console.log("⏰ MODAL - Reajuste após prazo de renovação:", {
        dataRenovacao: adjustmentRenewalDate.toISOString().split('T')[0],
        dataHoje: today.toISOString().split('T')[0],
        diaPagamento: paymentDay,
        dataEfetiva: effectiveDate.toISOString().split('T')[0],
        observacao: adjustmentNote
      });
    }

    // Combinar nota de ajuste retroativo com as observações do usuário
    const finalNotes = adjustmentNote 
      ? (notes.trim() ? `${adjustmentNote}\n\n${notes.trim()}` : adjustmentNote)
      : notes.trim() || undefined;

    const adjustmentData = {
      contract_id: contract.id,
      adjustment_type: adjustmentType,
      adjustment_value: parseFloat(adjustmentValue),
      renewal_date: format(adjustmentRenewalDate, 'yyyy-MM-dd'),
      previous_value: currentValue, // CORREÇÃO: Usar o valor efetivo atual como valor anterior
      new_value: newValue,
      effective_date: format(effectiveDate, 'yyyy-MM-dd'),
      notes: finalNotes,
    };

    console.log(`🚀 MODAL - ENVIANDO NOVO reajuste CORRIGIDO:`, {
      contratoId: contract.id,
      anoReajuste: renewalDate.getFullYear(),
      valorAnteriorEfetivo: currentValue, // Agora é realmente o valor com reajustes anteriores
      valorNovoCalculado: newValue,
      tipoReajuste: adjustmentType,
      percentualOuValor: adjustmentValue,
      incrementoReal: newValue - currentValue,
      percentualRealCalculado: ((newValue - currentValue) / currentValue * 100).toFixed(2) + '%',
      explicacaoValorBase: `Valor ${currentValue} já inclui todos os reajustes anteriores até a data de renovação`,
      dadosParaEnvio: adjustmentData
    });

    try {
      createAdjustment(adjustmentData);
      
      console.log("✅ MODAL - NOVO reajuste enviado com valor base CORRETO, aguardando confirmação...");
      
      // Reset form
      setAdjustmentValue('');
      setNotes('');
      onOpenChange(false);
      
    } catch (error) {
      console.error("❌ MODAL - Erro ao criar NOVO reajuste:", error);
    }
  };

  const getDaysUntilRenewal = () => {
    if (!renewalDate) return null;
    const today = analysisDate || new Date();
    const diffTime = renewalDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilRenewal = getDaysUntilRenewal();
  const renewalYear = renewalDate?.getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Reajustar Contrato
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contract Info - Simplified */}
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Contrato</p>
              <p className="font-medium">{contract.contract_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Atual</p>
              <p className="font-medium text-foreground">R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Seleção de Data de Renovação */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Data do Reajuste</Label>
            <RadioGroup 
              value={adjustmentDateOption} 
              onValueChange={(value) => setAdjustmentDateOption(value as 'renewal' | 'custom')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="renewal" id="renewal" />
                <label htmlFor="renewal" className="text-sm cursor-pointer">
                  Data de renovação ({renewalDate ? format(renewalDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Não definida'})
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <label htmlFor="custom" className="text-sm cursor-pointer">
                  Escolher data personalizada
                </label>
              </div>
            </RadioGroup>
            
            {adjustmentDateOption === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customAdjustmentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customAdjustmentDate ? (
                      format(customAdjustmentDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customAdjustmentDate}
                    onSelect={setCustomAdjustmentDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Adjustment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="adjustmentType">Tipo de Reajuste</Label>
                <RadioGroup
                  value={adjustmentType}
                  onValueChange={(value: 'value' | 'percentage') => setAdjustmentType(value)}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <label htmlFor="percentage" className="text-sm">Percentual (%)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="value" id="value" />
                    <label htmlFor="value" className="text-sm">Valor Fixo (R$)</label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="adjustmentValue">
                  {adjustmentType === 'percentage' ? 'Percentual' : 'Novo Valor'}
                </Label>
                <Input
                  id="adjustmentValue"
                  type="number"
                  step="0.01"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder={adjustmentType === 'percentage' ? '10.5' : '1200.00'}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Justificativa para o reajuste..."
                rows={2}
              />
            </div>

            {/* Preview */}
            {adjustmentValue && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Resumo do Reajuste</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Valor Atual:</span>
                    <span className="font-medium ml-2">
                      R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Novo Valor:</span>
                    <span className="font-medium text-primary ml-2">
                      R$ {newValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Variação:</span>
                    <span className={`font-medium ml-2 ${newValue > currentValue ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {newValue > currentValue ? '+' : ''}
                      {((newValue - currentValue) / currentValue * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating || !renewalDate}
              >
                {isCreating ? 'Aplicando...' : 'Aplicar Reajuste'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractAdjustmentModal;
