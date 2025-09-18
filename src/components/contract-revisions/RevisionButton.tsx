
import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RevisionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  revisionStatus?: string;
  loading?: boolean;
}

const RevisionButton = ({ 
  onClick, 
  disabled = false, 
  revisionStatus = "active",
  loading = false 
}: RevisionButtonProps) => {
  const isBlocked = revisionStatus === "awaiting_contractor_review" || revisionStatus === "awaiting_company_review";
  const isDisabled = disabled || isBlocked || loading;

  const getTooltipText = () => {
    if (revisionStatus === "awaiting_contractor_review") {
      return "Aguardando resposta do contratante para criar nova revisão";
    }
    if (revisionStatus === "awaiting_company_review") {
      return "Aguardando análise da empresa para criar nova revisão";
    }
    return "Criar nova revisão do contrato";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            disabled={isDisabled}
            variant={isBlocked ? "outline" : "default"}
            className="flex items-center gap-2"
          >
            {isBlocked ? <Lock className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            {loading ? "Carregando..." : "Nova Revisão"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RevisionButton;
