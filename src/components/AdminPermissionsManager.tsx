
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Settings, Save, Eye, Edit, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SystemModule {
  module_id: string;
  module_name: string;
  module_key: string;
  parent_module_id: string | null;
  permission_level: 'none' | 'read' | 'write';
}

interface Administrator {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

const AdminPermissionsManager = () => {
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (adminUser) {
      loadAdministrators();
    }
  }, [adminUser]);

  useEffect(() => {
    if (selectedAdmin) {
      loadAdminPermissions(selectedAdmin);
    }
  }, [selectedAdmin]);

  const loadAdministrators = async () => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAdministrators(data || []);
    } catch (error) {
      console.error('Erro ao carregar administradores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar administradores.",
        variant: "destructive",
      });
    }
  };

  const loadAdminPermissions = async (adminId: string) => {
    setLoading(true);
    try {
      // Use the database function to get modules with permissions
      const { data, error } = await supabase.rpc('get_admin_modules_permissions', {
        p_admin_id: adminId
      });

      if (error) {
        console.error('Erro ao buscar permissões:', error);
        throw error;
      }

      console.log('Dados das permissões:', data);

      // Transform the data to match our interface
      const modulesWithPermissions = (data || []).map((item: any) => ({
        module_id: item.module_id,
        module_name: item.module_name,
        module_key: item.module_key,
        parent_module_id: item.parent_module_id,
        permission_level: item.permission_level || 'none'
      }));

      setModules(modulesWithPermissions);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar permissões do administrador.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (moduleId: string, permissionLevel: 'none' | 'read' | 'write') => {
    if (!selectedAdmin) return;

    try {
      // Delete existing permission if setting to 'none'
      if (permissionLevel === 'none') {
        const { error } = await supabase
          .from('admin_permissions')
          .delete()
          .eq('admin_id', selectedAdmin)
          .eq('module_id', moduleId);

        if (error) throw error;
      } else {
        // Upsert permission
        const { error } = await supabase
          .from('admin_permissions')
          .upsert({
            admin_id: selectedAdmin,
            module_id: moduleId,
            permission_level: permissionLevel,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'admin_id,module_id'
          });

        if (error) throw error;
      }

      // Update local state
      setModules(prev => prev.map(module => 
        module.module_id === moduleId 
          ? { ...module, permission_level: permissionLevel }
          : module
      ));

      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissão.",
        variant: "destructive",
      });
    }
  };

  const saveAllPermissions = async () => {
    if (!selectedAdmin) return;

    setSaving(true);
    try {
      toast({
        title: "Sucesso",
        description: "Permissões salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar permissões.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPermissionIcon = (level: string) => {
    switch (level) {
      case 'write':
        return <Edit className="w-4 h-4 text-green-600" />;
      case 'read':
        return <Eye className="w-4 h-4 text-blue-600" />;
      default:
        return <Ban className="w-4 h-4 text-red-600" />;
    }
  };

  const getPermissionBadge = (level: string) => {
    switch (level) {
      case 'write':
        return <Badge className="bg-green-100 text-green-800">Escrita</Badge>;
      case 'read':
        return <Badge className="bg-blue-100 text-blue-800">Leitura</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800">Negado</Badge>;
    }
  };

  const mainModules = modules.filter(m => !m.parent_module_id);
  const subModules = modules.filter(m => m.parent_module_id);

  console.log('Módulos principais:', mainModules);
  console.log('Submódulos:', subModules);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Gerenciamento de Privilégios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Selecionar Administrador
                </label>
                <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um administrador" />
                  </SelectTrigger>
                  <SelectContent>
                    {administrators.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {admin.name} ({admin.email})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedAdmin && (
                <Button 
                  onClick={saveAllPermissions}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar Permissões"}
                </Button>
              )}
            </div>

            {selectedAdmin && (
              <Tabs defaultValue="main" className="w-full">
                <TabsList>
                  <TabsTrigger value="main">Módulos Principais ({mainModules.length})</TabsTrigger>
                  <TabsTrigger value="sub">Submódulos ({subModules.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="main" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Módulos Principais</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8">
                          <p>Carregando permissões...</p>
                        </div>
                      ) : mainModules.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Nenhum módulo principal encontrado.</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Módulo</TableHead>
                              <TableHead>Chave</TableHead>
                              <TableHead>Permissão Atual</TableHead>
                              <TableHead>Alterar Permissão</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mainModules.map((module) => (
                              <TableRow key={module.module_id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {getPermissionIcon(module.permission_level)}
                                    {module.module_name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600">
                                    {module.module_key}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {getPermissionBadge(module.permission_level)}
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={module.permission_level}
                                    onValueChange={(value: 'none' | 'read' | 'write') =>
                                      updatePermission(module.module_id, value)
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Negado</SelectItem>
                                      <SelectItem value="read">Leitura</SelectItem>
                                      <SelectItem value="write">Escrita</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="sub" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Submódulos e Funcionalidades</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8">
                          <p>Carregando permissões...</p>
                        </div>
                      ) : subModules.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Nenhum submódulo encontrado.</p>
                          <p className="text-sm text-gray-400 mt-2">
                            Os submódulos aparecerão aqui quando estiverem configurados no sistema.
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Submódulo</TableHead>
                              <TableHead>Módulo Pai</TableHead>
                              <TableHead>Chave</TableHead>
                              <TableHead>Permissão Atual</TableHead>
                              <TableHead>Alterar Permissão</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subModules.map((subModule) => {
                              const parentModule = mainModules.find(m => m.module_id === subModule.parent_module_id);
                              return (
                                <TableRow key={subModule.module_id}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      {getPermissionIcon(subModule.permission_level)}
                                      {subModule.module_name}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-gray-600">
                                      {parentModule?.module_name || 'N/A'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-gray-600">
                                      {subModule.module_key}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {getPermissionBadge(subModule.permission_level)}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={subModule.permission_level}
                                      onValueChange={(value: 'none' | 'read' | 'write') =>
                                        updatePermission(subModule.module_id, value)
                                      }
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">Negado</SelectItem>
                                        <SelectItem value="read">Leitura</SelectItem>
                                        <SelectItem value="write">Escrita</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPermissionsManager;
