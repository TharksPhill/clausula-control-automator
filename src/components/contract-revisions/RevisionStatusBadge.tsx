
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Eye, Lock, AlertTriangle } from "lucide-react";

interface RevisionStatusBadgeProps {
  status: "active" | "awaiting_contractor_review" | "awaiting_company_review" | "revision_approved" | "revision_rejected";
  showIcon?: boolean;
}

const RevisionStatusBadge = ({ status, showIcon = true }: RevisionStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          label: "Ativo",
          variant: "default" as const,
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 border-green-200"
        };
      case "awaiting_contractor_review":
        return {
          label: "Aguardando Contratante",
          variant: "secondary" as const,
          icon: Clock,
          className: "bg-yellow-100 text-yellow-800 border-yellow-200"
        };
      case "awaiting_company_review":
        return {
          label: "Aguardando Empresa",
          variant: "secondary" as const,
          icon: Eye,
          className: "bg-blue-100 text-blue-800 border-blue-200"
        };
      case "revision_approved":
        return {
          label: "Revisão Aprovada",
          variant: "default" as const,
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 border-green-200"
        };
      case "revision_rejected":
        return {
          label: "Revisão Rejeitada",
          variant: "destructive" as const,
          icon: XCircle,
          className: "bg-red-100 text-red-800 border-red-200"
        };
      default:
        return {
          label: "Desconhecido",
          variant: "outline" as const,
          icon: AlertTriangle,
          className: "bg-gray-100 text-gray-800 border-gray-200"
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      {showIcon && <IconComponent className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
};

export default RevisionStatusBadge;
