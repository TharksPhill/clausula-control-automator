
import React from "react";
import { CheckCircle, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";
import { useCostPlans } from "@/hooks/useCostPlans";
import { useContracts } from "@/hooks/useContracts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContractValueVariationColumnProps {
  contractId: string;
  analysisDate: Date;
}

export const ContractValueVariationColumn: React.FC<ContractValueVariationColumnProps> = ({
  contractId,
  analysisDate
}) => {
  const { adjustments } = useContractAdjustments();
  const { contractAddons } = useCostPlans();
  const { contracts } = useContracts();

  // Buscar dados do contrato e contratante
  const contract = contracts.find(c => c.id === contractId);
  const contractor = contract?.contractors?.[0];

  // Verificar se houve mudança de valor no mês da análise
  const getValueVariationIcon = () => {
    const analysisYear = analysisDate.getFullYear();
    const analysisMonth = analysisDate.getMonth();

    // Verificar ajustes percentuais (📈) - aplicados no mês seguinte à renovação
    const contractAdjustments = adjustments.filter(adj => adj.contract_id === contractId);
    
    for (const adjustment of contractAdjustments) {
      const effectiveDate = new Date(adjustment.effective_date);
      const effectiveYear = effectiveDate.getFullYear();
      const effectiveMonth = effectiveDate.getMonth();
      
      // Se o ajuste é efetivo no mês de análise
      if (effectiveYear === analysisYear && effectiveMonth === analysisMonth) {
        const baseTooltip = `Reajuste percentual aplicado\nValor anterior: R$ ${adjustment.previous_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nNovo valor: R$ ${adjustment.new_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const contractInfo = getContractInfo();
        
        return {
          icon: (
            <div className="flex items-center justify-center w-8 h-8 bg-blue-200 rounded-full border-2 border-blue-500 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-110">
              <TrendingUp className="h-5 w-5 text-blue-700" strokeWidth={3} />
            </div>
          ),
          tooltip: `📈 Reajuste: R$ ${adjustment.previous_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} → R$ ${adjustment.new_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n👤 ${contractor?.name || 'N/A'}`
        };
      }
    }

    // Verificar mudanças de plano manuais (⬆️ ou ⬇️)
    const contractAddonsList = contractAddons?.filter(addon => 
      addon.contract_id === contractId && 
      addon.addon_type === 'plan_change'
    ) || [];

    for (const addon of contractAddonsList) {
      const addonDate = new Date(addon.request_date);
      const addonYear = addonDate.getFullYear();
      const addonMonth = addonDate.getMonth();
      
      // Se a mudança de plano foi no mês de análise
      if (addonYear === analysisYear && addonMonth === analysisMonth) {
        const previousValue = parseFloat(addon.previous_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
        const newValue = parseFloat(addon.new_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');
        const contractInfo = getContractInfo();
        
        if (newValue > previousValue) {
          const baseTooltip = `Aumento manual do valor\nValor anterior: R$ ${previousValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nNovo valor: R$ ${newValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
          
          return {
            icon: (
              <div className="flex items-center justify-center w-8 h-8 bg-orange-200 rounded-full border-2 border-orange-500 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-110">
                <ArrowUp className="h-5 w-5 text-orange-700" strokeWidth={3} />
              </div>
            ),
            tooltip: `⬆️ Upgrade: R$ ${previousValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} → R$ ${newValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n👤 ${contractor?.name || 'N/A'}`
          };
        } else if (newValue < previousValue) {
          const baseTooltip = `Redução manual do valor\nValor anterior: R$ ${previousValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nNovo valor: R$ ${newValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
          
          return {
            icon: (
              <div className="flex items-center justify-center w-8 h-8 bg-red-200 rounded-full border-2 border-red-500 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-110">
                <ArrowDown className="h-5 w-5 text-red-700" strokeWidth={3} />
              </div>
            ),
            tooltip: `⬇️ Downgrade: R$ ${previousValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} → R$ ${newValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n👤 ${contractor?.name || 'N/A'}`
          };
        }
      }
    }

    // Caso padrão: sem alteração
    const contractInfo = getContractInfo();
    return {
      icon: (
        <div className="flex items-center justify-center w-8 h-8 bg-green-200 rounded-full border-2 border-green-500 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-110">
          <CheckCircle className="h-5 w-5 text-green-700" strokeWidth={3} />
        </div>
      ),
      tooltip: `✅ Sem alteração\n👤 ${contractor?.name || 'N/A'}`
    };
  };

  const getContractInfo = () => {
    if (!contract || !contractor) {
      return "Informações do contrato não disponíveis";
    }

    const formatDate = (dateString: string) => {
      if (!dateString) return "Não informado";
      
      // Tentar diferentes formatos de data
      let date;
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (dateString.includes('-')) {
        date = new Date(dateString);
      } else {
        return dateString;
      }
      
      return date.toLocaleDateString('pt-BR');
    };

    return [
      `👤 Contratante: ${contractor.name}`,
      `🏢 CNPJ: ${contractor.cnpj || "Não informado"}`,
      `📋 Plano inicial: ${contract.plan_type || "Não informado"}`,
      `📅 Início do contrato: ${formatDate(contract.start_date)}`,
      `🔄 Data de renovação: ${formatDate(contract.renewal_date)}`
    ].join('\n');
  };

  const variation = getValueVariationIcon();

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            {variation.icon}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm relative">
            <div className="whitespace-pre-line text-sm font-medium">
              {variation.tooltip}
            </div>
            <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-border"></div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
