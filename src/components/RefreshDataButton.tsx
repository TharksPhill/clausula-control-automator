import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { RotateCcw, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
export const RefreshDataButton: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    toast
  } = useToast();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log("🔄 Iniciando refresh completo dos dados financeiros...");

    // Limpar TODO o cache antes de invalidar
    queryClient.removeQueries();
    
    // Invalidar TODAS as queries relacionadas a dados financeiros
    const queriesToInvalidate = [
      "financial-categories",
      "financial-categories-by-section", 
      "financial-sections",
      "monthly-financial-costs",
      "monthly-financial-costs-by-section",
      "financial-summary",
      "contracts",
      "contract-adjustments",
      "contract-overrides",
      "contract-license-costs",
      "company-costs",
      "costs"
    ];

    // Invalidar cada tipo de query
    for (const queryKey of queriesToInvalidate) {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
    }

    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 500));

    // Forçar refetch de todas as queries
    await queryClient.refetchQueries();
    
    console.log("✅ Refresh completo concluído com limpeza de cache");
    toast({
      title: "Dados Atualizados",
      description: "Todos os dados financeiros foram recarregados do banco de dados.",
      duration: 3000
    });
    setIsRefreshing(false);
  };
  const handleResetCache = async () => {
    setIsRefreshing(true);
    console.log("🗑️ Resetando todo o cache do React Query...");

    // Remover TODAS as queries do cache
    queryClient.removeQueries();

    // Limpar todo o cache
    queryClient.clear();

    // Aguardar um momento
    await new Promise(resolve => setTimeout(resolve, 500));

    // Forçar refetch de todas as queries
    await queryClient.refetchQueries();
    console.log("✅ Cache resetado e dados recarregados");
    toast({
      title: "Cache Resetado",
      description: "Todo o cache foi limpo e os dados foram recarregados do banco!"
    });
    setShowResetDialog(false);
    setIsRefreshing(false);
  };
  return <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="bg-background">
          <RotateCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar dados'}
        </Button>
        
        
      </div>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Completo do Cache</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá limpar completamente o cache local e recarregar todos os dados diretamente do banco de dados.
              Isso pode resolver problemas de sincronização, mas levará alguns segundos.
              <br /><br />
              <strong>Deseja continuar?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetCache}>
              Resetar Cache
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
};