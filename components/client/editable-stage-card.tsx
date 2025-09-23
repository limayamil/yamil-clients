'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import type { Stage, StageComponent, CommentEntry, FileEntry } from '@/types/project';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { formatDate, getStageTypeColors, getStageStatusColors } from '@/lib/utils';
import { updateStage } from '@/actions/stages';
import { toast } from 'sonner';
import { EditableStageDate } from '@/components/ui/editable-stage-date';
import { EditableStageComponents } from '@/components/client/editable-stage-components';
import { ClientStageComponents } from '@/components/client/client-stage-components';

interface EditableStageCardProps {
  stage: Stage;
  projectId: string;
  comments: CommentEntry[];
  files?: FileEntry[];
  onAddComponent?: (stageId: string, componentType: string) => void;
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
  onDeleteComponent?: (componentId: string) => void;
  onUpdateStage?: (stageId: string, updates: Partial<Stage>) => void;
  onToggleComments?: (stageId: string) => void;
  onUploadFiles?: (stageId: string) => void;
  defaultExpanded?: boolean;
  className?: string;
  viewMode?: 'client' | 'provider';
  currentUserId?: string;
}

export function EditableStageCard({
  stage,
  projectId,
  comments,
  files = [],
  onAddComponent,
  onUpdateComponent,
  onDeleteComponent,
  onUpdateStage,
  onToggleComments,
  onUploadFiles,
  defaultExpanded = true,
  className,
  viewMode = 'provider',
  currentUserId
}: EditableStageCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
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
      } else {
        toast.success('Fecha actualizada');
      }
    } catch (error) {
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

  // Calculate comment and link counters for this stage
  const stageCommentsCount = comments.filter(comment => comment.stage_id === stage.id).length;
  const stageComponentCommentsCount = comments.filter(comment =>
    stage.components?.some(comp => comp.id === comment.component_id)
  ).length;
  const totalCommentsCount = stageCommentsCount + stageComponentCommentsCount;

  // Count stage links (files with mime type 'text/uri-list' or URLs in storage_path)
  const stageLinksCount = files.filter(file =>
    file.stage_id === stage.id &&
    (file.mime === 'text/uri-list' || file.storage_path?.startsWith('http'))
  ).length;

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={className}
    >
      <Card className="group transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3 relative">
        {/* Gradiente decorativo sutil */}
        <div className={`absolute inset-0 bg-gradient-to-b ${getStageTypeColors(stage.type).gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xl`}></div>

        <div className="relative flex items-center justify-between">
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.001 }}
            whileTap={{ scale: 0.998 }}
          >
            <Button
              variant="ghost"
              className="h-auto p-0 justify-start gap-3 text-left flex-1 hover:bg-transparent w-full"
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
          </motion.div>

          <div className="flex items-center gap-2 ml-3">
            {viewMode === 'provider' && (
              <DropdownMenu open={showAddMenu} onOpenChange={setShowAddMenu}>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-11 w-11 sm:h-8 sm:w-8 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:bg-brand-100/50 touch-manipulation"
                    >
                      <MoreVertical className="h-5 w-5 sm:h-4 sm:w-4" />
                    </Button>
                  </motion.div>
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
            )}
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

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: 'hidden' }}
          >
            <CardContent className="pt-0">
            {/* Componentes editables o de solo lectura según el modo */}
            {viewMode === 'client' ? (
              <ClientStageComponents
                components={stage.components || []}
                projectId={projectId}
                comments={comments}
                onUpdateComponent={onUpdateComponent}
              />
            ) : (
              <EditableStageComponents
                components={stage.components || []}
                stageId={stage.id}
                projectId={projectId}
                comments={comments}
                onUpdateComponent={onUpdateComponent}
                onDeleteComponent={onDeleteComponent}
                onAddComponent={(stageId, component) => {
                  // Esta función no se usa actualmente, los componentes se agregan a través del dropdown
                }}
                readonly={false}
              />
            )}

            {/* Acciones rápidas mejoradas */}
            <motion.div
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 pt-4 border-t border-border/30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 sm:flex-none"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleComments?.(stage.id)}
                  className="h-11 sm:h-8 text-xs hover:bg-blue-100/50 hover:text-blue-700 transition-colors duration-200 gap-1.5 justify-start sm:justify-center touch-manipulation w-full sm:w-auto"
                >
                  <motion.div
                    animate={totalCommentsCount > 0 ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    <MessageSquare className="h-4 w-4 sm:h-3 sm:w-3" />
                  </motion.div>
                  <span>Comentar</span>
                  <AnimatePresence>
                    {totalCommentsCount > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center ml-auto sm:ml-0"
                      >
                        {totalCommentsCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 sm:flex-none"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUploadFiles?.(stage.id)}
                  className="h-11 sm:h-8 text-xs hover:bg-green-100/50 hover:text-green-700 transition-colors duration-200 gap-1.5 justify-start sm:justify-center touch-manipulation w-full sm:w-auto"
                >
                  <motion.div
                    animate={stageLinksCount > 0 ? {
                      y: [0, -2, 0],
                      opacity: [1, 0.8, 1]
                    } : {}}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 4
                    }}
                  >
                    <Link className="h-4 w-4 sm:h-3 sm:w-3" />
                  </motion.div>
                  <span>Compartir enlace</span>
                  <AnimatePresence>
                    {stageLinksCount > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center ml-auto sm:ml-0"
                      >
                        {stageLinksCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              <div className="flex-1 hidden sm:block" />

              {viewMode === 'provider' && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 sm:flex-none"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddMenu(true)}
                    className="h-11 sm:h-8 text-xs hover:bg-brand-100/50 hover:text-brand-700 transition-all duration-200 justify-start sm:justify-center touch-manipulation w-full sm:w-auto"
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 180, 360]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 2
                      }}
                    >
                      <Plus className="h-4 w-4 sm:h-3 sm:w-3 mr-1.5" />
                    </motion.div>
                    Agregar
                  </Button>
                </motion.div>
              )}
            </motion.div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
      </Card>
    </motion.div>
  );
}