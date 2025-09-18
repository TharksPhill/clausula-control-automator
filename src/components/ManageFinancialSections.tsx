import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, GripVertical } from "lucide-react";
import { useFinancialSections, useDeleteFinancialSection, useUpdateFinancialSection } from "@/hooks/useFinancialSections";
import AddFinancialSectionModal from "./AddFinancialSectionModal";
import EditFinancialSectionModal from "./EditFinancialSectionModal";
import { COLOR_SCHEMES, type ColorScheme, type FinancialSection } from "@/types/financial-sections";

interface ManageFinancialSectionsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageFinancialSections: React.FC<ManageFinancialSectionsProps> = ({
  isOpen,
  onClose,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<FinancialSection | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOverItem, setDraggedOverItem] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'above' | 'below' | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  
  const { data: sections = [] } = useFinancialSections();
  const deleteSection = useDeleteFinancialSection();
  const updateSection = useUpdateFinancialSection();

  // Auto-scroll logic
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  const handleDeleteSection = async (sectionId: string, sectionName: string) => {
    try {
      await deleteSection.mutateAsync(sectionId);
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  const handleEditSection = (section: FinancialSection) => {
    setSelectedSection(section);
    setShowEditModal(true);
  };

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedItem(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Auto-scroll logic
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const scrollSpeed = 5;
      const scrollZone = 100; // pixels from edge to trigger scroll
      
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      
      // Check if near top edge
      if (e.clientY - containerRect.top < scrollZone) {
        scrollIntervalRef.current = window.setInterval(() => {
          container.scrollTop -= scrollSpeed;
        }, 10);
      }
      // Check if near bottom edge
      else if (containerRect.bottom - e.clientY < scrollZone) {
        scrollIntervalRef.current = window.setInterval(() => {
          container.scrollTop += scrollSpeed;
        }, 10);
      }
    }
    
    // Determine if dragging above or below the middle of the element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    setDragPosition(e.clientY < midpoint ? 'above' : 'below');
  };

  const handleDragEnter = (e: React.DragEvent, sectionId: string) => {
    if (draggedItem !== sectionId) {
      setDraggedOverItem(sectionId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the card entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDraggedOverItem(null);
      setDragPosition(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    
    // Stop auto-scroll
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    if (!draggedItem || draggedItem === targetSectionId) {
      setDraggedItem(null);
      setDraggedOverItem(null);
      setDragPosition(null);
      return;
    }

    const draggedSection = sections.find(s => s.id === draggedItem);
    const targetSection = sections.find(s => s.id === targetSectionId);

    if (!draggedSection || !targetSection) {
      setDraggedItem(null);
      setDraggedOverItem(null);
      setDragPosition(null);
      return;
    }

    // Reordenar as seções
    const reorderedSections = [...sections];
    const draggedIndex = reorderedSections.findIndex(s => s.id === draggedItem);
    const targetIndex = reorderedSections.findIndex(s => s.id === targetSectionId);

    // Remover o item arrastado
    const [removed] = reorderedSections.splice(draggedIndex, 1);
    
    // Inserir na nova posição considerando a direção
    const insertIndex = dragPosition === 'below' && draggedIndex < targetIndex 
      ? targetIndex 
      : dragPosition === 'above' && draggedIndex > targetIndex 
      ? targetIndex 
      : targetIndex;
    
    reorderedSections.splice(insertIndex, 0, removed);

    // Atualizar order_index de todas as seções afetadas
    const updates = reorderedSections.map((section, index) => ({
      id: section.id,
      order_index: index + 1
    }));

    // Atualizar no banco de dados
    try {
      await Promise.all(
        updates.map(update => 
          updateSection.mutateAsync({
            id: update.id,
            updates: { order_index: update.order_index }
          })
        )
      );
    } catch (error) {
      console.error("Error updating section order:", error);
    }

    setDraggedItem(null);
    setDraggedOverItem(null);
    setDragPosition(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Stop auto-scroll
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    // Reset visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '';
    
    setDraggedItem(null);
    setDraggedOverItem(null);
    setDragPosition(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">
              Seções Financeiras Cadastradas
              <p className="text-sm text-gray-400 font-normal mt-1">Lista de todas as seções personalizadas com suas configurações</p>
            </DialogTitle>
          </DialogHeader>
          
          <div className="absolute top-4 right-14">
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Seção
            </Button>
          </div>
          
          <div className="space-y-3 mt-8 bg-slate-950/50 rounded-lg p-4" ref={scrollContainerRef}>
            {sections.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Nenhuma seção personalizada criada ainda.</p>
                <p className="text-sm mt-2">Clique em "Nova Seção" para começar!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Header da tabela */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
                  <div className="col-span-1"></div>
                  <div className="col-span-3">Nome</div>
                  <div className="col-span-3">Esquema de Cores</div>
                  <div className="col-span-2">Data Criação</div>
                  <div className="col-span-1">Ordem</div>
                  <div className="col-span-2 text-center">Ações</div>
                </div>
                
                {sections.map((section) => {
                  const colors = COLOR_SCHEMES[section.color_scheme as ColorScheme];
                  const isDragging = draggedItem === section.id;
                  const isDraggedOver = draggedOverItem === section.id;
                  
                  return (
                    <div key={section.id} className="relative">
                      {/* Placeholder visual para indicar onde o item será inserido */}
                      {isDraggedOver && dragPosition === 'above' && (
                        <div className="h-0.5 bg-blue-500 rounded-full mb-1 animate-pulse" />
                      )}
                      
                      <div
                        className={`grid grid-cols-12 gap-4 items-center px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg transition-all duration-200 cursor-move ${
                          isDragging ? 'opacity-30 scale-95' : ''
                        } ${
                          isDraggedOver && !isDragging ? 'scale-[1.01] border-blue-500/50' : ''
                        } hover:bg-slate-800/70`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="col-span-1">
                          <GripVertical className="h-4 w-4 text-gray-500" />
                        </div>
                        
                        <div className="col-span-3 font-medium text-white">
                          {section.name}
                        </div>
                        
                        <div className="col-span-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${colors.background}`} />
                            <span className="text-sm text-gray-300">{colors.name}</span>
                          </div>
                        </div>
                        
                        <div className="col-span-2 text-sm text-gray-400">
                          {new Date(section.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        
                        <div className="col-span-1 text-center">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                            {section.order_index}
                          </Badge>
                        </div>
                        
                        <div className="col-span-2 flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSection(section)}
                            className="text-gray-400 hover:text-white hover:bg-slate-700 h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSection(section.id, section.name)}
                            className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Placeholder visual para indicar onde o item será inserido */}
                      {isDraggedOver && dragPosition === 'below' && (
                        <div className="h-0.5 bg-blue-500 rounded-full mt-1 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-800">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-slate-700 text-gray-300 hover:bg-slate-800 hover:text-white"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de adicionar seção */}
      <AddFinancialSectionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Modal de editar seção */}
      <EditFinancialSectionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSection(null);
        }}
        section={selectedSection}
      />
    </>
  );
};

export default ManageFinancialSections;