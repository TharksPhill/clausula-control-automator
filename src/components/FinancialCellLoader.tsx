import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FinancialCellLoaderProps {
  isLoading?: boolean;
  hasValue?: boolean;
  value?: React.ReactNode;
  className?: string;
}

export const FinancialCellLoader: React.FC<FinancialCellLoaderProps> = ({
  isLoading = false,
  hasValue = false,
  value,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={cn("relative", className)}>
        <Skeleton className="h-8 w-full animate-pulse bg-primary/5">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" />
          </div>
        </Skeleton>
      </div>
    );
  }

  if (hasValue) {
    return (
      <div className={cn("relative", className)}>
        <div className="animate-fadeIn">
          {value}
        </div>
      </div>
    );
  }

  return <>{value}</>;
};

// Adicionar estilos de animação no index.css se necessário