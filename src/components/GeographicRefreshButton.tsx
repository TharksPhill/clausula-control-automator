
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock } from "lucide-react";

interface GeographicRefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
}

const GeographicRefreshButton = ({ onRefresh, isRefreshing, lastUpdated }: GeographicRefreshButtonProps) => {
  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s atrás`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}min atrás`;
    } else {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh}
        disabled={isRefreshing}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Atualizando...' : 'Atualizar'}
      </Button>
      
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <Badge variant="secondary" className="text-xs">
          {formatLastUpdated(lastUpdated)}
        </Badge>
      </div>
    </div>
  );
};

export default GeographicRefreshButton;
