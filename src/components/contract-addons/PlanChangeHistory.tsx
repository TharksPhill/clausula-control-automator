
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, Shield, CheckCircle, Clock } from "lucide-react";
import { ContractAddon } from "@/types/contract-addons";

interface PlanChangeHistoryProps {
  planChangeAddons: ContractAddon[];
  onDelete: (addonId: string) => void;
  getAddonTypeLabel: (type: string) => string;
}

const PlanChangeHistory = ({ planChangeAddons, onDelete, getAddonTypeLabel }: PlanChangeHistoryProps) => {
  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value.replace(',', '.'));
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isSignedPlanChange = (planChange: ContractAddon) => {
    return planChange.description?.includes('ASSINADO DIGITALMENTE EM') || 
           (planChange.plan_change_details && 
            typeof planChange.plan_change_details === 'object' && 
            planChange.plan_change_details !== null &&
            'digital_signature' in planChange.plan_change_details);
  };

  const getDigitalSignatureInfo = (planChange: ContractAddon) => {
    if (planChange.plan_change_details && 
        typeof planChange.plan_change_details === 'object' && 
        planChange.plan_change_details !== null &&
        'digital_signature' in planChange.plan_change_details) {
      return (planChange.plan_change_details as any).digital_signature;
    }
    return null;
  };

  if (planChangeAddons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Mudanças de Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma mudança de plano encontrada
            </h3>
            <p className="text-gray-600">
              Não há mudanças de plano registradas para este contrato.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Mudanças de Plano</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {planChangeAddons.map((addon) => {
            const isSigned = isSignedPlanChange(addon);
            const digitalSignature = getDigitalSignatureInfo(addon);

            return (
              <div key={addon.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-blue-600">
                      {getAddonTypeLabel(addon.addon_type)}
                    </Badge>
                    {isSigned ? (
                      <Badge className="bg-green-600">
                        <Shield className="w-3 h-3 mr-1" />
                        Assinado Digitalmente
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Pendente Assinatura
                      </Badge>
                    )}
                  </div>
                  {!isSigned && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(addon.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Descrição:</h4>
                    <p className="text-gray-700">
                      {addon.description.split(' - ASSINADO DIGITALMENTE EM')[0]}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Valor Anterior:</span>
                      <p className="text-lg font-semibold">
                        {addon.previous_value ? formatCurrency(addon.previous_value) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Novo Valor:</span>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(addon.new_value)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Data da Solicitação:</span>
                      <p className="font-semibold flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(addon.request_date)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600 font-medium">Solicitado por:</span>
                    <p className="text-gray-700">{addon.requested_by}</p>
                  </div>

                  {/* Informações da Assinatura Digital */}
                  {isSigned && digitalSignature && (
                    <div className="bg-gradient-to-r from-green-50 to-purple-50 border border-green-200 rounded-lg p-4 mt-4">
                      <h5 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Assinatura Digital
                      </h5>
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600 font-medium mb-1">Assinado por:</p>
                            <p className="text-green-700 font-semibold">{digitalSignature.contractor_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium mb-1">CPF:</p>
                            <p className="text-green-700">{digitalSignature.contractor_cpf}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium mb-1">Data/Hora:</p>
                            <p className="text-green-700">{new Date(digitalSignature.signed_at).toLocaleDateString('pt-BR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium mb-1">Método:</p>
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-purple-600" />
                              <p className="text-purple-700 font-semibold text-xs">Certificado Digital ICP-Brasil</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-xs text-gray-600 mb-1">Hash da Assinatura:</p>
                          <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                            {digitalSignature.signature_data?.substring(0, 80)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanChangeHistory;
