import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useContracts } from "@/hooks/useContracts";
import { parseMonetaryValue } from "@/utils/monetaryValueParser";

interface Contractor {
  id: string;
  name: string;
  cnpj: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  responsibleName: string;
  responsibleCpf: string;
  responsibleRg?: string;
}

interface CompanyData {
  name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  responsibleName: string;
  phone: string;
  email: string;
  logo?: string;
  website?: string;
}

interface ContractData {
  contractNumber: string;
  employeeCount: string;
  cnpjCount: string;
  trialDays: string;
  startDate: string;
  monthlyValue: string;
  renewalDate: string;
  paymentStartDate: string;
  paymentDay: string;
  planType?: string;
  semestralDiscount?: string;
  anualDiscount?: string;
  contractors: Contractor[];
  companyData: CompanyData;
  planChangeSignatures?: any[];
}

// Function to generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Function to format date to Brazilian format (dd/mm/yyyy)
const formatDateToBrazilian = (dateStr: string): string => {
  console.log("formatDateToBrazilian - entrada:", dateStr);
  if (!dateStr) {
    console.log("formatDateToBrazilian - string vazia ou inválida, retornando vazio");
    return "";
  }
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = date.getFullYear();
  const result = `${day}/${month}/${year}`;
  console.log("formatDateToBrazilian - resultado:", result);
  return result;
};

// Function to format date with text
const formatDateWithText = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  // Return formatted date with text
  return `${day}/${month}/${year}`;
};

const createDefaultContractor = (): Contractor => ({
  id: generateId(),
  name: "",
  cnpj: "",
  email: "",
  address: "",
  city: "",
  state: "",
  responsibleName: "",
  responsibleCpf: "",
  responsibleRg: "",
});

const createDefaultCompanyData = (): CompanyData => ({
  name: "",
  cnpj: "",
  address: "",
  city: "",
  state: "",
  responsibleName: "",
  phone: "",
  email: "",
  logo: "",
  website: "",
});

interface ContractContextType {
  contractData: ContractData;
  updateContractData: (data: Partial<ContractData>) => void;
  addContractor: () => void;
  updateContractor: (id: string, data: Partial<Contractor>) => void;
  removeContractor: (id: string) => void;
  activeClauseId: string | null;
  setActiveClauseId: (id: string | null) => void;
  formatDateToBrazilian: (dateStr: string) => string;
  formatDateWithText: (dateStr: string) => string;
  loadContractData: (contract: any) => void;
  updateCompanyData: (data: Partial<CompanyData>) => void;
  loadCompanyData: () => Promise<void>;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

interface ContractProviderProps {
  children: ReactNode;
  editingContract?: any;
}

export const ContractProvider: React.FC<ContractProviderProps> = ({ 
  children, 
  editingContract 
}) => {
  const { fetchCompanyData } = useContracts();
  const [contractData, setContractData] = useState<ContractData>({
    contractNumber: "",
    employeeCount: "",
    cnpjCount: "",
    trialDays: "",
    startDate: "",
    monthlyValue: "",
    renewalDate: "",
    paymentStartDate: "",
    paymentDay: "",
    planType: "mensal",
    semestralDiscount: "0",
    anualDiscount: "0",
    contractors: [createDefaultContractor()],
    companyData: createDefaultCompanyData(),
    planChangeSignatures: [],
  });
  const [activeClauseId, setActiveClauseId] = useState<string | null>(null);

  const updateContractData = (data: Partial<ContractData>) => {
    console.log("CONTEXT: Atualizando dados do contrato:", data);
    setContractData((prevData) => {
      const newData = { ...prevData, ...data };
      console.log("CONTEXT: Dados atualizados:", newData);
      return newData;
    });
  };

  const addContractor = () => {
    const newContractor = {
      id: `contractor-${Date.now()}`,
      name: "",
      cnpj: "",
      email: "",
      city: "",
      state: "",
      address: "",
      responsibleName: "",
      responsibleCpf: "",
      responsibleRg: ""
    };

    setContractData(prev => ({
      ...prev,
      contractors: [...prev.contractors, newContractor]
    }));
  };

  const updateContractor = (id: string, data: Partial<Contractor>) => {
    setContractData((prevData) => ({
      ...prevData,
      contractors: prevData.contractors.map((contractor) =>
        contractor.id === id ? { ...contractor, ...data } : contractor
      ),
    }));
  };

  const removeContractor = (id: string) => {
    setContractData((prevData) => ({
      ...prevData,
      contractors: prevData.contractors.filter((contractor) => contractor.id !== id),
    }));
  };

  const updateCompanyData = (data: Partial<CompanyData>) => {
    console.log("Atualizando dados da empresa no contexto:", data);
    setContractData((prevData) => {
      const newData = {
        ...prevData,
        companyData: { ...prevData.companyData, ...data },
      };
      console.log("Novos dados da empresa no contexto:", newData.companyData);
      return newData;
    });
  };

  const loadCompanyData = async () => {
    try {
      console.log("Carregando dados da empresa...");
      const companyData = await fetchCompanyData();
      if (companyData) {
        console.log("Dados da empresa carregados:", companyData);
        updateCompanyData(companyData);
      } else {
        console.log("Nenhum dado da empresa encontrado, usando dados padrão");
      }
    } catch (error) {
      console.error("Erro ao carregar dados da empresa:", error);
    }
  };

  const loadContractData = (contract: any) => {
    console.log("CONTEXT: ===== INICIANDO LOADCONTRACTDATA =====");
    console.log("CONTEXT: Carregando dados do contrato:", contract);
    console.log("CONTEXT: Tipo do objeto contract:", typeof contract);
    console.log("CONTEXT: Keys do contract:", Object.keys(contract || {}));
    
    // Log de todos os campos importantes
    console.log("CONTEXT: contract.monthly_value:", contract.monthly_value);
    console.log("CONTEXT: contract.start_date:", contract.start_date);
    console.log("CONTEXT: contract.renewal_date:", contract.renewal_date);
    console.log("CONTEXT: contract.payment_start_date:", contract.payment_start_date);
    console.log("CONTEXT: contract.employee_count:", contract.employee_count);
    console.log("CONTEXT: contract.plan_type:", contract.plan_type);
    
    // Garantir que todos os campos sejam carregados corretamente do banco de dados
    const contractorsData = contract.contractors && contract.contractors.length > 0 
      ? contract.contractors.map((contractor: any) => ({
          id: contractor.id || generateId(),
          name: contractor.name || "",
          cnpj: contractor.cnpj || "",
          email: contractor.email || "",
          address: contractor.address || "",
          city: contractor.city || "",
          state: contractor.state || "",
          responsibleName: contractor.responsible_name || "",
          responsibleCpf: contractor.responsible_cpf || "",
          responsibleRg: contractor.responsible_rg || "",
        }))
      : [createDefaultContractor()];

    const companyData = {
      name: contract.companyData?.name || "",
      cnpj: contract.companyData?.cnpj || "",
      address: contract.companyData?.address || "",
      city: contract.companyData?.city || "",
      state: contract.companyData?.state || "",
      responsibleName: contract.companyData?.responsibleName || "",
      phone: contract.companyData?.phone || "",
      email: contract.companyData?.email || "",
      logo: contract.companyData?.logo || "",
      website: contract.companyData?.website || "",
    };

    // Convert monthly value from database to display format based on plan type
    const getDisplayValueFromDatabase = (monthlyValue: string, planType: string) => {
      if (!monthlyValue || monthlyValue === "0") return "";
      
      const value = parseMonetaryValue(monthlyValue);
      
      console.log(`[LOAD] Valor do banco: "${monthlyValue}"`);
      console.log(`[LOAD] Valor parseado: ${value}`);
      console.log(`[LOAD] Tipo de plano: ${planType}`);
      
      // Retornar o valor exato que está salvo no banco para todos os tipos de plano
      const displayValue = value.toFixed(2).replace('.', ',');
      console.log(`[LOAD] Valor para exibição: ${displayValue}`);
      return displayValue;
    };

    const planType = contract.plan_type || "mensal";
    const displayValue = getDisplayValueFromDatabase(contract.monthly_value || "", planType);

    const newContractData = {
      contractNumber: contract.contract_number || "",
      employeeCount: contract.employee_count || "",
      cnpjCount: contract.cnpj_count || "",
      trialDays: contract.trial_days || "",
      startDate: contract.start_date || "",
      monthlyValue: displayValue,
      renewalDate: contract.renewal_date || "",
      paymentStartDate: contract.payment_start_date || "",
      paymentDay: contract.payment_day || "",
      planType: planType,
      semestralDiscount: contract.semestral_discount || "0",
      anualDiscount: contract.anual_discount || "0",
      contractors: contractorsData,
      companyData,
      planChangeSignatures: contract.planChangeSignatures || [],
    };

    console.log("CONTEXT: ===== DADOS MAPEADOS =====");
    console.log("CONTEXT: newContractData completo:", newContractData);
    console.log("CONTEXT: 💰 VALOR MENSAL mapeado:", newContractData.monthlyValue);
    console.log("CONTEXT: 📅 DATAS mapeadas:", {
      startDate: newContractData.startDate,
      renewalDate: newContractData.renewalDate,
      paymentStartDate: newContractData.paymentStartDate
    });
    console.log("CONTEXT: 👥 CONTRATANTES mapeados:", newContractData.contractors);
    
    console.log("CONTEXT: ===== DEFININDO ESTADO =====");
    setContractData(newContractData);
    console.log("CONTEXT: ===== LOADCONTRACTDATA FINALIZADO =====");
  };

  // Load company data when component mounts
  useEffect(() => {
    loadCompanyData();
  }, []);

  // Load contract data if editing
  useEffect(() => {
    if (editingContract) {
      console.log("CONTEXT: 📝 Carregando contrato para edição via useEffect:", editingContract);
      loadContractData(editingContract);
    }
  }, [editingContract]);

  const value: ContractContextType = {
    contractData,
    updateContractData,
    addContractor,
    updateContractor,
    removeContractor,
    activeClauseId,
    setActiveClauseId,
    formatDateToBrazilian,
    formatDateWithText,
    loadContractData,
    updateCompanyData,
    loadCompanyData,
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = (): ContractContextType => {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error("useContract must be used within a ContractProvider");
  }
  return context;
};

export type { Contractor, CompanyData };
