
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, User, Save, Upload, Globe } from "lucide-react";

interface CompanyData {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  adminName: string;
  responsibleName: string;
}

const CompanyProfile = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "",
    cnpj: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
    adminName: "",
    responsibleName: ""
  });

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    // Tentar carregar do localStorage primeiro
    const savedData = localStorage.getItem("companyProfile");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setCompanyData({
        name: parsedData.name || "",
        cnpj: parsedData.cnpj || "",
        address: parsedData.address || "",
        phone: parsedData.phone || "",
        email: parsedData.email || "",
        website: parsedData.website || "",
        logo: parsedData.logo || "",
        adminName: parsedData.adminName || "",
        responsibleName: parsedData.responsibleName || ""
      });
    }

    // Também tentar carregar do Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: company } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (company) {
          const supabaseData = {
            name: company.name || "",
            cnpj: company.cnpj || "",
            address: company.address || "",
            phone: company.phone || "",
            email: company.email || "",
            website: company.website || "",
            logo: company.logo || "",
            adminName: company.admin_name || "",
            responsibleName: company.responsible_name || ""
          };
          setCompanyData(supabaseData);
          localStorage.setItem("companyProfile", JSON.stringify(supabaseData));
        }
      }
    } catch (error) {
      console.log("Erro ao carregar dados do Supabase:", error);
    }
  };

  const handleInputChange = (field: keyof CompanyData, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyData(prev => ({
          ...prev,
          logo: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      console.log("💾 Salvando dados da empresa:", companyData);
      
      // Salvar no localStorage
      localStorage.setItem("companyProfile", JSON.stringify(companyData));
      
      // Salvar no Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log("💾 Salvando dados da empresa no Supabase:", companyData);
        
        const { data: existingCompany } = await supabase
          .from("companies")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        const companyDataForSupabase = {
          user_id: user.id,
          name: companyData.name,
          cnpj: companyData.cnpj,
          address: companyData.address,
          phone: companyData.phone,
          email: companyData.email,
          website: companyData.website || null,
          logo: companyData.logo || null,
          admin_name: companyData.adminName,
          responsible_name: companyData.responsibleName
        };

        console.log("💾 Dados para enviar ao Supabase:", companyDataForSupabase);

        if (existingCompany) {
          const { error } = await supabase
            .from("companies")
            .update(companyDataForSupabase)
            .eq("id", existingCompany.id);

          if (error) {
            console.error("Erro ao atualizar empresa:", error);
            throw error;
          }
          console.log("✅ Empresa atualizada no Supabase");
        } else {
          const { error } = await supabase
            .from("companies")
            .insert(companyDataForSupabase);

          if (error) {
            console.error("Erro ao criar empresa:", error);
            throw error;
          }
          console.log("✅ Nova empresa criada no Supabase");
        }
      }
      
      toast({
        title: "Perfil atualizado",
        description: "As informações da empresa foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as informações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações da Empresa */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-lg border border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Informações da Empresa</h3>
        </div>
        
        <div className="space-y-4">
          {/* Logo da Empresa */}
          <div className="space-y-3">
            <Label htmlFor="logo">Logo da Empresa</Label>
            <div className="flex items-center gap-4">
              {companyData.logo && (
                <div className="w-20 h-20 bg-muted border border-border rounded-lg p-2 flex items-center justify-center">
                  <img 
                    src={companyData.logo} 
                    alt="Logo da empresa" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="logo" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {companyData.logo ? "Alterar Logo" : "Carregar Logo"}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <p className="text-xs text-muted-foreground mt-1">Formatos: JPG, PNG, SVG</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <Input
                id="companyName"
                value={companyData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Razão social da empresa"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={companyData.cnpj}
                onChange={(e) => handleInputChange("cnpj", e.target.value)}
                placeholder="00.000.000/0001-00"
              />
              <p className="text-xs text-primary">
                CNPJ que aparecerá nos contratos gerados
              </p>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço Completo *</Label>
              <Textarea
                id="address"
                value={companyData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Ex: Rua das Flores, 123, Centro, São Paulo, SP, 01234-567"
                className="min-h-[80px]"
              />
              <p className="text-xs text-primary">
                Inclua rua, número, bairro, cidade, estado e CEP. Este endereço será usado como ponto de partida nas calculadoras de visita técnica.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={companyData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={companyData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  id="website"
                  value={companyData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="www.empresa.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibleName">Nome do Responsável Legal *</Label>
              <Input
                id="responsibleName"
                value={companyData.responsibleName}
                onChange={(e) => handleInputChange("responsibleName", e.target.value)}
                placeholder="Nome que aparecerá nos contratos como responsável"
              />
              <p className="text-xs text-primary">
                Este nome aparecerá nos contratos como responsável pela empresa
              </p>
            </div>
          </div>

          <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
            <p className="text-sm text-primary">
              <strong>Campos obrigatórios (*):</strong> Estes dados aparecerão no cabeçalho dos contratos gerados.
            </p>
          </div>
        </div>
      </div>

      {/* Configurações do Administrador */}
      <div className="bg-gradient-to-r from-green-500/5 to-emerald-500/10 p-6 rounded-lg border border-green-500/20">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-foreground">Configurações do Administrador</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminName">Nome do Administrador *</Label>
            <Input
              id="adminName"
              value={companyData.adminName}
              onChange={(e) => handleInputChange("adminName", e.target.value)}
              placeholder="Nome que aparecerá nas boas-vindas do sistema"
            />
            <p className="text-sm text-green-600">
              Este nome aparecerá no cabeçalho do sistema com a saudação baseada no horário do dia.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Salvando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Salvar Configurações
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CompanyProfile;
