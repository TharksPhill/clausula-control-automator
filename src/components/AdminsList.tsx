
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EditAdminModal from "./EditAdminModal";
import AdminActions from "./AdminActions";

interface Administrator {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

const AdminsList = () => {
  const { adminUser, listAdministrators, updateAdministrator, deleteAdministrator } = useAdminAuth();
  const { toast } = useToast();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAdmin, setEditingAdmin] = useState<Administrator | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadAdministrators = async () => {
    setLoading(true);
    try {
      const result = await listAdministrators();
      if (result.success && result.data) {
        // Mapear os dados para incluir created_by se não estiver presente
        const mappedData = result.data.map(admin => ({
          ...admin,
          created_by: admin.created_by || ''
        }));
        setAdministrators(mappedData);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao carregar administradores.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar administradores:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar administradores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      loadAdministrators();
    }
  }, [adminUser]);

  const handleEdit = (admin: Administrator) => {
    setEditingAdmin(admin);
    setShowEditModal(true);
  };

  const handleDelete = async (admin: Administrator) => {
    try {
      const result = await deleteAdministrator(admin.id);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        });
        loadAdministrators();
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao deletar administrador:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao deletar administrador.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSuccess = () => {
    loadAdministrators();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!adminUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Carregando administradores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-medium">Lista de Administradores</h3>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {administrators.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <Badge variant={admin.is_active ? "default" : "secondary"}>
                    {admin.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(admin.created_at)}</TableCell>
                <TableCell>
                  <AdminActions
                    admin={admin}
                    currentAdminId={adminUser.id}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
            {administrators.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Nenhum administrador encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EditAdminModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        admin={editingAdmin}
        onUpdate={updateAdministrator}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  );
};

export default AdminsList;
