
import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface CreateAdminFormProps {
  onSuccess: () => void;
}

const CreateAdminForm = ({ onSuccess }: CreateAdminFormProps) => {
  const { createAdministrator } = useAdminAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [newAdminData, setNewAdminData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleCreateAdmin = async () => {
    if (!newAdminData.name || !newAdminData.email || !newAdminData.password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await createAdministrator(
        newAdminData.name,
        newAdminData.email,
        newAdminData.password
      );

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Administrador criado com sucesso.",
        });
        
        setNewAdminData({ name: "", email: "", password: "" });
        onSuccess();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao criar administrador.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar administrador.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Administrador</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={newAdminData.name}
            onChange={(e) => setNewAdminData({...newAdminData, name: e.target.value})}
            placeholder="Nome completo"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={newAdminData.email}
            onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
            placeholder="email@exemplo.com"
          />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={newAdminData.password}
            onChange={(e) => setNewAdminData({...newAdminData, password: e.target.value})}
            placeholder="Senha de acesso"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button onClick={handleCreateAdmin} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateAdminForm;
