
import React from 'react';
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
import { Trash2 } from 'lucide-react';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContracts: string[];
  contracts: any[];
  onConfirm: (contractIds: string[]) => void;
}

const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  isOpen,
  onClose,
  selectedContracts,
  contracts,
  onConfirm
}) => {
  const selectedContractDetails = contracts.filter(contract => 
    selectedContracts.includes(contract.id)
  );

  const handleConfirm = () => {
    onConfirm(selectedContracts);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Confirmar Exclusão em Massa
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Você está prestes a excluir <strong>{selectedContracts.length}</strong> contrato(s). 
            Esta ação não pode ser desfeita.
            
            <div className="mt-4 p-3 bg-muted rounded-md max-h-40 overflow-y-auto">
              <p className="text-sm font-medium text-muted-foreground mb-2">Contratos a serem excluídos:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {selectedContractDetails.map((contract) => (
                  <li key={contract.id} className="flex justify-between">
                    <span>#{contract.contract_number}</span>
                    <span className="text-xs">
                      {contract.contractors?.[0]?.name || 'Sem nome'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Excluir {selectedContracts.length} Contrato(s)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BulkDeleteDialog;
