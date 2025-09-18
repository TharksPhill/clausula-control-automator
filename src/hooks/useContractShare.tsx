
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useContractShare = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateShareLink = async (contractId: string, contractorId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('generate_contract_access_token', {
        p_contract_id: contractId,
        p_contractor_id: contractorId,
        p_expires_in_hours: 72
      });

      if (error) throw error;

      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/contract/${data}`;
      
      return shareUrl;
    } catch (error) {
      console.error("Erro ao gerar link:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar link de compartilhamento",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkContractSignatureStatus = async (contractId: string, contractorId: string) => {
    try {
      const { data, error } = await supabase
        .from("signed_contracts")
        .select("id, created_at, is_cancelled")
        .eq("contract_id", contractId)
        .eq("contractor_id", contractorId)
        .eq("is_cancelled", false)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        isSigned: !!data,
        signatureData: data
      };
    } catch (error) {
      console.error("Erro ao verificar status da assinatura:", error);
      return {
        isSigned: false,
        signatureData: null
      };
    }
  };

  const generateShareLinkForSignedContract = async (contractId: string, contractorId: string) => {
    try {
      setLoading(true);
      
      // Verificar se o contrato já foi assinado
      const { isSigned } = await checkContractSignatureStatus(contractId, contractorId);
      
      if (!isSigned) {
        toast({
          title: "Contrato não assinado",
          description: "Este contrato ainda não foi assinado pelo contratante",
          variant: "destructive",
        });
        return null;
      }

      // Gerar link de acesso para contrato já assinado
      const { data, error } = await supabase.rpc('generate_contract_access_token', {
        p_contract_id: contractId,
        p_contractor_id: contractorId,
        p_expires_in_hours: 72
      });

      if (error) throw error;

      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/contract/${data}`;
      
      toast({
        title: "Link gerado com sucesso",
        description: "Link de acesso ao contrato assinado foi criado",
      });
      
      return shareUrl;
    } catch (error) {
      console.error("Erro ao gerar link para contrato assinado:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar link de acesso",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getSignedContracts = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from("signed_contracts")
        .select(`
          *,
          contractor:contractors(*),
          contractor_profile:contractor_profiles(*)
        `)
        .eq("contract_id", contractId)
        .eq("is_cancelled", false);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar contratos assinados:", error);
      return [];
    }
  };

  const cancelSignedContract = async (signedContractId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("signed_contracts")
        .update({
          is_cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason
        })
        .eq("id", signedContractId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Assinatura cancelada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar assinatura",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    loading,
    generateShareLink,
    checkContractSignatureStatus,
    generateShareLinkForSignedContract,
    getSignedContracts,
    cancelSignedContract
  };
};
