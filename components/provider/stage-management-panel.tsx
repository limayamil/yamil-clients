'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import {
  Plus,
  GripVertical,
  Trash2,
  Edit,
  Calendar,
  Clock,
  Target,
  Settings,
  Paperclip,
  Palette,
  Code,
  Eye,
  Send,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingButton, LoadingSpinner } from '@/components/ui/loading-spinner';
import { ActionLoading } from '@/components/ui/loading-overlay';
import { toast } from 'sonner';
import type { Stage } from '@/types/project';
import { createStage, deleteStage, reorderStages } from '@/actions/stages';
import { formatDate } from '@/lib/utils';

interface StageManagementPanelProps {
  stages: Stage[];
  projectId: string;
  onStagesUpdated?: () => void;
}

interface CreateStageFormData {
  title: string;
  description: string;
  type: Stage['type'];
  status: Stage['status'];
  planned_start: string;
  planned_end: string;
  deadline: string;
  owner: 'provider' | 'client';
  insertAfterStageId?: string;
}

export function StageManagementPanel({ stages, projectId, onStagesUpdated }: StageManagementPanelProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [createFormData, setCreateFormData] = useState<CreateStageFormData>({
    title: '',
    description: '',
    type: 'custom',
    status: 'todo',
    planned_start: '',
    planned_end: '',
    deadline: '',
    owner: 'provider'
  });
  const [isLoading, setIsLoading] = useState(false);

  const getStageTypeIcon = (type: Stage['type']) => {
    switch (type) {
      case 'intake': return Settings;
      case 'materials': return Paperclip;
      case 'design': return Palette;
      case 'development': return Code;
      case 'review': return Eye;
      case 'handoff': return Send;
      default: return Settings;
    }
  };

  const getStageTypeLabel = (type: Stage['type']) => {
    switch (type) {
      case 'intake': return 'Intake';
      case 'materials': return 'Materiales';
      case 'design': return 'Diseño';
      case 'development': return 'Desarrollo';
      case 'review': return 'Revisión';
      case 'handoff': return 'Entrega';
      case 'custom': return 'Personalizada';
      default: return type;
    }
  };

  const getStatusLabel = (status: Stage['status']) => {
    switch (status) {
      case 'todo': return 'Por hacer';
      case 'waiting_client': return 'Esperando cliente';
      case 'in_review': return 'En revisión';
      case 'approved': return 'Aprobado';
      case 'blocked': return 'Bloqueado';
      case 'done': return 'Completado';
      default: return status;
    }
  };

  const handleCreateStage = async (insertAfterStageId?: string) => {
    setIsLoading(true);
    toast.loading('Creando etapa...', { id: 'create-stage' });

    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('title', createFormData.title);
      formData.append('description', createFormData.description);
      formData.append('type', createFormData.type);
      formData.append('status', createFormData.status);
      formData.append('planned_start', createFormData.planned_start);
      formData.append('planned_end', createFormData.planned_end);
      formData.append('deadline', createFormData.deadline);
      formData.append('owner', createFormData.owner);

      if (insertAfterStageId) {
        formData.append('insertAfterStageId', insertAfterStageId);
      }

      const result = await createStage(null, formData);

      if (result.error) {
        toast.error('Error al crear la etapa', { id: 'create-stage' });
        console.error('Error creating stage:', result.error);
      } else {
        toast.success('Etapa creada correctamente', { id: 'create-stage' });
        setIsCreateDialogOpen(false);
        setCreateFormData({
          title: '',
          description: '',
          type: 'custom',
          status: 'todo',
          planned_start: '',
          planned_end: '',
          deadline: '',
          owner: 'provider'
        });
        onStagesUpdated?.();
      }
    } catch (error) {
      console.error('Error in handleCreateStage:', error);
      toast.error('Error al crear la etapa', { id: 'create-stage' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta etapa? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsLoading(true);
    toast.loading('Eliminando etapa...', { id: `delete-stage-${stageId}` });

    try {
      const formData = new FormData();
      formData.append('stageId', stageId);
      formData.append('projectId', projectId);
      formData.append('confirmDeletion', 'true');

      const result = await deleteStage(null, formData);

      if (result.error) {
        toast.error('Error al eliminar la etapa', { id: `delete-stage-${stageId}` });
        console.error('Error deleting stage:', result.error);
      } else {
        toast.success('Etapa eliminada correctamente', { id: `delete-stage-${stageId}` });
        onStagesUpdated?.();
      }
    } catch (error) {
      console.error('Error in handleDeleteStage:', error);
      toast.error('Error al eliminar la etapa', { id: `delete-stage-${stageId}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result;

    if (!destination || destination.index === source.index) {
      return;
    }

    setIsLoading(true);
    toast.loading('Reordenando etapas...', { id: 'reorder-stages' });

    try {
      const reorderedStages = Array.from(stages);
      const [reorderedItem] = reorderedStages.splice(source.index, 1);
      reorderedStages.splice(destination.index, 0, reorderedItem);

      const stageIds = reorderedStages.map(stage => stage.id);

      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('stageIds', JSON.stringify(stageIds));

      const result = await reorderStages(null, formData);

      if (result.error) {
        toast.error('Error al reordenar las etapas', { id: 'reorder-stages' });
        console.error('Error reordering stages:', result.error);
      } else {
        toast.success('Etapas reordenadas correctamente', { id: 'reorder-stages' });
        onStagesUpdated?.();
      }
    } catch (error) {
      console.error('Error in handleDragEnd:', error);
      toast.error('Error al reordenar las etapas', { id: 'reorder-stages' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-border/50 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
              <Settings className="h-4 w-4 text-white" />
            </div>
            Gestión de Etapas
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" className="h-8" disabled={isLoading}>
                  <LoadingButton
                    isLoading={isLoading}
                    loadingText="Creando..."
                    variant="dots"
                    size="sm"
                  >
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Etapa
                    </>
                  </LoadingButton>
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Nueva Etapa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={createFormData.title}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título de la etapa"
                    maxLength={200}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción opcional de la etapa"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={createFormData.type} onValueChange={(value: Stage['type']) => setCreateFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intake">Intake</SelectItem>
                        <SelectItem value="materials">Materiales</SelectItem>
                        <SelectItem value="design">Diseño</SelectItem>
                        <SelectItem value="development">Desarrollo</SelectItem>
                        <SelectItem value="review">Revisión</SelectItem>
                        <SelectItem value="handoff">Entrega</SelectItem>
                        <SelectItem value="custom">Personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select value={createFormData.status} onValueChange={(value: Stage['status']) => setCreateFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Por hacer</SelectItem>
                        <SelectItem value="waiting_client">Esperando cliente</SelectItem>
                        <SelectItem value="in_review">En revisión</SelectItem>
                        <SelectItem value="approved">Aprobado</SelectItem>
                        <SelectItem value="blocked">Bloqueado</SelectItem>
                        <SelectItem value="done">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="planned_start">Inicio planificado</Label>
                    <Input
                      id="planned_start"
                      type="datetime-local"
                      value={createFormData.planned_start}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, planned_start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="planned_end">Fin planificado</Label>
                    <Input
                      id="planned_end"
                      type="datetime-local"
                      value={createFormData.planned_end}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, planned_end: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="deadline">Fecha límite</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={createFormData.deadline}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="owner">Responsable</Label>
                  <Select value={createFormData.owner} onValueChange={(value: 'provider' | 'client') => setCreateFormData(prev => ({ ...prev, owner: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="provider">Proveedor</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isLoading}>
                      Cancelar
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: isLoading ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={() => handleCreateStage()} disabled={isLoading || !createFormData.title.trim()}>
                      <LoadingButton
                        isLoading={isLoading}
                        loadingText="Creando..."
                        variant="pulse"
                        size="sm"
                      >
                        Crear Etapa
                      </LoadingButton>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="stages">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {stages.map((stage, index) => {
                  const StageIcon = getStageTypeIcon(stage.type);
                  return (
                    <Draggable key={stage.id} draggableId={stage.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-3 rounded-lg border bg-white transition-all duration-200 ${
                            snapshot.isDragging ? 'shadow-lg border-brand-200' : 'hover:shadow-md border-border/50'
                          }`}
                        >
                          <div {...provided.dragHandleProps} className="flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-foreground transition-colors">
                            <GripVertical className="h-4 w-4" />
                          </div>

                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 shadow-sm">
                            <StageIcon className="h-4 w-4 text-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{stage.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {getStageTypeLabel(stage.type)}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {getStatusLabel(stage.status)}
                              </Badge>
                            </div>
                            {stage.description && (
                              <p className="text-xs text-muted-foreground truncate">{stage.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              {stage.planned_start && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(stage.planned_start)}
                                </span>
                              )}
                              {stage.deadline && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(stage.deadline)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setEditingStage(editingStage === stage.id ? null : stage.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              onClick={() => handleDeleteStage(stage.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {stages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay etapas configuradas</p>
            <p className="text-xs">Agrega la primera etapa para comenzar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}