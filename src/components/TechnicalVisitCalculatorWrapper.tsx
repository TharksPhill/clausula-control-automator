import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Target, MapPin, ToggleLeft, ToggleRight } from "lucide-react";
import TechnicalVisitCalculator from "./TechnicalVisitCalculator";
import MultiDestinationCalculator from "./MultiDestinationCalculator";

const TechnicalVisitCalculatorWrapper = () => {
  const [isMultiDestination, setIsMultiDestination] = useState(false);

  return (
    <div className="space-y-6">
      {/* Toggle entre modo single e multi-destinos */}
      <Card className="bg-background/20 border border-gray-500/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gray-400" />
              <span className="text-white">Calculadora de Visita Técnica</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={!isMultiDestination ? "default" : "outline"} className="flex items-center gap-1 bg-gray-500/20 text-gray-300 border border-gray-500/30">
                <MapPin className="w-3 h-3" />
                Destino Único
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMultiDestination(!isMultiDestination)}
                className="p-1 hover:bg-gray-500/10"
              >
                {isMultiDestination ? (
                  <ToggleRight className="w-8 h-8 text-gray-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </Button>
              <Badge variant={isMultiDestination ? "default" : "outline"} className="flex items-center gap-1 bg-gray-500/20 text-gray-300 border border-gray-500/30">
                <Target className="w-3 h-3" />
                Multi-Destinos
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {isMultiDestination 
              ? "Modo Multi-Destinos: Configure vários destinos com diferentes clientes e serviços"
              : "Modo Destino Único: Configure uma visita técnica para um cliente específico"
            }
          </div>
        </CardContent>
      </Card>

      {/* Renderizar calculadora apropriada */}
      {isMultiDestination ? (
        <MultiDestinationCalculator />
      ) : (
        <TechnicalVisitCalculator />
      )}
    </div>
  );
};

export default TechnicalVisitCalculatorWrapper;