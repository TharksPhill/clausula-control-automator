import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCosts } from "@/hooks/useCosts";
import { Edit, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MonthlyProjectionViewProps {
  selectedYear: number;
  selectedMonth: number;
}

interface CostData {
  cost_id: string;
  category: string;
  description: string;
  monthly_cost: number;
  cost_type: string;
  due_date?: string;
  is_due_this_month: boolean;
}

const MonthlyProjectionView: React.FC<MonthlyProjectionViewProps> = ({ selectedYear, selectedMonth }) => {
  const { getCostsByPeriod, getMonthlyCostSummary, updateProjection, costProjections } = useCosts();
  const [costData, setCostData] = useState<CostData[]>([]);
  const [summaryData, setSummaryData] = useState({ projected: 0, actual: 0, variance: 0, hasActualData: false });
  const [isEditingProjection, setIsEditingProjection] = useState(false);
  const [editingProjectionId, setEditingProjectionId] = useState<string | null>(null);
  const [newProjectedValue, setNewProjectedValue] = useState<number>(0);
  const [projectionNotes, setProjectionNotes] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  useEffect(() => {
    loadMonthData();
  }, [selectedYear, selectedMonth]);

  const loadMonthData = async () => {
    setLoading(true);
    try {
      const costs = await getCostsByPeriod(selectedYear, selectedMonth);
      const summary = await getMonthlyCostSummary(selectedYear, selectedMonth);
      
      setCostData(costs || []);
      setSummaryData(summary ? {
        projected: summary.projected || 0,
        actual: summary.actual || 0,
        variance: summary.variance || 0,
        hasActualData: summary.hasActualData || false
      } : { projected: 0, actual: 0, variance: 0, hasActualData: false });
    } catch (error) {
      console.error("Erro ao carregar dados do mês:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do mês",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProjection = (costId: string) => {
    const projection = costProjections.find(p => 
      p.company_cost_id === costId && 
      p.year === selectedYear && 
      p.month === selectedMonth
    );
    
    if (projection) {
      setEditingProjectionId(projection.id);
      setNewProjectedValue(projection.projected_cost);
      setProjectionNotes(projection.notes || "");
      setIsEditingProjection(true);
    }
  };

  const handleSaveProjection = async () => {
    if (!editingProjectionId) return;

    try {
      await updateProjection(editingProjectionId, newProjectedValue, projectionNotes);
      setIsEditingProjection(false);
      setEditingProjectionId(null);
      setNewProjectedValue(0);
      setProjectionNotes("");
      await loadMonthData();
    } catch (error) {
      console.error("Erro ao salvar projeção:", error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString + 'T00:00:00');
      return `Todo dia ${date.getDate()}`;
    } catch {
      return "-";
    }
  };

  const isCurrentOrFutureMonth = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    return selectedYear > currentYear || (selectedYear === currentYear && selectedMonth >= currentMonth);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Custos de {monthNames[selectedMonth - 1]} de {selectedYear}</span>
            {!isCurrentOrFutureMonth() && (
              <Badge variant="secondary" className="text-xs">
                Mês Passado
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Resumo do Mês */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-600">Projetado</div>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {summaryData.projected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-600">Realizado</div>
                <div className="text-2xl font-bold text-green-600">
                  R$ {summaryData.actual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-600">Variação</div>
                <div className={`text-2xl font-bold ${summaryData.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  R$ {summaryData.variance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Custos */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor Base</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costData.map((cost) => (
                <TableRow key={cost.cost_id}>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {cost.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{cost.description}</div>
                  </TableCell>
                  <TableCell className="font-medium">
                    R$ {cost.monthly_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatDate(cost.due_date)}
                      {cost.due_date && (
                        cost.is_due_this_month ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={cost.cost_type === 'fixed' ? 'default' : 'secondary'}>
                      {cost.cost_type === 'fixed' ? 'Fixo' : 'Variável'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isCurrentOrFutureMonth() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProjection(cost.cost_id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {costData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum custo encontrado para este período
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição de Projeção */}
      <Dialog open={isEditingProjection} onOpenChange={setIsEditingProjection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Projeção</DialogTitle>
            <DialogDescription>
              Altere a projeção para este mês e meses futuros. Mudanças não afetarão histórico passado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="projected_value">Valor Projetado</Label>
              <Input
                id="projected_value"
                type="number"
                step="0.01"
                value={newProjectedValue}
                onChange={(e) => setNewProjectedValue(Number(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                value={projectionNotes}
                onChange={(e) => setProjectionNotes(e.target.value)}
                placeholder="Motivo da alteração (opcional)"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditingProjection(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProjection}>
                Salvar Alteração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlyProjectionView;