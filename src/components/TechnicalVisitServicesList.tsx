import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Edit } from "lucide-react";
import { useTechnicalVisitServicesList } from "@/hooks/useTechnicalVisitServicesList";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TechnicalVisitServicesListProps {
  onEdit?: (id: string) => void;
}

const TechnicalVisitServicesList = ({ onEdit }: TechnicalVisitServicesListProps) => {
  const { services, loading, deleteService, toggleActiveStatus } = useTechnicalVisitServicesList();

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

  const getPricingTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed':
        return 'Preço Fixo';
      case 'hourly':
        return 'Por Hora';
      default:
        return type;
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

  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum serviço encontrado</p>
        <p className="text-sm">Configure serviços adicionais para oferecê-los durante as visitas técnicas.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo de Preço</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Horas Est.</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">
                  {service.name}
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate" title={service.description}>
                    {service.description || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getPricingTypeLabel(service.pricing_type)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-green-600">
                  {service.fixed_price ? formatCurrency(service.fixed_price) : '-'}
                </TableCell>
                <TableCell>
                  {service.estimated_hours ? `${service.estimated_hours}h` : '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(service.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={(checked) => toggleActiveStatus(service.id, checked)}
                    />
                    <Badge variant={service.is_active ? "default" : "secondary"}>
                      {service.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(service.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteService(service.id)}
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

export default TechnicalVisitServicesList;