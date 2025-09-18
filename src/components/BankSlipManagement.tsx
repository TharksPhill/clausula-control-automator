import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Receipt, 
  Building, 
  DollarSign, 
  FileText,
  Trash2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useBankSlipConfigurations } from "@/hooks/useBankSlipConfigurations";
import { useContracts } from "@/hooks/useContracts";
import { useForm } from "react-hook-form";

interface BankSlipForm {
  institution_name: string;
  slip_value: number;
}

const BankSlipManagement = () => {
  const { configurations, contractCosts, loading, saveConfiguration, applyToContracts, removeFromContract } = useBankSlipConfigurations();
  const { contracts } = useContracts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<string>("");
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BankSlipForm>();

  const activeContracts = contracts?.filter(contract => contract.status === 'Ativo') || [];

  const onSubmit = async (data: BankSlipForm) => {
    try {
      await saveConfiguration({
        ...data,
        is_active: true
      });
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
    }
  };

  const handleApplyToContracts = async () => {
    if (selectedConfig && selectedContracts.length > 0) {
      await applyToContracts(selectedConfig, selectedContracts);
      setIsApplyDialogOpen(false);
      setSelectedConfig("");
      setSelectedContracts([]);
    }
  };

  const handleContractSelection = (contractId: string, checked: boolean) => {
    if (checked) {
      setSelectedContracts([...selectedContracts, contractId]);
    } else {
      setSelectedContracts(selectedContracts.filter(id => id !== contractId));
    }
  };

  const getContractWithCost = (contractId: string) => {
    const contract = contracts?.find(c => c.id === contractId);
    const cost = contractCosts.find(c => c.contract_id === contractId);
    return { contract, cost };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações de boleto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Boletos</h1>
            <p className="text-muted-foreground">Configure valores de boleto e aplique aos contratos</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={configurations.length === 0}>
                <FileText className="h-4 w-4 mr-2" />
                Aplicar aos Contratos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Aplicar Boleto aos Contratos</DialogTitle>
                <DialogDescription>
                  Selecione uma configuração de boleto e os contratos onde deseja aplicar
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Configuração de Boleto</Label>
                  <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma configuração" />
                    </SelectTrigger>
                    <SelectContent>
                      {configurations.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          {config.institution_name} - R$ {config.slip_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Contratos Ativos</Label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {activeContracts.map((contract) => {
                        const hasExistingCost = contractCosts.some(c => c.contract_id === contract.id);
                        const contractorName = contract.contractors?.[0]?.name || 'Sem contratante';
                        const planType = contract.plan_type || 'mensal';
                        
                        return (
                          <div key={contract.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={contract.id}
                              checked={selectedContracts.includes(contract.id)}
                              onCheckedChange={(checked) => handleContractSelection(contract.id, checked as boolean)}
                            />
                            <Label htmlFor={contract.id} className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{contract.contract_number}</span>
                                  <span className="text-gray-500 ml-2">{contractorName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {planType}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    R$ {parseFloat(contract.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                  {hasExistingCost && (
                                    <Badge variant="secondary" className="text-xs">
                                      Com boleto
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Regras de Aplicação</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Contratos anuais e semestrais: custo aplicado apenas no 2º mês</li>
                    <li>• Contratos mensais: custo aplicado do 2º mês em diante (recorrente)</li>
                    <li>• O valor será considerado na análise de lucro por contrato</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsApplyDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleApplyToContracts}
                    disabled={!selectedConfig || selectedContracts.length === 0}
                  >
                    Aplicar aos {selectedContracts.length} Contrato(s)
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Configuração
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Configuração de Boleto</DialogTitle>
                <DialogDescription>
                  Configure o valor do boleto e a instituição bancária
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="institution_name">Instituição Bancária</Label>
                  <Input
                    id="institution_name"
                    {...register("institution_name", { 
                      required: "Instituição é obrigatória" 
                    })}
                    placeholder="Ex: Banco do Brasil, Santander, etc."
                  />
                  {errors.institution_name && (
                    <p className="text-sm text-red-500 mt-1">{errors.institution_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slip_value">Valor do Boleto (R$)</Label>
                  <Input
                    id="slip_value"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("slip_value", { 
                      required: "Valor é obrigatório",
                      min: { value: 0, message: "Valor deve ser positivo" }
                    })}
                    placeholder="0,00"
                  />
                  {errors.slip_value && (
                    <p className="text-sm text-red-500 mt-1">{errors.slip_value.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Salvar Configuração
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações de Boleto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Configurações de Boleto
            </CardTitle>
            <CardDescription>
              Valores e instituições configuradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configurations.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma configuração de boleto encontrada</p>
                <p className="text-sm text-gray-400 mt-1">Clique em "Nova Configuração" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {configurations.map((config) => (
                  <div key={config.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{config.institution_name}</h4>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {config.slip_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativa
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contratos com Boleto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contratos com Boleto
            </CardTitle>
            <CardDescription>
              Contratos que possuem custo de boleto aplicado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contractCosts.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum contrato com boleto aplicado</p>
                <p className="text-sm text-gray-400 mt-1">Use "Aplicar aos Contratos" para configurar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contractCosts.map((cost) => {
                  const { contract } = getContractWithCost(cost.contract_id);
                  if (!contract) return null;

                  return (
                    <div key={cost.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{contract.contract_number}</h4>
                          <p className="text-sm text-gray-600">
                            {contract.contractors?.[0]?.name || 'Sem contratante'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {contract.plan_type || 'mensal'}
                            </Badge>
                            <Badge variant={cost.is_recurring ? "default" : "secondary"} className="text-xs">
                              {cost.is_recurring ? "Recorrente" : "Único"}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            R$ {cost.monthly_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromContract(cost.contract_id)}
                            className="text-red-600 hover:text-red-800 mt-1"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      {contractCosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento de Custos por Contrato</CardTitle>
            <CardDescription>
              Visão detalhada dos custos de boleto aplicados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Contratante</TableHead>
                  <TableHead>Tipo de Plano</TableHead>
                  <TableHead>Valor do Contrato</TableHead>
                  <TableHead>Custo do Boleto</TableHead>
                  <TableHead>Cobrança</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractCosts.map((cost) => {
                  const { contract } = getContractWithCost(cost.contract_id);
                  if (!contract) return null;

                  return (
                    <TableRow key={cost.id}>
                      <TableCell className="font-medium">{contract.contract_number}</TableCell>
                      <TableCell>{contract.contractors?.[0]?.name || 'Sem contratante'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {contract.plan_type || 'mensal'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        R$ {parseFloat(contract.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        R$ {cost.monthly_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cost.is_recurring ? "default" : "secondary"}>
                          {cost.is_recurring ? "Mensal (2º mês+)" : "Único (2º mês)"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromContract(cost.contract_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BankSlipManagement;