import { useState, useEffect } from "react";
import { useContract } from "@/context/ContractContext";
interface CompanyProfileData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
}
const CompanyHeader = () => {
  const {
    contractData
  } = useContract();
  const {
    companyData,
    contractors
  } = contractData;
  const [profileData, setProfileData] = useState<CompanyProfileData>({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: ""
  });
  useEffect(() => {
    // Carregar dados do perfil da empresa salvos no localStorage
    const savedProfile = localStorage.getItem("companyProfile");
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfileData({
        name: parsedProfile.name || "",
        address: parsedProfile.address || "",
        phone: parsedProfile.phone || "",
        email: parsedProfile.email || "",
        website: parsedProfile.website || "",
        logo: parsedProfile.logo || ""
      });
    }
  }, []);

  // PRIORIZAR dados do contrato (companyData) se disponíveis, senão usar localStorage
  const displayData = {
    name: companyData?.name || profileData.name || "Empresa não informada",
    address: companyData?.address || profileData.address || "Endereço não informado",
    phone: companyData?.phone || profileData.phone || "Telefone não informado",
    email: companyData?.email || profileData.email || "Email não informado",
    website: companyData?.website || profileData.website || "",
    logo: companyData?.logo || profileData.logo || "",
    cnpj: companyData?.cnpj || "CNPJ não informado",
    city: companyData?.city || "Cidade não informada",
    state: companyData?.state || "Estado não informado",
    responsibleName: companyData?.responsibleName || "Responsável não informado"
  };
  console.log("🏢 CompanyHeader - Dados da empresa do contexto:", companyData);
  console.log("🏢 CompanyHeader - Dados do localStorage:", profileData);
  console.log("🏢 CompanyHeader - Dados finais para exibição:", displayData);
  return <div className="preview-company-header border-border mb-4 p-6 shadow-sm rounded-lg bg-card">
      <div className="flex gap-6">
        {/* Logo no canto superior esquerdo - tamanho reduzido */}
        <div className="flex-shrink-0 self-start">
          {displayData.logo ? <div className="rounded-lg overflow-hidden">
              <img src={displayData.logo} alt="Logo da empresa" className="h-20 w-auto max-w-32 object-contain" />
            </div> : <div className="w-32 h-20 bg-muted border border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground text-sm font-medium">
              Logo
            </div>}
        </div>

        {/* Dados da empresa do lado direito - hierarquia melhorada */}
        <div className="text-right flex-1 space-y-1 bg-transparent">
          {/* Nome da empresa - destaque principal */}
          <div className="font-bold text-lg text-foreground leading-tight">
            {displayData.name}
          </div>
          
          {/* CNPJ */}
          {displayData.cnpj && displayData.cnpj !== "CNPJ não informado" && <div className="flex items-center justify-end gap-1">
              <span className="text-muted-foreground text-xs">CNPJ:</span>
              <span className="text-xs">{displayData.cnpj}</span>
            </div>}
          
          {/* Informações de contato - organizadas com melhor hierarquia */}
          <div className="space-y-0.5 text-muted-foreground">
            <div className="flex items-center justify-end gap-1">
              <span className="text-muted-foreground text-xs">Endereço:</span>
              <span className="text-xs">{displayData.address}</span>
            </div>
            
            {/* Cidade e Estado */}
            {(displayData.city !== "Cidade não informada" || displayData.state !== "Estado não informado") && <div className="flex items-center justify-end gap-1">
                <span className="text-muted-foreground text-xs">Cidade/Estado:</span>
                <span className="text-xs">{displayData.city}/{displayData.state}</span>
              </div>}
            
            <div className="flex items-center justify-end gap-1">
              <span className="text-muted-foreground text-xs">Telefone:</span>
              <span className="text-xs">{displayData.phone}</span>
            </div>
            
            {/* Responsável */}
            {displayData.responsibleName && displayData.responsibleName !== "Responsável não informado" && <div className="flex items-center justify-end gap-1">
                <span className="text-muted-foreground text-xs">Responsável:</span>
                <span className="text-xs">{displayData.responsibleName}</span>
              </div>}
            
            {/* Informações digitais com destaque */}
            <div className="pt-1 border-t border-border space-y-0.5">
              {displayData.website && <div className="flex items-center justify-end gap-1">
                  <span className="text-muted-foreground text-xs">Website:</span>
                  <a href={`http://${displayData.website}`} className="text-primary hover:text-primary/80 text-xs transition-colors hover:underline" target="_blank" rel="noopener noreferrer">
                    {displayData.website}
                  </a>
                </div>}
              
              <div className="flex items-center justify-end gap-1">
                <span className="text-muted-foreground text-xs">E-mail:</span>
                <a href={`mailto:${displayData.email}`} className="text-primary hover:text-primary/80 text-xs transition-colors hover:underline">
                  {displayData.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default CompanyHeader;