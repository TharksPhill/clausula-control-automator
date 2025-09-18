
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Shield, LogOut, User, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminsList from "@/components/AdminsList";
import CreateAdminForm from "@/components/CreateAdminForm";
import CurrentAdminProfile from "@/components/CurrentAdminProfile";
import AdminPermissionsManager from "@/components/AdminPermissionsManager";

const AdminManagement = () => {
  const { adminUser, loading } = useAdminAuth();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  // Debug para ver o estado atual
  useEffect(() => {
    console.log("AdminManagement - Estado atual:", { adminUser, loading, currentUser: user });
  }, [adminUser, loading, user]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error("Erro no logout:", error);
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Verificando permissões de administrador...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Gerenciamento de Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Login Necessário
              </h3>
              <p className="text-gray-600 mb-4">
                Faça login para acessar o painel de administração.
              </p>
              <Button onClick={() => window.location.href = '/auth'}>
                <Shield className="w-4 h-4 mr-2" />
                Fazer Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Gerenciamento de Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Configurando Acesso
              </h3>
              <p className="text-gray-600 mb-4">
                Verificando se {user.email} tem permissões de administrador...
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-4">
                Se você deveria ter acesso como administrador, entre em contato com o suporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Painel de Administração
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-600 font-medium">
                Logado como: {adminUser.name} ({adminUser.email})
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sair
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Meu Perfil
              </TabsTrigger>
              <TabsTrigger value="admins" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Administradores
              </TabsTrigger>
              <TabsTrigger value="add-admin" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Adicionar Admin
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Privilégios
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="mt-6">
              <CurrentAdminProfile />
            </TabsContent>
            
            <TabsContent value="admins" className="mt-6">
              <AdminsList />
            </TabsContent>
            
            <TabsContent value="add-admin" className="mt-6">
              <CreateAdminForm onSuccess={() => {
                toast({
                  title: "Sucesso",
                  description: "Administrador criado com sucesso! Ele pode fazer login usando /auth com o email e senha fornecidos.",
                });
              }} />
            </TabsContent>

            <TabsContent value="permissions" className="mt-6">
              <AdminPermissionsManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManagement;
