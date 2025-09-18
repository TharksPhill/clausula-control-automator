
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";

interface PeriodSelectionModalProps {
  analysisDate: Date;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onSetAnalysisMonth: (year: number, month: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PeriodSelectionModal = ({
  analysisDate,
  onNavigateMonth,
  onSetAnalysisMonth,
  isOpen,
  onClose
}: PeriodSelectionModalProps) => {
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    }).replace(/^\w/, c => c.toUpperCase());
  };

  const formatPeriod = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
      <div className="bg-white h-full w-96 shadow-xl animate-slide-in-right">
        <Card className="h-full rounded-none border-0 shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Período de Análise
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Mês Atual Sendo Analisado - Destaque Principal */}
              <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-300">
                <div className="text-sm font-medium text-blue-700 mb-2">
                  Mês Atual em Análise
                </div>
                <div className="text-2xl font-bold text-blue-900 mb-2">
                  {formatMonthYear(analysisDate)}
                </div>
                <div className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full inline-block">
                  {formatPeriod(analysisDate)}
                </div>
              </div>

              {/* Navegação Principal */}
              <div className="flex items-center justify-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onNavigateMonth('prev')}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Mês Anterior
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onNavigateMonth('next')}
                  className="flex items-center gap-2"
                >
                  Próximo Mês
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Botão Voltar para Hoje */}
              <div className="flex justify-center">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    const today = new Date();
                    onSetAnalysisMonth(today.getFullYear(), today.getMonth());
                  }}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Voltar para Hoje
                </Button>
              </div>

              {/* Informações Adicionais */}
              <div className="space-y-3">
                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium mb-1">Navegação de Período</div>
                  <div className="text-xs text-gray-500">
                    Use os botões acima para navegar entre diferentes meses de análise. 
                    O período selecionado será aplicado a toda a análise de contratos.
                  </div>
                </div>

                <div className="text-sm text-gray-600 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="font-medium mb-1 text-amber-800">Dica</div>
                  <div className="text-xs text-amber-700">
                    Clique em "Voltar para Hoje" para retornar rapidamente ao mês atual.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PeriodSelectionModal;
