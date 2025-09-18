import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

interface Administrator {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    try {
      console.log("🔍 Verificando acesso de administrador...");
      
      if (!user?.email) {
        console.log("❌ Usuário não autenticado");
        setAdminUser(null);
        setLoading(false);
        return;
      }

      console.log("✅ Usuário autenticado:", user.email);
      
      // Verificar se este email existe na tabela de administradores
      const { data: adminData, error: adminError } = await supabase
        .from('administrators')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      if (adminError) {
        console.error("❌ Erro ao buscar administrador:", adminError);
        setLoading(false);
        return;
      }

      if (adminData) {
        console.log("✅ Usuário é administrador:", adminData);
        setAdminUser({
          id: adminData.id,
          name: adminData.name,
          email: adminData.email
        });
      } else {
        // FIX: Remove a criação automática de admin. Se não for admin, o acesso é negado.
        console.log("❌ Acesso de administrador negado. Usuário não está na lista de administradores ativos.");
        setAdminUser(null);
      }
    } catch (error) {
      console.error("❌ Erro ao verificar acesso admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const createAdministrator = async (name: string, email: string, password: string) => {
    try {
      console.log("🔧 Criando novo administrador:", { name, email });
      
      const { data: existingAdmin, error: checkError } = await supabase
        .from('administrators')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error("Erro ao verificar email existente:", checkError);
        return { success: false, error: "Erro ao verificar dados" };
      }

      if (existingAdmin) {
        return { success: false, error: "Já existe um administrador com este email" };
      }

      // Criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
      });

      if (authError) {
        console.error("Erro ao criar usuário no Supabase Auth:", authError);
        return { success: false, error: authError.message };
      }

      // Criar entrada na tabela administrators
      const insertData: any = {
        name,
        email,
        password_hash: "managed_by_supabase"
      };

      if (adminUser?.id) {
        insertData.created_by = adminUser.id;
      }

      const { data, error } = await supabase
        .from('administrators')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar administrador:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Administrador criado com sucesso:", data);
      return { success: true, data };
    } catch (error: any) {
      console.error("Erro inesperado ao criar administrador:", error);
      return { success: false, error: error.message };
    }
  };

  const listAdministrators = async () => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data: data as Administrator[] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateAdministrator = async (
    adminId: string, 
    name?: string, 
    email?: string, 
    password?: string
  ) => {
    try {
      const updateData: any = {};
      
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      
      updateData.updated_at = new Date().toISOString();

      // Se uma nova senha foi fornecida, atualizar no Supabase Auth também
      if (password && email) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          adminId,
          { password: password }
        );

        if (authError) {
          console.error("Erro ao atualizar senha no Supabase Auth:", authError);
          return { success: false, message: authError.message };
        }
      }

      const { error } = await supabase
        .from('administrators')
        .update(updateData)
        .eq('id', adminId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return { success: true, message: "Administrador atualizado com sucesso" };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const deleteAdministrator = async (adminId: string) => {
    try {
      const { data: activeAdmins, error: countError } = await supabase
        .from('administrators')
        .select('id')
        .eq('is_active', true);

      if (countError) {
        throw countError;
      }

      if (activeAdmins && activeAdmins.length <= 1) {
        return { success: false, message: "Não é possível desativar o último administrador" };
      }

      const { error } = await supabase
        .from('administrators')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId);

      if (error) {
        throw error;
      }

      return { success: true, message: "Administrador desativado com sucesso" };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  return {
    adminUser,
    loading: loading || authLoading,
    createAdministrator,
    listAdministrators,
    updateAdministrator,
    deleteAdministrator,
    deactivateAdministrator: deleteAdministrator,
    checkAdminSession: checkAdminAccess
  };
};