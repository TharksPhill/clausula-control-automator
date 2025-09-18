
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  RefreshCw, 
  Eye, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building,
  Shield,
  CheckCircle
} from 'lucide-react';

interface PlanChangeSignaturesTableProps {
  planChanges: any[];
  loading: boolean;
  onViewDetails: (planChange: any) => void;
}

const PlanChangeSignaturesTable: React.FC<PlanChangeSignaturesTableProps> = ({
  planChanges,
  loading,
  onViewDetails
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const getChangeType = (previous: string, current: string) => {
    const prevValue = parseFloat(previous || '0');
    const currValue = parseFloat(current || '0');
    
    if (currValue > prevValue) {
      return { 
        type: 'upgrade', 
        icon: TrendingUp, 
        color: 'bg-green-100 text-green-700',
        label: 'Upgrade'
      };
    } else if (currValue < prevValue) {
      return { 
        type: 'downgrade', 
        icon: TrendingDown, 
        color: 'bg-red-100 text-red-700',
        label: 'Downgrade'
      };
    } else {
      return { 
        type: 'change', 
        icon: RefreshCw, 
        color: 'bg-blue-100 text-blue-700',
        label: 'Alteração'
      };
    }
  };

  const getSignatureStatus = (planChange: any) => {
    const isSigned = planChange.description?.includes('ASSINADO DIGITALMENTE EM') || 
                     (planChange.plan_change_details && 
                      typeof planChange.plan_change_details === 'object' && 
                      planChange.plan_change_details !== null &&
                      'digital_signature' in planChange.plan_change_details);

    if (isSigned) {
      return {
        badge: (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <Shield className="h-3 w-3 mr-1" />
            Assinado Digitalmente
          </Badge>
        ),
        signedAt: (() => {
          const digitalSignature = (planChange.plan_change_details as any)?.digital_signature;
          if (digitalSignature) {
            return new Date(digitalSignature.signed_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          return 'Data não disponível';
        })()
      };
    }
    
    return {
      badge: (
        <Badge className="bg-orange-100 text-orange-700 border-orange-300">
          Aguardando Assinatura Digital
        </Badge>
      ),
      signedAt: null
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando mudanças de planos...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-purple-600" />
          Mudanças de Planos e Status de Assinaturas Digitais
        </CardTitle>
      </CardHeader>
      <CardContent>
        {planChanges.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma mudança de plano encontrada
            </h3>
            <p className="text-gray-600">
              Não há mudanças de planos que correspondam aos filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Contratante</TableHead>
                  <TableHead>Tipo de Mudança</TableHead>
                  <TableHead>Valores</TableHead>
                  <TableHead>Data da Solicitação</TableHead>
                  <TableHead>Status da Assinatura</TableHead>
                  <TableHead>Data da Assinatura</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planChanges.map((planChange) => {
                  const changeInfo = getChangeType(planChange.previous_value, planChange.new_value);
                  const ChangeIcon = changeInfo.icon;
                  const contractor = planChange.contract?.contractors?.[0];
                  const signatureStatus = getSignatureStatus(planChange);

                  return (
                    <TableRow key={planChange.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            #{planChange.contract?.contract_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {planChange.id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{contractor?.name}</div>
                            <div className="text-sm text-gray-500">
                              {contractor?.responsible_name}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className={changeInfo.color}>
                          <ChangeIcon className="h-3 w-3 mr-1" />
                          {changeInfo.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {planChange.previous_value && (
                            <div className="text-sm text-gray-500 line-through">
                              {formatCurrency(planChange.previous_value)}
                            </div>
                          )}
                          <div className="font-medium text-green-600">
                            {formatCurrency(planChange.new_value)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {formatDate(planChange.request_date)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {signatureStatus.badge}
                      </TableCell>

                      <TableCell>
                        {signatureStatus.signedAt ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700">
                              {signatureStatus.signedAt}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewDetails(planChange)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanChangeSignaturesTable;
