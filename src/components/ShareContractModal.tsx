import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Send, Loader2, Shield, CheckCircle, PenTool, Users, UserCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AdminContractSignature from "./AdminContractSignature";

interface ShareContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
}

const ShareContractModal = ({ isOpen, onClose, contract }: ShareContractModalProps) => {
  const [loading, setLoading] = useState(false);
  const [shareLinks, setShareLinks] = useState<{ [key: string]: string }>({});
  const [combinedLink, setCombinedLink] = useState<string>("");
  const [linkType, setLinkType] = useState<"individual" | "combined">("individual");
  const [adminSigned, setAdminSigned] = useState(false);
  const [showAdminSignature, setShowAdminSignature] = useState(false);
  const [checkingSignature, setCheckingSignature] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && contract?.id) {
      checkAdminSignature();
    }
  }, [isOpen, contract?.id]);

  const checkAdminSignature = async () => {
    try {
      setCheckingSignature(true);
      console.log("🔍 Verificando assinatura do administrador para contrato:", contract.id);

      // CORRIGIDO: Usar query mais robusta para verificar assinatura da empresa
      const { data: adminSignatures, error: adminError } = await supabase
        .from("admin_contract_signatures")
        .select("*")
        .eq("contract_id", contract.id);

      console.log("📊 Resultado da query admin_contract_signatures:", {
        data: adminSignatures,
        error: adminError,
        contractId: contract.id
      });

      if (adminError) {
        console.error("❌ Erro ao verificar assinatura do administrador:", adminError);
        // Em caso de erro, assumir que não está assinado para não bloquear
        setAdminSigned(false);
        return;
      }

      const hasAdminSignature = adminSignatures && adminSignatures.length > 0;
      setAdminSigned(hasAdminSignature);
      
      console.log("✅ Status FINAL da assinatura do administrador:", {
        hasSignature: hasAdminSignature,
        signaturesCount: adminSignatures?.length || 0,
        signatures: adminSignatures
      });

    } catch (error) {
      console.error("❌ Erro na verificação da assinatura:", error);
      // Em caso de erro, assumir que não está assinado
      setAdminSigned(false);
    } finally {
      setCheckingSignature(false);
    }
  };

  const handleAdminSignatureComplete = () => {
    setAdminSigned(true);
    setShowAdminSignature(false);
    toast({
      title: "Sucesso!",
      description: "Contrato assinado pelo administrador. Agora você pode compartilhar com os clientes.",
    });
  };

  const generateCombinedLink = async () => {
    if (!adminSigned) {
      toast({
        title: "Assinatura necessária",
        description: "Você precisa assinar o contrato antes de compartilhá-lo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Usar o primeiro contratante para gerar o token, mas o link mostrará todos
      const firstContractor = contract.contractors[0];
      
      console.log("🔗 Gerando link combinado para:", { 
        contractId: contract.id, 
        contractorId: firstContractor.id,
        contractNumber: contract.contract_number 
      });
      
      const { data, error } = await supabase.rpc('generate_contract_access_token', {
        p_contract_id: contract.id,
        p_contractor_id: firstContractor.id,
        p_expires_in_hours: 72
      });

      console.log("🔗 Resultado da geração do token combinado:", { data, error });

      if (error) {
        console.error("❌ Erro ao gerar token:", error);
        throw error;
      }

      if (!data) {
        console.error("❌ Token não foi retornado pela função");
        throw new Error("Token não foi gerado");
      }

      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/contract/${data}`;
      
      console.log("✅ Link combinado gerado:", shareUrl);
      
      setCombinedLink(shareUrl);

      toast({
        title: "Link gerado!",
        description: "Link único para todos os contratantes criado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro ao gerar link combinado:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar link de compartilhamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateIndividualLink = async (contractorId: string) => {
    if (!adminSigned) {
      toast({
        title: "Assinatura necessária",
        description: "Você precisa assinar o contrato antes de compartilhá-lo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      console.log("🔗 Gerando link individual para:", { 
        contractId: contract.id, 
        contractorId, 
        contractNumber: contract.contract_number 
      });
      
      const { data, error } = await supabase.rpc('generate_contract_access_token', {
        p_contract_id: contract.id,
        p_contractor_id: contractorId,
        p_expires_in_hours: 72
      });

      console.log("🔗 Resultado da geração do token individual:", { data, error });

      if (error) {
        console.error("❌ Erro ao gerar token:", error);
        throw error;
      }

      if (!data) {
        console.error("❌ Token não foi retornado pela função");
        throw new Error("Token não foi gerado");
      }

      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/contract/${data}`;
      
      console.log("✅ Link individual gerado:", shareUrl);
      
      setShareLinks(prev => ({
        ...prev,
        [contractorId]: shareUrl
      }));

      toast({
        title: "Link gerado!",
        description: "Link de compartilhamento criado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro ao gerar link individual:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar link de compartilhamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copiado!",
        description: "Link copiado para a área de transferência",
      });
    } catch (error) {
      console.error("Erro ao copiar:", error);
    }
  };

  if (showAdminSignature) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AdminContractSignature
            contractData={contract}
            onSignatureComplete={handleAdminSignatureComplete}
            onCancel={() => setShowAdminSignature(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compartilhar Contrato #{contract?.contract_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Admin Signature Status - MELHORADO */}
          <div className={`p-4 rounded-lg border-2 ${
            adminSigned 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {adminSigned ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <PenTool className="h-6 w-6 text-yellow-600" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {adminSigned ? "✅ Empresa Já Assinou" : "⚠️ Assinatura da Empresa Necessária"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {adminSigned 
                      ? "A empresa já assinou este contrato. Você pode compartilhá-lo com os contratantes."
                      : "A empresa precisa assinar o contrato antes de compartilhá-lo com os contratantes."
                    }
                  </p>
                  {checkingSignature && (
                    <p className="text-xs text-blue-600 mt-1">🔍 Verificando status da assinatura...</p>
                  )}
                </div>
              </div>
              {!adminSigned && !checkingSignature && (
                <Button
                  onClick={() => setShowAdminSignature(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Assinar como Empresa
                </Button>
              )}
            </div>
          </div>

          {/* Link Type Selection */}
          {adminSigned && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Tipo de Compartilhamento</h3>
                <RadioGroup value={linkType} onValueChange={(value: "individual" | "combined") => setLinkType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="individual" />
                    <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                      <UserCheck className="h-4 w-4" />
                      Links separados para cada contratante
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="combined" id="combined" />
                    <Label htmlFor="combined" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Link único para todos os contratantes
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {linkType === "combined" && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-medium">Link Único para Todos os Contratantes</h4>
                    <p className="text-sm text-gray-600">
                      {contract?.contractors?.length || 0} contratante(s) poderão acessar e assinar com este link
                    </p>
                  </div>

                  {combinedLink ? (
                    <div className="space-y-2">
                      <Label>Link de acesso:</Label>
                      <div className="flex gap-2">
                        <Input
                          value={combinedLink}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          onClick={() => copyToClipboard(combinedLink)}
                          variant="outline"
                          size="icon"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={generateCombinedLink}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gerando link...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Gerar link único
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {linkType === "individual" && contract?.contractors?.map((contractor: any) => (
                <div key={contractor.id} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-medium">{contractor.name}</h4>
                    <p className="text-sm text-gray-600">{contractor.cnpj}</p>
                    <p className="text-sm text-gray-600">Responsável: {contractor.responsible_name}</p>
                  </div>

                  {shareLinks[contractor.id] ? (
                    <div className="space-y-2">
                      <Label>Link de acesso:</Label>
                      <div className="flex gap-2">
                        <Input
                          value={shareLinks[contractor.id]}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          onClick={() => copyToClipboard(shareLinks[contractor.id])}
                          variant="outline"
                          size="icon"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => generateIndividualLink(contractor.id)}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gerando link...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Gerar link de acesso
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareContractModal;
