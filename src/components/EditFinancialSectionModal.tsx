import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useUpdateFinancialSection } from "@/hooks/useFinancialSections";
import { COLOR_SCHEMES, type ColorScheme, type FinancialSection } from "@/types/financial-sections";

interface EditFinancialSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: FinancialSection | null;
}

const EditFinancialSectionModal: React.FC<EditFinancialSectionModalProps> = ({
  isOpen,
  onClose,
  section,
}) => {
  const [name, setName] = useState("");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("blue");
  const updateSection = useUpdateFinancialSection();

  useEffect(() => {
    if (section) {
      setName(section.name);
      setColorScheme(section.color_scheme as ColorScheme);
    }
  }, [section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!section || !name.trim()) {
      return;
    }

    try {
      await updateSection.mutateAsync({
        id: section.id,
        updates: {
          name: name.trim(),
          color_scheme: colorScheme,
        },
      });
      onClose();
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  const selectedColors = COLOR_SCHEMES[colorScheme];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Seção Financeira</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-name">Nome da Seção</Label>
            <Input
              id="section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Receitas Extras, Custos Variáveis..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color-scheme">Esquema de Cores</Label>
            <Select value={colorScheme} onValueChange={(value) => setColorScheme(value as ColorScheme)}>
              <SelectTrigger id="color-scheme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COLOR_SCHEMES).map(([key, colors]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${colors.background}`} />
                      <span>{colors.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview da cor selecionada */}
          <Card className={`p-4 ${selectedColors.background} ${selectedColors.backgroundText}`}>
            <div className="font-semibold mb-2">Preview: {name || "Nome da Seção"}</div>
            <div className="text-sm opacity-90">
              Esta é uma prévia de como a seção aparecerá com o esquema de cores selecionado.
            </div>
          </Card>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || updateSection.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateSection.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFinancialSectionModal;