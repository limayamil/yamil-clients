'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import type { StageComponent, CommentEntry } from '@/types/project';
import type { ChecklistItem } from '@/components/client/dynamic-checklist';
import { ComponentCommentThread } from '@/components/shared/component-comment-thread';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextViewer } from '@/components/ui/rich-text-viewer';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { DynamicChecklist } from '@/components/client/dynamic-checklist';
import {
  Send,
  Link,
  CheckSquare,
  CheckCircle2,
  FileText,
  ExternalLink,
  CalendarCheck,
  ListTodo,
  PenTool,
  ShieldCheck,
  Edit,
  Save,
  X,
  Trash2,
  GripVertical
} from 'lucide-react';

interface ProviderStageComponentsProps {
  components: StageComponent[];
  projectId: string;
  stageId: string;
  comments: CommentEntry[];
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
  onDeleteComponent?: (componentId: string) => void;
  onReorderComponents?: (componentIds: string[]) => void;
  currentUser?: { id: string; role: 'provider' | 'client' } | null;
  clientName?: string;
  providerName?: string;
}

export function ProviderStageComponents({
  components,
  projectId,
  stageId,
  comments,
  onUpdateComponent,
  onDeleteComponent,
  onReorderComponents,
  currentUser,
  clientName,
  providerName
}: ProviderStageComponentsProps) {
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [orderedComponents, setOrderedComponents] = useState(components);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = orderedComponents.findIndex((component) => component.id === active.id);
      const newIndex = orderedComponents.findIndex((component) => component.id === over?.id);

      const newOrderedComponents = arrayMove(orderedComponents, oldIndex, newIndex);
      setOrderedComponents(newOrderedComponents);

      // Call the reorder callback with the new order
      if (onReorderComponents) {
        onReorderComponents(newOrderedComponents.map(c => c.id));
      }
    }
  };

  // Update ordered components when props change
  React.useEffect(() => {
    setOrderedComponents(components);
  }, [components]);

  if (!components || components.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <FileText className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No hay componentes en esta etapa</p>
        <p className="text-xs text-muted-foreground mt-1">
          Agrega componentes usando el menú de la etapa
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={orderedComponents.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {orderedComponents.map((component) => (
            <SortableProviderComponentCard
              key={component.id}
              component={component}
              projectId={projectId}
              comments={comments}
              isEditing={editingComponent === component.id}
              onEdit={() => setEditingComponent(component.id)}
              onCancelEdit={() => setEditingComponent(null)}
              onUpdateComponent={onUpdateComponent}
              onDeleteComponent={onDeleteComponent}
              currentUser={currentUser}
              clientName={clientName}
              providerName={providerName}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface ProviderComponentCardProps {
  component: StageComponent;
  projectId: string;
  comments: CommentEntry[];
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
  onDeleteComponent?: (componentId: string) => void;
  currentUser?: { id: string; role: 'provider' | 'client' } | null;
  clientName?: string;
  providerName?: string;
}

function ProviderComponentCard({
  component,
  projectId,
  comments,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdateComponent,
  onDeleteComponent,
  currentUser,
  clientName,
  providerName
}: ProviderComponentCardProps) {
  const [editData, setEditData] = useState({
    title: component.title || '',
    ...component.config
  });

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'upload_request': return Link;
      case 'checklist': return CheckSquare;
      case 'approval': return CheckCircle2;
      case 'text_block': return FileText;
      case 'link': return ExternalLink;
      case 'milestone': return CalendarCheck;
      case 'tasklist': return ListTodo;
      case 'prototype': return PenTool;
      default: return FileText;
    }
  };

  const getComponentTitle = (component: StageComponent) => {
    if (component.title) {
      return component.title;
    }
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

  const handleSave = async () => {
    if (!onUpdateComponent) return;

    const { title, ...configData } = editData;
    await onUpdateComponent(component.id, {
      title: title || null,
      config: configData
    });
    onCancelEdit();
  };

  const handleDelete = async () => {
    if (!onDeleteComponent) return;
    if (confirm('¿Estás seguro de que quieres eliminar este componente?')) {
      await onDeleteComponent(component.id);
    }
  };

  const ComponentIcon = getComponentIcon(component.component_type);

  return (
    <div className="group rounded-xl border border-border/50 bg-gradient-to-br from-white to-gray-50/30 p-4 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
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
          <div>
            <h4 className="text-sm font-medium text-foreground">
              {getComponentTitle(component)}
            </h4>
            <Badge variant="outline" className="text-xs mt-1">
              {component.component_type}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-7 w-7 p-0 hover:bg-blue-100/50 hover:text-blue-700"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-7 w-7 p-0 hover:bg-red-100/50 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelEdit}
                className="h-7 w-7 p-0 hover:bg-red-100/50 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className="h-7 w-7 p-0 hover:bg-green-100/50 hover:text-green-700"
              >
                <Save className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <ProviderComponentEditor
          component={component}
          editData={editData}
          onDataChange={setEditData}
        />
      ) : (
        <ProviderComponentContent component={component} />
      )}

      <div className="mt-4">
        <ComponentCommentThread
          componentId={component.id}
          componentTitle={getComponentTitle(component)}
          projectId={projectId}
          comments={comments}
          isCompact={true}
          currentUser={currentUser}
          clientName={clientName}
          providerName={providerName}
        />
      </div>
    </div>
  );
}

function ProviderComponentContent({ component }: { component: StageComponent }) {
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
          {(component.config?.submitted_urls as string[])?.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Enlaces recibidos:</p>
              {(component.config.submitted_urls as string[]).map((url, index) => (
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
          )}
        </div>
      );

    case 'approval':
      return (
        <div className="space-y-2">
          <RichTextViewer
            content={(component.config?.instructions as string) || 'Solicitud de aprobación'}
            className="text-sm text-foreground"
          />
          <Badge variant="outline">
            Estado: {component.status}
          </Badge>
        </div>
      );

    case 'prototype':
      return (
        <div className="space-y-2">
          <RichTextViewer
            content={(component.config?.description as string) || 'Prototipo listo para revisión'}
            className="text-sm text-foreground"
          />
          {component.config?.url ? (
            <a
              href={component.config.url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 underline"
            >
              <ExternalLink className="h-3 w-3" />
              Ver prototipo
            </a>
          ) : null}
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

    case 'tasklist':
      return (
        <DynamicChecklist
          initialItems={(component.config?.items as string[] | ChecklistItem[]) || []}
          readonly={true}
          className="text-sm"
        />
      );

    case 'milestone':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {(component.config?.title as string) || 'Hito'}
          </p>
          <RichTextViewer
            content={(component.config?.description as string) || 'Hito entregable'}
            className="text-xs text-muted-foreground"
          />
        </div>
      );

    case 'link':
      return (
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            {(component.config?.label as string) || 'Enlace externo'}
          </p>
          {component.config?.url ? (
            <a
              href={component.config.url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-600 hover:text-brand-700 underline"
            >
              {component.config.url as string}
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">Sin URL definida</p>
          )}
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Tipo: {component.component_type}
          </p>
        </div>
      );
  }
}

function ProviderComponentEditor({
  component,
  editData,
  onDataChange
}: {
  component: StageComponent;
  editData: any;
  onDataChange: (data: any) => void
}) {
  const updateField = (field: string, value: any) => {
    onDataChange({ ...editData, [field]: value });
  };

  return (
    <div className="space-y-4 p-4 border border-dashed border-brand-200 rounded-lg bg-brand-50/20">
      {/* Title field for all components */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Título personalizado (opcional)
        </label>
        <Input
          value={editData.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Título del componente"
        />
      </div>

      {/* Component-specific fields */}
      {component.component_type === 'text_block' && (
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Contenido
          </label>
          <RichTextEditor
            value={editData.content || ''}
            onChange={(value) => updateField('content', value)}
            placeholder="Escribe el contenido..."
            mode="full"
            maxLength={10000}
          />
        </div>
      )}

      {component.component_type === 'upload_request' && (
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Descripción
          </label>
          <RichTextEditor
            value={editData.description || ''}
            onChange={(value) => updateField('description', value)}
            placeholder="Describe qué enlaces necesitas..."
            mode="full"
            maxLength={10000}
          />
        </div>
      )}

      {component.component_type === 'approval' && (
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Instrucciones para la aprobación
          </label>
          <RichTextEditor
            value={editData.instructions || ''}
            onChange={(value) => updateField('instructions', value)}
            placeholder="Describe qué necesita ser aprobado..."
            mode="full"
            maxLength={10000}
          />
        </div>
      )}

      {component.component_type === 'prototype' && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Descripción
            </label>
            <RichTextEditor
              value={editData.description || ''}
              onChange={(value) => updateField('description', value)}
              placeholder="Describe el prototipo..."
              mode="full"
              maxLength={10000}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              URL del prototipo
            </label>
            <Input
              value={editData.url || ''}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>
        </>
      )}

      {component.component_type === 'checklist' && (
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Elementos de la lista
          </label>
          <DynamicChecklist
            initialItems={(editData.items as string[] | ChecklistItem[]) || []}
            readonly={false}
            onUpdate={(items) => updateField('items', items)}
            className="text-sm"
          />
        </div>
      )}

      {component.component_type === 'tasklist' && (
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Tareas de la lista
          </label>
          <DynamicChecklist
            initialItems={(editData.items as string[] | ChecklistItem[]) || []}
            readonly={false}
            onUpdate={(items) => updateField('items', items)}
            className="text-sm"
          />
        </div>
      )}

      {component.component_type === 'milestone' && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Título del hito
            </label>
            <Input
              value={editData.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Nombre del hito"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Descripción
            </label>
            <RichTextEditor
              value={editData.description || ''}
              onChange={(value) => updateField('description', value)}
              placeholder="Describe el hito..."
              mode="full"
              maxLength={10000}
            />
          </div>
        </>
      )}

      {component.component_type === 'link' && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Etiqueta del enlace
            </label>
            <Input
              value={editData.label || ''}
              onChange={(e) => updateField('label', e.target.value)}
              placeholder="Nombre del enlace"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              URL
            </label>
            <Input
              value={editData.url || ''}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>
        </>
      )}
    </div>
  );
}

// Sortable wrapper for ProviderComponentCard
function SortableProviderComponentCard(props: ProviderComponentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <ProviderComponentCard {...props} />
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </div>
    </div>
  );
}