import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Edit } from "lucide-react";
import { useTechnicalVisitSettingsList } from "@/hooks/useTechnicalVisitSettingsList";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TechnicalVisitSettingsListProps {
  onEdit?: (id: string) => void;
}

const TechnicalVisitSettingsList = ({ onEdit }: TechnicalVisitSettingsListProps) => {
  const { settings, loading, deleteSettings } = useTechnicalVisitSettingsList();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-full mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (settings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma configuração encontrada</p>
        <p className="text-sm">Crie sua primeira configuração de visita técnica para começar.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Valor da Visita</TableHead>
              <TableHead>Valor por KM</TableHead>
              <TableHead>Exemplo (50km)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.map((setting) => (
              <TableRow key={setting.id}>
                <TableCell className="font-medium text-green-600">
                  {formatCurrency(setting.visit_cost)}
                </TableCell>
                <TableCell className="font-medium text-blue-600">
                  {formatCurrency(setting.km_cost)}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(setting.visit_cost + (setting.km_cost * 50))}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(setting.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSettings(setting.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TechnicalVisitSettingsList;