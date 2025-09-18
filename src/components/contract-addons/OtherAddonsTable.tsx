
import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit2, Trash2, User, Calendar } from "lucide-react";
import { ContractAddon } from "@/types/contract-addons";

interface OtherAddonsTableProps {
  otherAddons: ContractAddon[];
  loading: boolean;
  onEdit: (addon: ContractAddon) => void;
  onDelete: (addonId: string) => void;
  getAddonTypeLabel: (type: string) => string;
  getAddonTypeBadgeVariant: (type: string) => "default" | "secondary" | "outline";
}

const OtherAddonsTable = ({ 
  otherAddons, 
  loading, 
  onEdit, 
  onDelete, 
  getAddonTypeLabel, 
  getAddonTypeBadgeVariant 
}: OtherAddonsTableProps) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Carregando adicionais...</p>
      </div>
    );
  }

  if (otherAddons.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum serviço adicional registrado para este contrato.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor Anterior</TableHead>
            <TableHead>Novo Valor</TableHead>
            <TableHead>Solicitado por</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {otherAddons.map((addon) => (
            <TableRow key={addon.id}>
              <TableCell>
                <Badge variant={getAddonTypeBadgeVariant(addon.addon_type)}>
                  {getAddonTypeLabel(addon.addon_type)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={addon.description}>
                  {addon.description}
                </div>
              </TableCell>
              <TableCell>
                {addon.previous_value ? (
                  <span className="text-gray-600">{addon.previous_value}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className="font-medium text-green-600">{addon.new_value}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-400" />
                  {addon.requested_by}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  {new Date(addon.request_date).toLocaleDateString('pt-BR')}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(addon)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este adicional? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(addon.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OtherAddonsTable;
