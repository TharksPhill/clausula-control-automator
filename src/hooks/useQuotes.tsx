
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Quote, QuoteFormData } from "@/types/quotes";
import { useToast } from "@/hooks/use-toast";

export const useQuotes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os orçamentos do usuário
  const { data: quotes, isLoading, error } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Quote[];
    }
  });

  // Criar novo orçamento
  const createQuoteMutation = useMutation({
    mutationFn: async (quoteData: QuoteFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Gerar número único do orçamento
      const quoteNumber = `ORC-${Date.now().toString().slice(-6)}`;
      
      // Calcular data de expiração
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + quoteData.validity_days);

      const { data, error } = await supabase
        .from('quotes')
        .insert({
          ...quoteData,
          user_id: user.id,
          quote_number: quoteNumber,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as Quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: "Sucesso!",
        description: "Orçamento criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar orçamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar orçamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Atualizar orçamento
  const updateQuoteMutation = useMutation({
    mutationFn: async ({ id, ...quoteData }: Partial<Quote> & { id: string }) => {
      const { data, error } = await supabase
        .from('quotes')
        .update(quoteData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: "Sucesso!",
        description: "Orçamento atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar orçamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar orçamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Deletar orçamento
  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: "Sucesso!",
        description: "Orçamento deletado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao deletar orçamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar orçamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Gerar token de acesso
  const generateTokenMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const { data, error } = await supabase
        .rpc('generate_quote_access_token', { p_quote_id: quoteId });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Link de acesso gerado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao gerar token:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar link de acesso. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  return {
    quotes,
    isLoading,
    error,
    createQuote: createQuoteMutation.mutateAsync,
    updateQuote: updateQuoteMutation.mutateAsync,
    deleteQuote: deleteQuoteMutation.mutateAsync,
    generateToken: generateTokenMutation.mutateAsync,
    isCreating: createQuoteMutation.isPending,
    isUpdating: updateQuoteMutation.isPending,
    isDeleting: deleteQuoteMutation.isPending,
    isGeneratingToken: generateTokenMutation.isPending,
  };
};
