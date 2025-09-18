import React from "react";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AttentionIconProps {
  contractId: string;
  analysisDate: Date;
  contracts?: any[];
}

export const AttentionIcon: React.FC<AttentionIconProps> = ({
  contractId,
  analysisDate,
  contracts = []
}) => {
  console.log('🔍 AttentionIcon - Debug Info:', {
    contractId,
    analysisDate: analysisDate.toISOString(),
    contractsCount: contracts.length,
    contracts: contracts.map(c => ({
      id: c.id,
      renewal_date: c.renewal_date,
      contract_number: c.contract_number
    }))
  });
  // Função para verificar se contrato está próximo do vencimento
  const isContractNearExpiry = (): { isNear: boolean; daysUntilExpiry: number; renewalDate?: Date } => {
    const contract = contracts.find(c => c.id === contractId);
    console.log('📋 AttentionIcon - Contract found:', contract);
    
    if (!contract?.renewal_date) {
      console.log('❌ AttentionIcon - No renewal date found');
      return { isNear: false, daysUntilExpiry: 0 };
    }
    
    // PROBLEMA: Usando data atual ao invés da data de análise!
    const currentDate = analysisDate; // Usar analysisDate em vez de new Date()
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    console.log('📅 AttentionIcon - Dates:', {
      currentDate: currentDate.toISOString(),
      currentMonth,
      currentYear,
      renewalDateString: contract.renewal_date
    });
    
    let renewalDate: Date;
    
    // Parse da data de renovação
    try {
      if (contract.renewal_date.includes('/')) {
        const [day, month, year] = contract.renewal_date.split('/');
        renewalDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (contract.renewal_date.includes('-')) {
        renewalDate = new Date(contract.renewal_date);
      } else {
        return { isNear: false, daysUntilExpiry: 0 };
      }
    } catch {
      return { isNear: false, daysUntilExpiry: 0 };
    }
    
    const renewalMonth = renewalDate.getMonth();
    const renewalYear = renewalDate.getFullYear();
    
    // Calcular diferença em dias
    const timeDiff = renewalDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Considera "próximo do vencimento" se for o mesmo mês/ano ou se faltam 30 dias ou menos
    const isNear = (renewalMonth === currentMonth && renewalYear === currentYear) || 
                   (daysDiff > 0 && daysDiff <= 30);
    
    console.log('🔍 AttentionIcon - Calculation Result:', {
      renewalDate: renewalDate.toISOString(),
      renewalMonth,
      renewalYear,
      currentMonth,
      currentYear,
      timeDiff,
      daysDiff,
      isNear,
      condition1: renewalMonth === currentMonth && renewalYear === currentYear,
      condition2: daysDiff > 0 && daysDiff <= 30
    });
    
    return {
      isNear,
      daysUntilExpiry: daysDiff,
      renewalDate
    };
  };

  const expiryInfo = isContractNearExpiry();

  if (!expiryInfo.isNear) {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  const getUrgencyLevel = () => {
    if (expiryInfo.daysUntilExpiry <= 7) return 'high';
    if (expiryInfo.daysUntilExpiry <= 15) return 'medium';
    return 'low';
  };

  const getUrgencyStyles = (urgency: 'high' | 'medium' | 'low') => {
    switch (urgency) {
      case 'high':
        return { 
          bgColor: 'bg-red-100', 
          textColor: 'text-red-800', 
          borderColor: 'border-red-200',
          iconColor: 'text-red-600'
        };
      case 'medium':
        return { 
          bgColor: 'bg-orange-100', 
          textColor: 'text-orange-800', 
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-600'
        };
      case 'low':
        return { 
          bgColor: 'bg-yellow-100', 
          textColor: 'text-yellow-800', 
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600'
        };
      default:
        return { 
          bgColor: 'bg-gray-100', 
          textColor: 'text-gray-800', 
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600'
        };
    }
  };

  const urgency = getUrgencyLevel();
  const styles = getUrgencyStyles(urgency);
  
  const contract = contracts.find(c => c.id === contractId);
  const contractor = contract?.contractors?.[0];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${styles.bgColor} ${styles.borderColor}`}>
              <AlertTriangle className={`h-3 w-3 ${styles.iconColor}`} />
              <span className={`text-xs font-medium ${styles.textColor}`}>
                {expiryInfo.daysUntilExpiry > 0 
                  ? `${expiryInfo.daysUntilExpiry}d`
                  : expiryInfo.daysUntilExpiry === 0 
                    ? "Hoje" 
                    : "Vencido"
                }
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            <div className="space-y-1">
              <div className="font-medium text-sm">
                ⚠️ Contrato próximo do vencimento
              </div>
              <div className="text-xs space-y-1">
                <div>📋 Contrato: {contract?.contract_number || "N/A"}</div>
                <div>👤 Contratante: {contractor?.name || "N/A"}</div>
                <div>📅 Renovação: {expiryInfo.renewalDate?.toLocaleDateString('pt-BR') || "N/A"}</div>
                <div className={`font-medium ${styles.textColor}`}>
                  {expiryInfo.daysUntilExpiry > 0 
                    ? `⏱️ Faltam ${expiryInfo.daysUntilExpiry} dia(s)`
                    : expiryInfo.daysUntilExpiry === 0 
                      ? "🔥 Vence hoje!" 
                      : `❌ Venceu há ${Math.abs(expiryInfo.daysUntilExpiry)} dia(s)`
                  }
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};