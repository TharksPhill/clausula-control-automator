
import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const AdminSetup = () => {
  const { createAdministrator } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [adminData, setAdminData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleCreateAdmin = async () => {
    if (!adminData.name || !adminData.email || !adminData.password || !adminData.confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (adminData.password !== adminData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (adminData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const result = await createAdministrator(
        adminData.name,
        adminData.email,
        adminData.password
      );

      if (result.success) {
        toast({
          title: "Administrador criado",
          description: "Administrador criado com sucesso! Redirecionando...",
        });
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao criar administrador.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao criar administrador:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar administrador.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setAdminData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-600" />
            Configuração Inicial
          </CardTitle>
          <CardDescription>
            Crie sua conta de administrador para começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-name">Nome Completo</Label>
            <Input
              id="admin-name"
              value={adminData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Digite seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={adminData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Digite seu email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Senha</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={adminData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Digite sua senha (mín. 6 caracteres)"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-confirm-password">Confirmar Senha</Label>
            <div className="relative">
              <Input
                id="admin-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={adminData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirme sua senha"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleCreateAdmin} 
            disabled={isCreating}
            className="w-full flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {isCreating ? "Criando..." : "Criar Conta de Administrador"}
          </Button>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => navigate("/")}
              className="text-sm text-gray-600"
            >
              Voltar ao início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
