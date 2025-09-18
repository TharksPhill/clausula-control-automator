
import React from "react";
import { Contractor } from "@/context/ContractContext";

interface ContractorInfoProps {
  contractor: Contractor;
  index: number;
  totalContractors: number;
}

const ContractorInfo: React.FC<ContractorInfoProps> = ({ contractor, index, totalContractors }) => {
  const getContractorLabel = () => {
    if (totalContractors === 1) {
      return "CONTRATANTE: ";
    }
    
    if (index === 0) {
      return "CONTRATANTE: ";
    }
    
    return `E DE OUTRO LADO TAMBÉM COMO CONTRATANTE ${index + 1}: `;
  };

  const getContractorDesignation = () => {
    if (totalContractors === 1) {
      return "CONTRATANTE";
    }
    
    return `CONTRATANTE ${index + 1}`;
  };

  return (
    <div className="contractor-block mb-4">
      <p className="text-justify leading-relaxed">
        <strong>{getContractorLabel()}</strong>
        {contractor.name}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº{" "}
        {contractor.cnpj}, com sede na {contractor.address}, {contractor.city}/{contractor.state},{" "}
        neste ato representada por {contractor.responsibleName},{" "}
        portador(a) do CPF nº {contractor.responsibleCpf}, 
        doravante denominada simplesmente <strong>{getContractorDesignation()}</strong>.
      </p>
    </div>
  );
};

export default ContractorInfo;
