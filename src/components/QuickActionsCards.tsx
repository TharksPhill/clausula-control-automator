
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Plus, Settings, MapPin, TrendingUp, RefreshCw, DollarSign } from "lucide-react";

interface QuickActionsCardsProps {
  onActionClick?: (action: string) => void;
}

const QuickActionsCards = ({ onActionClick }: QuickActionsCardsProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Novo Contrato */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/60 hover:shadow-lg transition-all cursor-pointer" onClick={() => onActionClick?.('create-contract')}>
        <CardContent className="p-10 flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Novo Contrato</h3>
          </div>
        </CardContent>
      </Card>

      {/* Meus Contratos */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/60 hover:shadow-lg transition-all cursor-pointer" onClick={() => onActionClick?.('view-contracts')}>
        <CardContent className="p-10 flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Meus Contratos</h3>
          </div>
        </CardContent>
      </Card>

      {/* Mapas de Contratos no Brasil */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/60 hover:shadow-lg transition-all cursor-pointer" onClick={() => onActionClick?.('brazil-map')}>
        <CardContent className="p-10 flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Mapas de Contratos no Brasil</h3>
          </div>
        </CardContent>
      </Card>

      {/* Fluxo de Caixa */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/60 hover:shadow-lg transition-all cursor-pointer" onClick={() => onActionClick?.('cash-flow')}>
        <CardContent className="p-10 flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Fluxo de Caixa</h3>
          </div>
        </CardContent>
      </Card>

      {/* Mudar de Plano */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/60 hover:shadow-lg transition-all cursor-pointer" onClick={() => onActionClick?.('plan-changes')}>
        <CardContent className="p-10 flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Mudar de Plano</h3>
          </div>
        </CardContent>
      </Card>

      {/* Reajustes de Contratos */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/60 hover:shadow-lg transition-all cursor-pointer" onClick={() => onActionClick?.('contract-adjustments')}>
        <CardContent className="p-10 flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Reajustes de Contratos</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActionsCards;
