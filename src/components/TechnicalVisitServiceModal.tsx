import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTechnicalVisitServices } from "@/hooks/useTechnicalVisitServices";
import { useToast } from "@/hooks/use-toast";

interface TechnicalVisitServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string | null;
}

const TechnicalVisitServiceModal = ({ isOpen, onClose, editingId }: TechnicalVisitServiceModalProps) => {
  const { services, createService, updateService } = useTechnicalVisitServices();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricing_type: 'fixed' as 'fixed' | 'hourly',
    fixed_price: '',
    estimated_hours: ''
  });

  const editingService = services.find(s => s.id === editingId);

  useEffect(() => {
    if (isOpen) {
      if (editingService) {
        setFormData({
          name: editingService.name,
          description: editingService.description || '',
          pricing_type: editingService.pricing_type,
          fixed_price: editingService.fixed_price?.toString() || '',
          estimated_hours: editingService.estimated_hours?.toString() || ''
        });
      } else {
        setFormData({
          name: '',
          description: '',
          pricing_type: 'fixed',
          fixed_price: '',
          estimated_hours: ''
        });
      }
    }
  }, [isOpen, editingService]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do serviço é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (formData.pricing_type === 'fixed' && !formData.fixed_price) {
      toast({
        title: "Erro", 
        description: "Preço fixo é obrigatório para serviços com preço fixo",
        variant: "destructive",
      });
      return;
    }

    if (formData.pricing_type === 'hourly' && !formData.estimated_hours) {
      toast({
        title: "Erro",
        description: "Horas estimadas são obrigatórias para serviços por hora",
        variant: "destructive",
      });
      return;
    }

    const serviceData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      pricing_type: formData.pricing_type,
      fixed_price: formData.pricing_type === 'fixed' ? Number(formData.fixed_price) : undefined,
      estimated_hours: formData.pricing_type === 'hourly' ? Number(formData.estimated_hours) : undefined,
    };

    try {
      if (editingId) {
        await updateService.mutateAsync({ id: editingId, ...serviceData });
      } else {
        await createService.mutateAsync(serviceData);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingId ? 'Editar Serviço' : 'Novo Serviço'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Serviço *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Instalação de Equipamento"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição detalhada do serviço"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="pricing_type">Tipo de Preço *</Label>
            <Select 
              value={formData.pricing_type} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                pricing_type: value as 'fixed' | 'hourly',
                fixed_price: value === 'hourly' ? '' : prev.fixed_price,
                estimated_hours: value === 'fixed' ? '' : prev.estimated_hours
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de preço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Preço Fixo</SelectItem>
                <SelectItem value="hourly">Por Hora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.pricing_type === 'fixed' && (
            <div>
              <Label htmlFor="fixed_price">Preço Fixo (R$) *</Label>
              <Input
                id="fixed_price"
                type="text"
                value={formData.fixed_price}
                onChange={(e) => {
                  // Remove tudo que não é número ou vírgula
                  let value = e.target.value.replace(/[^\d,]/g, '');
                  // Permite apenas uma vírgula
                  const commaCount = (value.match(/,/g) || []).length;
                  if (commaCount > 1) {
                    value = value.replace(/,(?=.*,)/g, '');
                  }
                  // Limita a 2 casas decimais após a vírgula
                  if (value.includes(',')) {
                    const parts = value.split(',');
                    if (parts[1] && parts[1].length > 2) {
                      value = parts[0] + ',' + parts[1].slice(0, 2);
                    }
                  }
                  setFormData(prev => ({ ...prev, fixed_price: value }));
                }}
                placeholder="0,00"
              />
            </div>
          )}

          {formData.pricing_type === 'hourly' && (
            <div>
              <Label htmlFor="estimated_hours">Horas Estimadas *</Label>
              <Input
                id="estimated_hours"
                type="number"
                step="0.5"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                placeholder="0"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={createService.isPending || updateService.isPending}
          >
            {createService.isPending || updateService.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TechnicalVisitServiceModal;