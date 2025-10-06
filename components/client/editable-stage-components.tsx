'use client';

import { useState, memo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  FileText,
  Paperclip,
  CheckSquare,
  CheckCircle2,
  Link,
  Clock,
  Eye,
  AlertCircle,
  Users,
  Target,
  Play,
  Send,
  ExternalLink
} from 'lucide-react';
import type { StageComponent, CommentEntry } from '@/types/project';
import type { ChecklistItem } from '@/components/client/dynamic-checklist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicChecklist } from '@/components/client/dynamic-checklist';
import { ComponentCommentThread } from '@/components/shared/component-comment-thread';
import { CreatingComponentSkeleton, DeletingComponentSkeleton } from '@/components/ui/skeleton-component';
import { ActionLoading } from '@/components/ui/loading-overlay';
import { LoadingButton } from '@/components/ui/loading-spinner';
import { RichTextViewer } from '@/components/ui/rich-text-viewer';
import { ExpandableText } from '@/components/ui/expandable-text';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface EditableStageComponentsProps {
  components: StageComponent[];
  stageId: string;
  projectId: string;
  comments: CommentEntry[];
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
  onDeleteComponent?: (componentId: string) => void;
  onAddComponent?: (stageId: string, component: Omit<StageComponent, 'id' | 'stage_id'>) => void;
  readonly?: boolean;
  currentUser?: { id: string; role: 'provider' | 'client' } | null;
  clientName?: string;
}

export function EditableStageComponents({
  components,
  stageId,
  projectId,
  comments,
  onUpdateComponent,
  onDeleteComponent,
  onAddComponent,
  readonly = false,
  currentUser,
  clientName
}: EditableStageComponentsProps) {
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<{
    updating: Set<string>;
    deleting: Set<string>;
    creating: boolean;
  }>({
    updating: new Set(),
    deleting: new Set(),
    creating: false
  });

  const [deletingComponents, setDeletingComponents] = useState<Set<string>>(new Set());

  const handleEdit = (componentId: string) => {
    if (readonly) return;
    setEditingComponent(componentId);
  };

  const handleSave = async (component: StageComponent, updates: any) => {
    const { title, ...configUpdates } = updates;
    const componentUpdates: Partial<StageComponent> = {
      config: { ...component.config, ...configUpdates }
    };

    if (title !== undefined) {
      componentUpdates.title = title;
    }

    // Agregar loading state
    setLoadingStates(prev => ({
      ...prev,
      updating: new Set([...prev.updating, component.id])
    }));

    try {
      await onUpdateComponent?.(component.id, componentUpdates);
      setEditingComponent(null);
    } finally {
      // Remover loading state
      setLoadingStates(prev => {
        const newUpdating = new Set(prev.updating);
        newUpdating.delete(component.id);
        return { ...prev, updating: newUpdating };
      });
    }
  };

  const handleCancel = () => {
    setEditingComponent(null);
  };

  const handleDelete = async (componentId: string) => {
    if (readonly) return;

    // Agregar a la lista de elementos que se están eliminando
    setDeletingComponents(prev => new Set([...prev, componentId]));

    // Agregar loading state
    setLoadingStates(prev => ({
      ...prev,
      deleting: new Set([...prev.deleting, componentId])
    }));

    try {
      // Esperar un poco para mostrar la animación de eliminación
      await new Promise(resolve => setTimeout(resolve, 600));
      await onDeleteComponent?.(componentId);
    } finally {
      // Cleanup states
      setDeletingComponents(prev => {
        const newSet = new Set(prev);
        newSet.delete(componentId);
        return newSet;
      });

      setLoadingStates(prev => {
        const newDeleting = new Set(prev.deleting);
        newDeleting.delete(componentId);
        return { ...prev, deleting: newDeleting };
      });
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {components.map((component) => {
          // Si el componente está siendo eliminado, mostrar skeleton de eliminación
          if (deletingComponents.has(component.id)) {
            return (
              <motion.div
                key={`deleting-${component.id}`}
                layout
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DeletingComponentSkeleton />
              </motion.div>
            );
          }

          return (
            <motion.div
              key={component.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                layout: { duration: 0.3 }
              }}
            >
              <ActionLoading
                isLoading={loadingStates.updating.has(component.id)}
                action="updating"
              >
                <EditableComponentCard
                  component={component}
                  isEditing={editingComponent === component.id}
                  readonly={readonly}
                  projectId={projectId}
                  comments={comments}
                  onEdit={() => handleEdit(component.id)}
                  onSave={(updates) => handleSave(component, updates)}
                  onCancel={handleCancel}
                  onDelete={() => handleDelete(component.id)}
                  onUpdateComponent={onUpdateComponent}
                  isLoading={loadingStates.updating.has(component.id) || loadingStates.deleting.has(component.id)}
                  currentUser={currentUser}
                  clientName={clientName}
                />
              </ActionLoading>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Loading state para crear componentes */}
      {loadingStates.creating && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
        >
          <CreatingComponentSkeleton />
        </motion.div>
      )}

      {components.length === 0 && !loadingStates.creating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-dashed border-border p-6 text-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Plus className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
          </motion.div>
          <p className="text-sm text-muted-foreground">No hay componentes en esta etapa</p>
          <p className="text-xs text-muted-foreground mt-1">
            {readonly
              ? "Tu proveedor aún no ha agregado contenido a esta etapa"
              : "Usa las opciones de la etapa para agregar contenido"
            }
          </p>
        </motion.div>
      )}
    </div>
  );
}

interface EditableComponentCardProps {
  component: StageComponent;
  isEditing: boolean;
  readonly: boolean;
  projectId: string;
  comments: CommentEntry[];
  onEdit: () => void;
  onSave: (updates: any) => void;
  onCancel: () => void;
  onDelete: () => void;
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
  isLoading?: boolean;
  currentUser?: { id: string; role: 'provider' | 'client' } | null;
  clientName?: string;
}

function EditableComponentCard({
  component,
  isEditing,
  readonly,
  projectId,
  comments,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onUpdateComponent,
  isLoading = false,
  currentUser,
  clientName
}: EditableComponentCardProps) {
  // console.log('clientName:', clientName); // Debug: Verify clientName is available
  const [editData, setEditData] = useState<any>({
    ...component.config,
    title: component.title
  });

  // Sincronizar estado local cuando el componente cambia desde el servidor
  useEffect(() => {
    setEditData({
      ...component.config,
      title: component.title
    });
  }, [component.config, component.title]);

  const handleSave = useCallback((updates: any) => {
    onSave(updates);
  }, [onSave]);

  const handleCancel = useCallback(() => {
    setEditData({
      ...component.config,
      title: component.title
    });
    onCancel();
  }, [component.config, component.title, onCancel]);

  const handleDataChange = useCallback((newData: any) => {
    setEditData(newData);
  }, []);

  if (isEditing) {
    return (
      <EditMode
        component={component}
        editData={editData}
        onDataChange={handleDataChange}
        onSave={(updates) => handleSave(updates)}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <ViewMode
      component={component}
      readonly={readonly}
      projectId={projectId}
      comments={comments}
      onEdit={onEdit}
      onDelete={onDelete}
      onUpdateComponent={onUpdateComponent}
      isLoading={isLoading}
      currentUser={currentUser}
      clientName={clientName}
    />
  );
}

function ViewMode({
  component,
  readonly,
  projectId,
  comments,
  onEdit,
  onDelete,
  onUpdateComponent,
  isLoading = false,
  currentUser,
  clientName
}: {
  component: StageComponent;
  readonly: boolean;
  projectId: string;
  comments: CommentEntry[];
  onEdit: () => void;
  onDelete: () => void;
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
  isLoading?: boolean;
  currentUser?: { id: string; role: 'provider' | 'client' } | null;
  clientName?: string;
}) {
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'upload_request': return Paperclip;
      case 'checklist': return CheckSquare;
      case 'approval': return CheckCircle2;
      case 'text_block': return FileText;
      case 'link': return Link;
      default: return Target;
    }
  };

  const getComponentTitle = (component: StageComponent) => {
    if (component.title) {
      return component.title;
    }
    // Fallback to type-based title
    switch (component.component_type) {
      case 'upload_request': return 'Solicitud de Enlaces';
      case 'checklist': return 'Lista de Verificación';
      case 'approval': return 'Solicitud de Aprobación';
      case 'text_block': return 'Nota';
      case 'link': return 'Enlace';
      case 'milestone': return 'Hito';
      case 'tasklist': return 'Lista de Tareas';
      case 'prototype': return 'Prototipo';
      default: return 'Componente';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo': return 'Por hacer';
      case 'in_progress': return 'En progreso';
      case 'waiting_client': return 'Esperando cliente';
      case 'in_review': return 'En revisión';
      case 'approved': return 'Aprobado';
      case 'blocked': return 'Bloqueado';
      case 'done': return 'Completado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return Target;
      case 'in_progress': return Play;
      case 'waiting_client': return Clock;
      case 'in_review': return Eye;
      case 'approved': return CheckCircle2;
      case 'blocked': return AlertCircle;
      case 'done': return CheckCircle2;
      default: return Target;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'outline';
      case 'in_progress': return 'default';
      case 'waiting_client': return 'warning';
      case 'in_review': return 'secondary';
      case 'approved': return 'success';
      case 'blocked': return 'destructive';
      case 'done': return 'success';
      default: return 'outline';
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (readonly || !onUpdateComponent) return;
    onUpdateComponent(component.id, { status: newStatus as StageComponent['status'] });
  };

  const ComponentIcon = getComponentIcon(component.component_type);
  const StatusIcon = getStatusIcon(component.status);

  return (
    <motion.div
      layout
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`group rounded-xl border border-border/50 bg-gradient-to-br from-white to-gray-50/30 p-4 transition-all duration-300 ${
        isLoading ? 'opacity-70 pointer-events-none' : 'hover:shadow-lg'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Icono del componente */}
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg shadow-sm ${
            component.status === 'done'
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : component.status === 'waiting_client'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600'
              : component.status === 'blocked'
              ? 'bg-gradient-to-r from-red-500 to-red-600'
              : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}>
            <ComponentIcon className="h-3 w-3 text-white" />
          </div>

          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-foreground">
              {getComponentTitle(component)}
            </h4>
            {readonly ? (
              <Badge variant={getStatusColor(component.status)} className="text-xs shadow-sm">
                <StatusIcon className="h-3 w-3 mr-1" />
                {getStatusText(component.status)}
              </Badge>
            ) : (
              <Select value={component.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-6 w-auto min-w-[100px] text-xs shadow-sm bg-white/80">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border/50 shadow-xl">
                  <SelectItem value="todo">
                    Por hacer
                  </SelectItem>
                  <SelectItem value="in_progress">
                    En progreso
                  </SelectItem>
                  <SelectItem value="waiting_client">
                    Esperando cliente
                  </SelectItem>
                  <SelectItem value="in_review">
                    En revisión
                  </SelectItem>
                  <SelectItem value="approved">
                    Aprobado
                  </SelectItem>
                  <SelectItem value="blocked">
                    Bloqueado
                  </SelectItem>
                  <SelectItem value="done">
                    Completado
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        {!readonly && (
          <motion.div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
            animate={{ opacity: isLoading ? 0 : undefined }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                disabled={isLoading}
                className="h-7 w-7 p-0 hover:bg-blue-100/50 hover:text-blue-700 transition-all duration-200"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isLoading}
                className="h-7 w-7 p-0 hover:bg-red-100/50 hover:text-red-700 transition-all duration-200"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>

      <ComponentContent component={component} />

      {/* URL Submission for upload_request components */}
      {component.component_type === 'upload_request' && !readonly && (
        <URLSubmissionForm
          component={component}
          onUpdateComponent={onUpdateComponent}
        />
      )}

      <ComponentCommentThread
        componentId={component.id}
        componentTitle={getComponentTitle(component)}
        projectId={projectId}
        comments={comments}
        isCompact={true}
        currentUser={currentUser}
        clientName={clientName || undefined}
      />
    </motion.div>
  );
}

function EditMode({
  component,
  editData,
  onDataChange,
  onSave,
  onCancel
}: {
  component: StageComponent;
  editData: any;
  onDataChange: (data: any) => void;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editData);
    } finally {
      setIsSaving(false);
    }
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'upload_request': return Paperclip;
      case 'checklist': return CheckSquare;
      case 'approval': return CheckCircle2;
      case 'text_block': return FileText;
      case 'link': return Link;
      default: return Target;
    }
  };

  const ComponentIcon = getComponentIcon(component.component_type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-brand-200/50 bg-gradient-to-br from-brand-50/50 to-white shadow-lg p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 shadow-sm">
            <ComponentIcon className="h-3 w-3 text-white" />
          </div>
          <Badge variant="outline" className="text-xs shadow-sm bg-white/80">
            <Edit className="h-3 w-3 mr-1" />
            Editando {component.component_type}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSaving}
              className="h-7 hover:bg-red-100/50 hover:text-red-700 transition-colors duration-200"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: isSaving ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-7 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-sm transition-all duration-200"
            >
              <LoadingButton
                isLoading={isSaving}
                loadingText="Guardando..."
                variant="default"
                size="sm"
              >
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Guardar
                </>
              </LoadingButton>
            </Button>
          </motion.div>
        </div>
      </div>

      <ComponentEditor
        component={component}
        data={editData}
        onChange={onDataChange}
      />
    </motion.div>
  );
}

function ComponentContent({ component }: { component: StageComponent }) {
  switch (component.component_type) {
    case 'text_block':
      return (
        <div className="space-y-2">
          <RichTextViewer
            content={(component.config?.content as string) || 'Sin contenido'}
            className="text-sm text-foreground"
          />
        </div>
      );

    case 'upload_request':
      return (
        <div className="space-y-2">
          <RichTextViewer
            content={(component.config?.description as string) || 'Solicitud de enlaces'}
            className="text-sm text-muted-foreground"
          />
          {(component.config?.submitted_urls as string[])?.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Enlaces enviados:</p>
              {(component.config?.submitted_urls as string[]).map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-brand-600 hover:text-brand-700 underline truncate"
                >
                  {url}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sin enlaces enviados aún
            </p>
          )}
        </div>
      );

    case 'checklist':
      return (
        <DynamicChecklist
          initialItems={(component.config?.items as string[] | ChecklistItem[]) || []}
          readonly={true}
          className="text-sm"
        />
      );

    case 'approval':
      return (
        <div className="space-y-2">
          <RichTextViewer
            content={(component.config?.description as string) || (component.config?.instructions as string) || 'Solicitud de aprobación'}
            className="text-sm text-foreground"
          />
          {component.config?.url && (
            <a
              href={component.config.url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 underline"
            >
              <ExternalLink className="h-3 w-3" />
              Ver material
            </a>
          )}
          <p className="text-xs text-muted-foreground">
            Estado: {component.status}
          </p>
        </div>
      );

    case 'link':
      return (
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            {(component.config?.label as string) || 'Enlace externo'}
          </p>
          {(() => {
            const description = component.config?.description;
            if (description && typeof description === 'string') {
              return (
                <ExpandableText
                  content={description}
                  maxLength={100}
                  className="text-xs text-muted-foreground"
                />
              );
            }
            return null;
          })()}
          <a
            href={component.config?.url as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-600 hover:text-brand-700 underline"
          >
            {component.config?.url as string}
          </a>
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Tipo de componente no reconocido: {component.component_type}</p>
          <p className="text-xs text-muted-foreground">
            Este tipo de componente puede requerir una actualización de la aplicación.
          </p>
        </div>
      );
  }
}

// Separate TitleField component to prevent re-creation on each render
const TitleField = memo(function TitleField({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1 block">
        Título
      </label>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
});

const ComponentEditor = memo(function ComponentEditor({
  component,
  data,
  onChange
}: {
  component: StageComponent;
  data: any;
  onChange: (data: any) => void;
}) {
  const updateField = useCallback((field: string, value: any) => {
    onChange({ ...data, [field]: value });
  }, [data, onChange]);

  const getDefaultTitle = (type: string) => {
    switch (type) {
      case 'upload_request': return 'Solicitud de Enlaces';
      case 'checklist': return 'Lista de Verificación';
      case 'approval': return 'Solicitud de Aprobación';
      case 'text_block': return 'Nota';
      case 'link': return 'Enlace';
      case 'milestone': return 'Hito';
      case 'tasklist': return 'Lista de Tareas';
      case 'prototype': return 'Prototipo';
      default: return 'Componente';
    }
  };

  switch (component.component_type) {
    case 'text_block':
      return (
        <div className="space-y-3">
          <TitleField
            value={data.title}
            onChange={(value) => updateField('title', value)}
            placeholder={getDefaultTitle(component.component_type)}
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Contenido
            </label>
            <RichTextEditor
              value={data.content || ''}
              onChange={(value) => updateField('content', value)}
              placeholder="Escribe el contenido de la nota..."
              mode="full"
              maxLength={10000}
            />
          </div>
        </div>
      );

    case 'upload_request':
      return (
        <div className="space-y-3">
          <TitleField
            value={data.title}
            onChange={(value) => updateField('title', value)}
            placeholder={getDefaultTitle(component.component_type)}
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Descripción
            </label>
            <RichTextEditor
              value={data.description || ''}
              onChange={(value) => updateField('description', value)}
              placeholder="Describe qué enlaces necesitas (ej: enlaces de Google Drive, Dropbox, etc.)..."
              mode="full"
              maxLength={10000}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Instrucciones adicionales
            </label>
            <Input
              value={data.instructions || ''}
              onChange={(e) => updateField('instructions', e.target.value)}
              placeholder="Instrucciones para compartir enlaces..."
            />
          </div>
        </div>
      );

    case 'checklist':
      return (
        <div className="space-y-3">
          <TitleField
            value={data.title}
            onChange={(value) => updateField('title', value)}
            placeholder={getDefaultTitle(component.component_type)}
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Items de la lista
            </label>
            <DynamicChecklist
              initialItems={(data.items as string[] | ChecklistItem[]) || []}
              readonly={false}
              onUpdate={(items) => updateField('items', items)}
              className="text-sm"
            />
          </div>
        </div>
      );

    case 'approval':
      return (
        <div className="space-y-3">
          <TitleField
            value={data.title}
            onChange={(value) => updateField('title', value)}
            placeholder={getDefaultTitle(component.component_type)}
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Descripción
            </label>
            <RichTextEditor
              value={data.description || data.instructions || ''}
              onChange={(value) => updateField('description', value)}
              placeholder="Describe qué necesita ser aprobado..."
              mode="full"
              maxLength={10000}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Link del material (opcional)
            </label>
            <Input
              value={data.url || ''}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="https://figma.com/..."
              type="url"
            />
          </div>
        </div>
      );

    case 'link':
      return (
        <div className="space-y-3">
          <TitleField
            value={data.title}
            onChange={(value) => updateField('title', value)}
            placeholder={getDefaultTitle(component.component_type)}
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Etiqueta del enlace
            </label>
            <Input
              value={data.label || ''}
              onChange={(e) => updateField('label', e.target.value)}
              placeholder="Nombre del enlace"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              URL
            </label>
            <Input
              value={data.url || ''}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Editor no disponible para el tipo: {component.component_type}
          </p>
          <p className="text-xs text-muted-foreground">
            Puedes eliminar este componente si ya no lo necesitas.
          </p>
        </div>
      );
  }
});

interface URLSubmissionFormProps {
  component: StageComponent;
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
}

function URLSubmissionForm({ component, onUpdateComponent }: URLSubmissionFormProps) {
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitUrl = async () => {
    if (!newUrl.trim() || !onUpdateComponent) return;

    setIsSubmitting(true);
    try {
      const currentUrls = (component.config?.submitted_urls as string[]) || [];
      const updatedUrls = [...currentUrls, newUrl.trim()];

      await onUpdateComponent(component.id, {
        config: {
          ...component.config,
          submitted_urls: updatedUrls
        }
      });

      setNewUrl('');
    } catch (error) {
      console.error('Error submitting URL:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitUrl();
    }
  };

  return (
    <div className="mt-3 p-3 bg-brand-50/50 rounded-lg border border-brand-200/50">
      <label className="text-xs font-medium text-brand-700 mb-2 block">
        Enviar enlace
      </label>
      <div className="flex gap-2">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://drive.google.com/..."
          className="flex-1 text-sm"
          disabled={isSubmitting}
        />
        <Button
          onClick={handleSubmitUrl}
          disabled={!newUrl.trim() || isSubmitting}
          size="sm"
          className="px-3"
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}