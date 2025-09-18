
import React from "react";
import { useContract } from "@/context/ContractContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateForInput, formatDateToBrazilian } from "@/utils/dateUtils";

interface PaymentInfoProps {
  disabled?: boolean;
}

const PaymentInfo = ({ disabled = false }: PaymentInfoProps) => {
  const { contractData, updateContractData, setActiveClauseId } = useContract();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const { name, value } = e.target;
    
    console.log("PaymentInfo - Campo alterado:", name, "Valor:", value);
    
    if (name === "paymentStartDate") {
      const brazilianDate = formatDateToBrazilian(value);
      console.log("PaymentInfo - Data convertida para brasileiro:", brazilianDate);
      if (brazilianDate && brazilianDate !== "") {
        updateContractData({ [name]: brazilianDate });
      }
    } else {
      updateContractData({ [name]: value });
    }
  };

  const handleFocus = (clauseId: string) => {
    if (!disabled) {
      setActiveClauseId(clauseId);
    }
  };

  const handleBlur = () => {
    // Opcional: remover destaque ao sair do campo
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="paymentStartDate">Data do Primeiro Pagamento</Label>
        <Input
          id="paymentStartDate"
          name="paymentStartDate"
          value={formatDateForInput(contractData.paymentStartDate || "")}
          onChange={handleInputChange}
          type="date"
          onFocus={() => handleFocus("clause-2-2")}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Valor no contrato: {contractData.paymentStartDate || "Não definido"}
          <br />
          <span className="text-blue-600">
            Calculado automaticamente: Data de início + {contractData.trialDays || 0} dias de teste
          </span>
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentDay">Dia de Pagamento</Label>
        <Input
          id="paymentDay"
          name="paymentDay"
          value={contractData.paymentDay || ""}
          onChange={handleInputChange}
          type="number"
          min="1" 
          max="31"
          onFocus={() => handleFocus("clause-7-1")}
          onBlur={handleBlur}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default PaymentInfo;
