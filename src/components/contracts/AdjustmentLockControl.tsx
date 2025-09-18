
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdjustmentLockControlProps {
  contractId: string;
  renewalYear: number;
  onLockStatusChange: (isLocked: boolean) => void;
  className?: string;
}

interface AdjustmentLock {
  id: string;
  contract_id: string;
  renewal_year: number;
  is_locked: boolean;
  locked_at: string;
  locked_by: string;
  unlock_reason?: string;
  created_at: string;
  updated_at: string;
}

const AdjustmentLockControl: React.FC<AdjustmentLockControlProps> = ({
  contractId,
  renewalYear,
  onLockStatusChange,
  className = ""
}) => {
  const { toast } = useToast();
  const [lockStatus, setLockStatus] = useState<AdjustmentLock | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');

  // Buscar status do bloqueio
  useEffect(() => {
    const fetchLockStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('contract_adjustment_locks')
          .select('*')
          .eq('contract_id', contractId)
          .eq('renewal_year', renewalYear)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar status do bloqueio:', error);
          return;
        }

        if (data) {
          setLockStatus(data as AdjustmentLock);
          onLockStatusChange(data.is_locked || false);
        } else {
          setLockStatus(null);
          onLockStatusChange(false);
        }
      } catch (error) {
        console.error('Erro ao buscar status do bloqueio:', error);
      }
    };

    fetchLockStatus();
  }, [contractId, renewalYear, onLockStatusChange]);

  const handleToggleLock = async () => {
    if (lockStatus?.is_locked) {
      setShowUnlockDialog(true);
      return;
    }

    await createOrUpdateLock(true);
  };

  const handleUnlock = async () => {
    if (!unlockReason.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "É necessário informar o motivo do desbloqueio.",
      });
      return;
    }

    await createOrUpdateLock(false, unlockReason);
    setShowUnlockDialog(false);
    setUnlockReason('');
  };

  const createOrUpdateLock = async (isLocked: boolean, reason?: string) => {
    setLoading(true);
    
    try {
      const lockData = {
        contract_id: contractId,
        renewal_year: renewalYear,
        is_locked: isLocked,
        locked_at: isLocked ? new Date().toISOString() : lockStatus?.locked_at,
        locked_by: 'system', // Pode ser substituído por user_id quando autenticação estiver implementada
        unlock_reason: reason || null,
        updated_at: new Date().toISOString()
      };

      if (lockStatus) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('contract_adjustment_locks')
          .update(lockData)
          .eq('id', lockStatus.id);

        if (error) throw error;
      } else {
        // Criar novo registro
        const { error } = await supabase
          .from('contract_adjustment_locks')
          .insert(lockData);

        if (error) throw error;
      }

      // Atualizar estado local
      const updatedLock = { ...lockStatus, ...lockData } as AdjustmentLock;
      setLockStatus(updatedLock);
      onLockStatusChange(isLocked);

      toast({
        title: isLocked ? "Período Bloqueado" : "Período Desbloqueado",
        description: isLocked 
          ? `Reajustes bloqueados para a renovação de ${renewalYear}` 
          : `Reajustes liberados para a renovação de ${renewalYear}`,
      });

    } catch (error) {
      console.error('Erro ao alterar status do bloqueio:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao alterar status do bloqueio.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isLocked = lockStatus?.is_locked || false;

  return (
    <>
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Lock className="h-4 w-4 text-red-500" />
          ) : (
            <Unlock className="h-4 w-4 text-green-500" />
          )}
          <Badge 
            variant={isLocked ? "destructive" : "outline"}
            className="text-xs"
          >
            {isLocked ? "Bloqueado" : "Liberado"}
          </Badge>
        </div>

        <Button
          size="sm"
          variant={isLocked ? "destructive" : "outline"}
          onClick={handleToggleLock}
          disabled={loading}
        >
          {isLocked ? (
            <>
              <Unlock className="h-4 w-4 mr-2" />
              Desbloquear
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Bloquear
            </>
          )}
        </Button>
      </div>

      {lockStatus?.locked_at && (
        <div className="text-xs text-gray-600 mt-1">
          {isLocked ? "Bloqueado" : "Desbloqueado"} em: {new Date(lockStatus.locked_at).toLocaleString('pt-BR')}
          {lockStatus.unlock_reason && (
            <div className="text-orange-600 mt-1">
              Motivo do desbloqueio: {lockStatus.unlock_reason}
            </div>
          )}
        </div>
      )}

      {/* Dialog de Confirmação de Desbloqueio */}
      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Desbloquear Período de Reajuste
            </DialogTitle>
            <DialogDescription>
              Você está prestes a desbloquear o período de reajuste para a renovação de {renewalYear}. 
              É necessário informar o motivo do desbloqueio.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motivo do desbloqueio:</label>
              <textarea
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md resize-none"
                rows={3}
                placeholder="Ex: Correção de erro no reajuste anterior, solicitação do cliente, etc."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUnlockDialog(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUnlock}
              disabled={loading || !unlockReason.trim()}
            >
              {loading ? "Desbloqueando..." : "Confirmar Desbloqueio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdjustmentLockControl;
