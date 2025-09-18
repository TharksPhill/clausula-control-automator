import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useDigitalSignature = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callDigitalSignatureFunction = async (action: string, data: any) => {
    console.log('🔏 [HOOK] Iniciando chamada para Digital Signature function:', { action });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado - faça login novamente');
      }

      console.log('📡 [HOOK] Chamando edge function digital-signature...');

      const response = await supabase.functions.invoke('digital-signature', {
        body: { action, data },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('📥 [HOOK] Response da edge function:', response);

      if (response.error) {
        console.error('❌ [HOOK] Erro na Edge Function:', response.error);
        throw new Error(response.error.message || 'Erro na assinatura digital');
      }

      return response.data;
      
    } catch (error: any) {
      console.error('💥 [HOOK] Erro na chamada:', error);
      throw error;
    }
  };

  const validateCertificate = async (certificateFile: File, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 [HOOK] Validando certificado...');

      // Converter arquivo para base64
      const certificateBase64 = await fileToBase64(certificateFile);

      const result = await callDigitalSignatureFunction('validate_certificate', {
        certificateBase64,
        password
      });

      console.log('✅ [HOOK] Certificado validado:', result);

      if (result?.success) {
        toast({
          title: "Certificado Válido!",
          description: `Certificado ICP-Brasil validado com sucesso.`,
        });
        return result.certificate;
      } else {
        const errorMessage = result?.error || 'Certificado inválido';
        toast({
          title: "Certificado Inválido",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(errorMessage);
      }

    } catch (error: any) {
      console.error('❌ [HOOK] Erro na validação:', error);
      let errorMessage = 'Erro ao validar certificado';
      
      if (error.message?.includes('senha')) {
        errorMessage = 'Senha do certificado incorreta';
      } else if (error.message?.includes('certificado')) {
        errorMessage = 'Certificado inválido ou corrompido';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: "Erro na Validação",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signPdf = async (
    pdfBase64: string, 
    certificateFile: File, 
    password: string, 
    contractData: any
  ) => {
    try {
      setLoading(true);
      setError(null);
      console.log('📝 [HOOK] Assinando PDF digitalmente...');

      // Converter certificado para base64
      const certificateBase64 = await fileToBase64(certificateFile);

      const result = await callDigitalSignatureFunction('sign_pdf', {
        pdfBase64,
        certificateBase64,
        password,
        contractData
      });

      console.log('✅ [HOOK] PDF assinado:', result);

      if (result?.success) {
        toast({
          title: "PDF Assinado!",
          description: "Documento assinado digitalmente com sucesso.",
        });
        
        return {
          signedPdfBase64: result.signedPdfBase64,
          signature: result.signature
        };
      } else {
        const errorMessage = result?.error || 'Erro ao assinar PDF';
        toast({
          title: "Erro na Assinatura",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(errorMessage);
      }

    } catch (error: any) {
      console.error('❌ [HOOK] Erro na assinatura:', error);
      let errorMessage = 'Erro ao assinar PDF digitalmente';
      
      if (error.message?.includes('senha')) {
        errorMessage = 'Senha do certificado incorreta';
      } else if (error.message?.includes('certificado')) {
        errorMessage = 'Certificado inválido ou corrompido';
      } else if (error.message?.includes('PDF')) {
        errorMessage = 'Erro no processamento do PDF';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: "Erro na Assinatura",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const downloadSignedPdf = (signedPdfBase64: string, filename: string) => {
    try {
      console.log('📥 [HOOK] Iniciando download do PDF assinado...');
      
      // Converter base64 para blob
      const byteCharacters = atob(signedPdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'contrato-assinado.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ [HOOK] Download iniciado com sucesso');
      
      toast({
        title: "Download Iniciado",
        description: "O PDF assinado está sendo baixado.",
      });
      
    } catch (error: any) {
      console.error('❌ [HOOK] Erro no download:', error);
      
      toast({
        title: "Erro no Download",
        description: "Não foi possível baixar o PDF assinado.",
        variant: "destructive",
      });
    }
  };

  return {
    loading,
    error,
    validateCertificate,
    signPdf,
    downloadSignedPdf
  };
};

// Função auxiliar para converter arquivo para base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remover o prefixo data:application/...;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};