
import React from "react";
import { useContract } from "@/context/ContractContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResponsibleListProps {
  disabled?: boolean;
}

const ResponsibleList = ({ disabled = false }: ResponsibleListProps) => {
  const { contractData, updateContractor } = useContract();

  const handleContractorChange = (id: string, field: string, value: string) => {
    if (!disabled) {
      updateContractor(id, { [field]: value });
    }
  };

  return (
    <>
      {contractData.contractors.map((contractor, index) => (
        <Card key={contractor.id} className="mb-6 border border-border">
          <CardHeader className="py-3 bg-muted">
            <CardTitle className="text-lg text-foreground">
              Responsável - {contractor.name || `Contratante ${index + 1}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Nome do Responsável</Label>
                <Input
                  value={contractor.responsibleName}
                  onChange={(e) => handleContractorChange(contractor.id, "responsibleName", e.target.value.toUpperCase())}
                  disabled={disabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  format="cpf"
                  value={contractor.responsibleCpf}
                  onChange={(e) => handleContractorChange(contractor.id, "responsibleCpf", e.target.value)}
                  placeholder="000.000.000-00"
                  disabled={disabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default ResponsibleList;
