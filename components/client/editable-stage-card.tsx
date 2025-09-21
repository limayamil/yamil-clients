'use client';

import { useState, useRef } from 'react';
import {
  MessageSquare,
  Paperclip,
  CheckSquare,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  FileText,
  Palette,
  Code,
  Eye,
  Send,
  Settings,
  Clock,
  Calendar,
  Zap,
  AlertCircle,
  CheckCircle2,
  Users,
  Target,
  Link
} from 'lucide-react';
import type { Stage, StageComponent, CommentEntry } from '@/types/project';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { formatDate, getStageTypeColors, getStageStatusColors } from '@/lib/utils';
import { updateStage } from '@/actions/stages';
import { toast } from 'sonner';
import { EditableStageDate } from '@/components/ui/editable-stage-date';
import { EditableStageComponents } from '@/components/client/editable-stage-components';

interface EditableStageCardProps {
  stage: Stage;
  projectId: string;
  comments: CommentEntry[];
  onAddComponent?: (stageId: string, componentType: string) => void;
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
  onDeleteComponent?: (componentId: string) => void;
  onUpdateStage?: (stageId: string, updates: Partial<Stage>) => void;
  onToggleComments?: (stageId: string) => void;
  onUploadFiles?: (stageId: string) => void;
  className?: string;
}

export function EditableStageCard({
  stage,
  projectId,
  comments,
  onAddComponent,
  onUpdateComponent,
  onDeleteComponent,
  onUpdateStage,
  onToggleComments,
  onUploadFiles,
  className
}: EditableStageCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const getStageTypeIcon = (type: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'success';
      case 'approved': return 'default';
      case 'waiting_client': return 'warning';
      case 'in_review': return 'secondary';
      case 'blocked': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo': return 'Por hacer';
      case 'approved': return 'Aprobado';
      case 'waiting_client': return 'Esperando cliente';
      case 'in_review': return 'En revisión';
      case 'done': return 'Completado';
      case 'blocked': return 'Bloqueado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return CheckCircle2;
      case 'approved': return CheckCircle2;
      case 'waiting_client': return Clock;
      case 'in_review': return Eye;
      case 'blocked': return AlertCircle;
      default: return Target;
    }
  };

  const handleAddComponent = (componentType: string) => {
    onAddComponent?.(stage.id, componentType);
    setShowAddMenu(false);
  };

  const handleUpdateStageStatus = (newStatus: string) => {
    onUpdateStage?.(stage.id, { status: newStatus as Stage['status'] });
    setShowAddMenu(false);
  };

  const handleUpdateStageDate = async (dateField: 'planned_start' | 'planned_end' | 'deadline', newDate: string) => {
    try {
      // If there's an onUpdateStage prop, use it instead of calling the action directly
      if (onUpdateStage) {
        const updates: Partial<Stage> = {};
        updates[dateField] = newDate;
        onUpdateStage(stage.id, updates);
        return;
      }

      // Fallback to direct action call
      const formData = new FormData();
      formData.append('stageId', stage.id);
      formData.append('projectId', stage.project_id);
      formData.append(dateField, newDate);

      const result = await updateStage(null, formData);

      if (result.error) {
        toast.error('Error al actualizar la fecha');
        console.error('Error updating stage date:', result.error);
      } else {
        toast.success('Fecha actualizada');
      }
    } catch (error) {
      console.error('Error in handleUpdateStageDate:', error);
      toast.error('Error al actualizar la fecha');
    }
  };

  const componentTypes = [
    { type: 'upload_request', label: 'Solicitar enlaces', icon: Link },
    { type: 'checklist', label: 'Lista de verificación', icon: CheckSquare },
    { type: 'approval', label: 'Solicitar aprobación', icon: CheckCircle2 },
    { type: 'text_block', label: 'Nota/Descripción', icon: FileText },
  ];

  const statusOptions = [
    { value: 'todo', label: 'Por hacer', icon: Target },
    { value: 'waiting_client', label: 'Esperando cliente', icon: Clock },
    { value: 'in_review', label: 'En revisión', icon: Eye },
    { value: 'approved', label: 'Aprobado', icon: CheckCircle2 },
    { value: 'blocked', label: 'Bloqueado', icon: AlertCircle },
    { value: 'done', label: 'Completado', icon: CheckCircle2 },
  ];

  const StageTypeIcon = getStageTypeIcon(stage.type);
  const StatusIcon = getStatusIcon(stage.status);

  return (
    <Card ref={cardRef} className={`group transition-all duration-300 hover:shadow-lg ${className}`}>
      <CardHeader className="pb-3 relative">
        {/* Gradiente decorativo sutil */}
        <div className={`absolute inset-0 bg-gradient-to-b ${getStageTypeColors(stage.type).gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xl`}></div>

        <div className="relative flex items-center justify-between">
          <Button
            variant="ghost"
            className="h-auto p-0 justify-start gap-3 text-left flex-1 hover:bg-transparent"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              {/* Icono de tipo de etapa */}
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-sm transition-colors duration-200 ${getStageTypeColors(stage.type).solid}`}>
                <StageTypeIcon className="h-4 w-4 text-white" />
              </div>

              {/* Chevron de expansión */}
              <div className="transition-transform duration-200">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-foreground truncate">{stage.title}</h3>
                <Badge
                  variant={getStatusColor(stage.status)}
                  className="text-xs shadow-sm animate-in fade-in-0 duration-200"
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {getStatusText(stage.status)}
                </Badge>
              </div>
              {stage.description && (
                <p className="text-sm text-muted-foreground truncate">{stage.description}</p>
              )}
            </div>
          </Button>

          <div className="flex items-center gap-2 ml-3">
            <DropdownMenu open={showAddMenu} onOpenChange={setShowAddMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-brand-100/50 hover:scale-105"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-border/50 shadow-xl">
                {/* Cambiar estado de etapa */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-3">
                    <StatusIcon className="h-4 w-4" />
                    Cambiar estado
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {statusOptions.map((status) => {
                      const Icon = status.icon;
                      const isCurrentStatus = stage.status === status.value;
                      return (
                        <DropdownMenuItem
                          key={status.value}
                          onClick={() => handleUpdateStageStatus(status.value)}
                          className={`gap-3 ${isCurrentStatus ? 'bg-brand-50 text-brand-700' : ''}`}
                          disabled={isCurrentStatus}
                        >
                          <Icon className="h-4 w-4" />
                          {status.label}
                          {isCurrentStatus && <span className="ml-auto text-xs">Actual</span>}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                {/* Acciones de etapa */}
                <DropdownMenuItem onClick={() => onToggleComments?.(stage.id)} className="gap-3">
                  <MessageSquare className="h-4 w-4" />
                  Comentarios de etapa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUploadFiles?.(stage.id)} className="gap-3">
                  <Link className="h-4 w-4" />
                  Compartir enlaces
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Agregar componentes */}
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Agregar componente
                </div>
                {componentTypes.map((comp) => {
                  const Icon = comp.icon;
                  return (
                    <DropdownMenuItem
                      key={comp.type}
                      onClick={() => handleAddComponent(comp.type)}
                      className="gap-3"
                    >
                      <Icon className="h-4 w-4" />
                      {comp.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Fechas editables de la etapa */}
        <div className="relative pt-3 mt-3 border-t border-border/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <EditableStageDate
              value={stage.planned_start}
              onSave={(newDate) => handleUpdateStageDate('planned_start', newDate)}
              placeholder="Fecha de inicio"
              label="Inicio"
              dateType="start"
              className="text-xs"
            />
            <EditableStageDate
              value={stage.planned_end}
              onSave={(newDate) => handleUpdateStageDate('planned_end', newDate)}
              placeholder="Fecha de fin"
              label="Fin"
              dateType="end"
              className="text-xs"
            />
            <EditableStageDate
              value={stage.deadline}
              onSave={(newDate) => handleUpdateStageDate('deadline', newDate)}
              placeholder="Fecha límite"
              label="Límite"
              dateType="deadline"
              className="text-xs"
            />
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
            {/* Componentes editables */}
            <EditableStageComponents
              components={stage.components || []}
              stageId={stage.id}
              projectId={projectId}
              comments={comments}
              onUpdateComponent={onUpdateComponent}
              onDeleteComponent={onDeleteComponent}
              onAddComponent={(stageId, component) => {
                // Esta función no se usa actualmente, los componentes se agregan a través del dropdown
                console.log('Adding full component:', component, 'to stage:', stageId);
              }}
              readonly={false}
            />

            {/* Acciones rápidas mejoradas */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleComments?.(stage.id)}
                className="h-8 text-xs hover:bg-blue-100/50 hover:text-blue-700 transition-colors duration-200"
              >
                <MessageSquare className="h-3 w-3 mr-1.5" />
                Comentar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUploadFiles?.(stage.id)}
                className="h-8 text-xs hover:bg-green-100/50 hover:text-green-700 transition-colors duration-200"
              >
                <Link className="h-3 w-3 mr-1.5" />
                Compartir enlace
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddMenu(true)}
                className="h-8 text-xs hover:bg-brand-100/50 hover:text-brand-700 transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Agregar
              </Button>
            </div>
        </CardContent>
      )}
    </Card>
  );
}