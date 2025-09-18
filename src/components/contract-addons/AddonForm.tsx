
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ContractAddon, AddonFormData } from "@/types/contract-addons";

interface AddonFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingAddon: ContractAddon | null;
  formData: AddonFormData;
  setFormData: (data: AddonFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AddonForm = ({ 
  isOpen, 
  onOpenChange, 
  editingAddon, 
  formData, 
  setFormData, 
  onSubmit 
}: AddonFormProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingAddon ? "Editar Adicional" : "Novo Adicional"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addon_type">Tipo de Adicional *</Label>
            <Select 
              value={formData.addon_type} 
              onValueChange={(value) => setFormData({ ...formData, addon_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="additional_service">Serviço Adicional</SelectItem>
                <SelectItem value="value_adjustment">Ajuste de Valor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a mudança ou adicional..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="previous_value">Valor Anterior</Label>
            <Input
              id="previous_value"
              value={formData.previous_value}
              onChange={(e) => setFormData({ ...formData, previous_value: e.target.value })}
              placeholder="Ex: R$ 1.500,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_value">Novo Valor *</Label>
            <Input
              id="new_value"
              value={formData.new_value}
              onChange={(e) => setFormData({ ...formData, new_value: e.target.value })}
              placeholder="Ex: R$ 2.000,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requested_by">Solicitado por *</Label>
            <Input
              id="requested_by"
              value={formData.requested_by}
              onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
              placeholder="Nome do solicitante"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="request_date">Data da Solicitação *</Label>
            <Input
              id="request_date"
              type="date"
              value={formData.request_date}
              onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingAddon ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddonForm;
