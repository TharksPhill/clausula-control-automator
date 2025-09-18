
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  AlertTriangle,
  UserX
} from 'lucide-react';

interface Administrator {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

interface AdminActionsProps {
  admin: Administrator;
  currentAdminId: string;
  onEdit: (admin: Administrator) => void;
  onDelete: (admin: Administrator) => void;
}

const AdminActions: React.FC<AdminActionsProps> = ({
  admin,
  currentAdminId,
  onEdit,
  onDelete
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteConfirm = () => {
    onDelete(admin);
    setShowDeleteDialog(false);
  };

  const canDelete = admin.id !== currentAdminId && admin.is_active;
  const canEdit = admin.is_active;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white border shadow-lg z-50 min-w-[160px]">
          <DropdownMenuItem 
            onClick={() => onEdit(admin)}
            disabled={!canEdit}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit className="h-4 w-4 text-blue-600" />
            Editar
          </DropdownMenuItem>
          
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2 cursor-pointer hover:bg-red-50 text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Desativar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                  Confirmar Desativação
                </AlertDialogTitle>
              </div>
            </div>
          </AlertDialogHeader>
          
          <AlertDialogDescription className="text-gray-600 leading-relaxed">
            Tem certeza que deseja desativar o administrador <strong>"{admin.name}"</strong>?
            <br /><br />
            <span className="text-red-600 font-medium">
              Esta ação não pode ser desfeita e o administrador não poderá mais acessar o sistema.
            </span>
          </AlertDialogDescription>
          
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <UserX className="h-4 w-4 mr-2" />
              Desativar Administrador
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminActions;
