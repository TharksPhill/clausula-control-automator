import React, { useState } from "react";
import { useContract } from "@/context/ContractContext";
import { Contractor } from "@/context/ContractContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Users, Search, FileText, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormPreviewSync } from "@/hooks/useFormPreviewSync";
import { classifySegmentByCNAE } from "@/utils/cnaeClassification";
import { supabase } from "@/integrations/supabase/client";
const ContractorList = () => {
  const {
    contractData,
    addContractor,
    updateContractor,
    removeContractor
  } = useContract();
  const {
    toast
  } = useToast();
  const { createFieldHandler } = useFormPreviewSync();
  const [loadingCnpj, setLoadingCnpj] = useState<string | null>(null);
  const handleContractorChange = (id: string, field: string, value: string) => {
    updateContractor(id, {
      [field]: value
    });
    if (field === "cnpj") {
      const formattedCnpj = value.replace(/[^\d]/g, '');
      console.log("CNPJ formatado para busca:", formattedCnpj);
      if (formattedCnpj.length === 14) {
        lookupCnpj(id, formattedCnpj);
      }
    }
  };
  const lookupCnpj = async (id: string, cnpj: string) => {
    const formattedCnpj = cnpj.replace(/[^\d]/g, '');
    if (formattedCnpj.length !== 14) {
      console.log("CNPJ inválido ou incompleto:", formattedCnpj);
      return;
    }
    setLoadingCnpj(id);
    try {
      console.log("Buscando CNPJ na BrasilAPI:", formattedCnpj);
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${formattedCnpj}`);
      
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Dados retornados da API:", data);
      console.log("data.cnpj existe?", !!data.cnpj);
      
      if (data && data.cnpj) {
        // Extrair CNAE e classificar segmento - converter para string se for número
        const cnaePrincipal = data.cnae_fiscal ? String(data.cnae_fiscal) : '';
        const cnaeDescricao = data.cnae_fiscal_descricao || '';
        const segmento = classifySegmentByCNAE(cnaePrincipal);
        
        console.log("Preparando dados da empresa para atualizar...");
        
        // Dados compatíveis com o tipo Contractor
        const companyData: Partial<Contractor> = {
          name: data.razao_social || data.nome_fantasia || '',
          cnpj: formatCnpj(data.cnpj),
          address: `${data.logradouro || ''}, ${data.numero || ''} ${data.complemento || ''}`.trim().replace(/^,\s*/, ''),
          city: data.municipio || '',
          state: data.uf || ''
        };
        
        console.log("Dados da empresa preparados:", companyData);
        
        // Preservar dados existentes do contratante
        const currentContractor = contractData.contractors.find(c => c.id === id);
        
        // Preservar o email existente se não houver email na API
        if (currentContractor?.email && !data.email) {
          companyData.email = currentContractor.email;
        } else if (data.email) {
          companyData.email = data.email;
        }
        
        // Preservar dados do responsável
        if (currentContractor?.responsibleName) {
          companyData.responsibleName = currentContractor.responsibleName;
        }
        if (currentContractor?.responsibleCpf) {
          companyData.responsibleCpf = currentContractor.responsibleCpf;
        }
        if (currentContractor?.responsibleRg) {
          companyData.responsibleRg = currentContractor.responsibleRg;
        }
        
        console.log("Atualizando contratante no contexto...");
        // Atualizar no contexto
        updateContractor(id, companyData);
        
        // Atualizar no banco de dados incluindo CNAE e segmento
        try {
          console.log("Salvando dados no banco de dados...");
          const { error } = await supabase
            .from('contractors')
            .update({
              name: companyData.name,
              cnpj: companyData.cnpj,
              address: companyData.address,
              city: companyData.city,
              state: companyData.state,
              cnae_principal: cnaePrincipal,
              cnae_descricao: cnaeDescricao,
              segmento: segmento,
              cnaes_secundarios: data.cnaes_secundarios || []
            })
            .eq('id', id);
            
          if (error) {
            console.error("Erro ao salvar dados no banco:", error);
          } else {
            console.log("Dados da empresa salvos com sucesso no banco!");
          }
        } catch (dbError) {
          console.error("Erro ao atualizar banco de dados:", dbError);
        }
        
        console.log("Mostrando toast de sucesso...");
        toast({
          title: "Dados encontrados",
          description: `Os dados da empresa ${companyData.name} foram preenchidos automaticamente.`
        });
        
        console.log("Busca de CNPJ concluída com sucesso!");
        return; // Importante: retornar aqui para não cair no catch
      } else {
        console.log("Dados não encontrados na resposta da API");
        throw new Error("Dados não encontrados na resposta da API");
      }
    } catch (error) {
      console.error("Erro ao buscar CNPJ - detalhes completos:", error);
      console.error("Tipo do erro:", typeof error);
      console.error("Mensagem do erro:", error instanceof Error ? error.message : String(error));
      
      toast({
        title: "CNPJ não encontrado",
        description: "Não foi possível encontrar dados para este CNPJ. Verifique se o número está correto.",
        variant: "destructive"
      });
    } finally {
      console.log("Finalizando busca de CNPJ...");
      setLoadingCnpj(null);
    }
  };
  const formatCnpj = (cnpj: string) => {
    const cleaned = cnpj.replace(/[^\d]/g, '');
    if (cleaned.length !== 14) return cnpj;
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };
  const handleSearchCnpj = (id: string, cnpj: string) => {
    console.log("Pesquisando CNPJ manualmente:", cnpj);
    lookupCnpj(id, cnpj);
  };
  return <>
      <div className="flex justify-end items-center mb-4">
        <Button onClick={addContractor} className="flex items-center gap-2" type="button">
          <PlusCircle className="h-4 w-4" /> 
          Adicionar Contratante
        </Button>
      </div>
      
      {contractData.contractors.map((contractor, index) => <Card key={contractor.id} className="mb-6 border border-border bg-transparent">
          <CardHeader className="py-3 bg-muted">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-contract" />
                <CardTitle className="text-lg">
                  Contratante {index + 1}
                  {contractor.name && `: ${contractor.name}`}
                </CardTitle>
              </div>
              {contractData.contractors.length > 1 && <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeContractor(contractor.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>}
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      format="cnpj" 
                      value={contractor.cnpj} 
                      onChange={e => handleContractorChange(contractor.id, "cnpj", e.target.value)} 
                      onFocus={createFieldHandler("contractor-cnpj")}
                      placeholder="00.000.000/0000-00" 
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => handleSearchCnpj(contractor.id, contractor.cnpj)} disabled={loadingCnpj === contractor.id}>
                      {loadingCnpj === contractor.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Digite um CNPJ válido para buscar automaticamente os dados da empresa
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input 
                    value={contractor.name} 
                    onChange={e => handleContractorChange(contractor.id, "name", e.target.value)} 
                    onFocus={createFieldHandler("contractor-name")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email da Empresa
                  </Label>
                  <Input 
                    type="email" 
                    value={contractor.email || ""} 
                    onChange={e => handleContractorChange(contractor.id, "email", e.target.value)} 
                    onFocus={createFieldHandler("contractor-email")}
                    placeholder="contato@empresa.com" 
                  />
                  <p className="text-xs text-muted-foreground">
                    Email necessário para envio de documentos para assinatura digital
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input 
                    value={contractor.address} 
                    onChange={e => handleContractorChange(contractor.id, "address", e.target.value)} 
                    onFocus={createFieldHandler("contractor-address")}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input 
                    value={contractor.city} 
                    onChange={e => handleContractorChange(contractor.id, "city", e.target.value)} 
                    onFocus={createFieldHandler("contractor-city")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input 
                    value={contractor.state} 
                    onChange={e => handleContractorChange(contractor.id, "state", e.target.value)} 
                    onFocus={createFieldHandler("contractor-state")}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>)}

      {contractData.contractors.length > 1 && <div className="flex items-center p-4 bg-blue-50 border border-blue-100 rounded-md">
          <div className="mr-3 text-blue-500">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-700">Múltiplos Contratantes</h4>
            <p className="text-xs text-blue-600">
              Você adicionou {contractData.contractors.length} contratantes. 
              Cada um terá seu próprio espaço para assinatura no contrato final.
            </p>
          </div>
        </div>}
    </>;
};
export default ContractorList;