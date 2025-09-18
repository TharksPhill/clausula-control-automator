
import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Erro ao obter sessão inicial:", error);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão inicial:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log("Fazendo logout...");
      
      // Primeiro, limpar o estado local
      setSession(null);
      setUser(null);
      
      // Tentar fazer logout no Supabase
      const { error } = await supabase.auth.signOut();
      
      // Se o erro for de sessão ausente, não é um problema real
      if (error && error.message?.includes("Auth session missing")) {
        console.log("Sessão já estava ausente, logout local realizado");
        return; // Não lançar erro, pois o logout local já foi feito
      }
      
      if (error) {
        console.error("Erro no logout:", error);
        throw error;
      }
      
      console.log("Logout realizado com sucesso");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      
      // Se for erro de sessão ausente, não relançar o erro
      if (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string' && 
          error.message.includes("Auth session missing")) {
        console.log("Logout local realizado mesmo com sessão ausente");
        return; // Não relançar erro
      }
      
      throw error;
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
  };
};
