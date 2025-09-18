
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";

export type PermissionLevel = 'none' | 'read' | 'write';

interface AdminPermission {
  moduleKey: string;
  permissionLevel: PermissionLevel;
}

export const useAdminPermissions = () => {
  const { adminUser } = useAdminAuth();
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminUser) {
      loadPermissions();
    }
  }, [adminUser]);

  const loadPermissions = async () => {
    if (!adminUser) return;

    try {
      // Use a query instead of RPC since the function might not be recognized by TypeScript yet
      const { data, error } = await supabase
        .from('system_modules' as any)
        .select(`
          id,
          name,
          module_key,
          parent_module_id,
          admin_permissions!inner(permission_level)
        `)
        .eq('admin_permissions.admin_id', adminUser.id);

      if (error) throw error;

      const permissionsMap = (data || []).map((item: any) => ({
        moduleKey: item.module_key,
        permissionLevel: item.admin_permissions?.[0]?.permission_level || 'none'
      }));

      setPermissions(permissionsMap);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (moduleKey: string, requiredLevel: PermissionLevel = 'read'): boolean => {
    const permission = permissions.find(p => p.moduleKey === moduleKey);
    
    if (!permission) return false;

    switch (requiredLevel) {
      case 'none':
        return true;
      case 'read':
        return permission.permissionLevel === 'read' || permission.permissionLevel === 'write';
      case 'write':
        return permission.permissionLevel === 'write';
      default:
        return false;
    }
  };

  const canRead = (moduleKey: string): boolean => hasPermission(moduleKey, 'read');
  const canWrite = (moduleKey: string): boolean => hasPermission(moduleKey, 'write');

  return {
    permissions,
    loading,
    hasPermission,
    canRead,
    canWrite,
    loadPermissions
  };
};
