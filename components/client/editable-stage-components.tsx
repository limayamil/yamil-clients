'use client';

import { useState } from 'react';
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
  Target
} from 'lucide-react';
import type { StageComponent } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicChecklist } from '@/components/client/dynamic-checklist';

interface EditableStageComponentsProps {
  components: StageComponent[];
  stageId: string;
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
  onDeleteComponent?: (componentId: string) => void;
  onAddComponent?: (stageId: string, component: Omit<StageComponent, 'id' | 'stage_id'>) => void;
  readonly?: boolean;
}

export function EditableStageComponents({
  components,
  stageId,
  onUpdateComponent,
  onDeleteComponent,
  onAddComponent,
  readonly = false
}: EditableStageComponentsProps) {
  const [editingComponent, setEditingComponent] = useState<string | null>(null);

  const handleEdit = (componentId: string) => {
    if (readonly) return;
    setEditingComponent(componentId);
  };

  const handleSave = (component: StageComponent, updates: any) => {
    onUpdateComponent?.(component.id, { ...component, config: { ...component.config, ...updates } });
    setEditingComponent(null);
  };

  const handleCancel = () => {
    setEditingComponent(null);
  };

  const handleDelete = (componentId: string) => {
    if (readonly) return;
    onDeleteComponent?.(componentId);
  };

  return (
    <div className="space-y-4">
      {components.map((component) => (
        <EditableComponentCard
          key={component.id}
          component={component}
          isEditing={editingComponent === component.id}
          readonly={readonly}
          onEdit={() => handleEdit(component.id)}
          onSave={(updates) => handleSave(component, updates)}
          onCancel={handleCancel}
          onDelete={() => handleDelete(component.id)}
          onUpdateComponent={onUpdateComponent}
        />
      ))}

      {components.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <Plus className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No hay componentes en esta etapa</p>
          <p className="text-xs text-muted-foreground mt-1">
            Usa las opciones de la etapa para agregar contenido
          </p>
        </div>
      )}
    </div>
  );
}

interface EditableComponentCardProps {
  component: StageComponent;
  isEditing: boolean;
  readonly: boolean;
  onEdit: () => void;
  onSave: (updates: any) => void;
  onCancel: () => void;
  onDelete: () => void;
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
}

function EditableComponentCard({
  component,
  isEditing,
  readonly,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onUpdateComponent
}: EditableComponentCardProps) {
  const [editData, setEditData] = useState<any>(component.config);

  const handleSave = () => {
    onSave(editData);
  };

  const handleCancel = () => {
    setEditData(component.config);
    onCancel();
  };

  if (isEditing) {
    return (
      <EditMode
        component={component}
        editData={editData}
        onDataChange={setEditData}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <ViewMode
      component={component}
      readonly={readonly}
      onEdit={onEdit}
      onDelete={onDelete}
      onUpdateComponent={onUpdateComponent}
    />
  );
}

function ViewMode({
  component,
  readonly,
  onEdit,
  onDelete,
  onUpdateComponent
}: {
  component: StageComponent;
  readonly: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
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

  const getComponentTitle = (type: string) => {
    switch (type) {
      case 'upload_request': return 'Solicitud de Archivos';
      case 'checklist': return 'Lista de Verificación';
      case 'approval': return 'Solicitud de Aprobación';
      case 'text_block': return 'Nota/Descripción';
      case 'link': return 'Enlace Externo';
      default: return 'Componente';
    }
  };

  const getStatusText = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return Target;
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
      case 'waiting_client': return 'warning';
      case 'in_review': return 'secondary';
      case 'approved': return 'default';
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
    <div className="group rounded-xl border border-border/50 bg-gradient-to-br from-white to-gray-50/30 p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
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
            <Badge variant="outline" className="text-xs shadow-sm bg-white/80">
              {getComponentTitle(component.component_type)}
            </Badge>
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
                  <SelectItem value="todo" className="gap-2">
                    <Target className="h-3 w-3" />
                    Por hacer
                  </SelectItem>
                  <SelectItem value="waiting_client" className="gap-2">
                    <Clock className="h-3 w-3" />
                    Esperando cliente
                  </SelectItem>
                  <SelectItem value="in_review" className="gap-2">
                    <Eye className="h-3 w-3" />
                    En revisión
                  </SelectItem>
                  <SelectItem value="approved" className="gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Aprobado
                  </SelectItem>
                  <SelectItem value="blocked" className="gap-2">
                    <AlertCircle className="h-3 w-3" />
                    Bloqueado
                  </SelectItem>
                  <SelectItem value="done" className="gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Completado
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        {!readonly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-7 w-7 p-0 hover:bg-blue-100/50 hover:text-blue-700 hover:scale-105 transition-all duration-200"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-7 w-7 p-0 hover:bg-red-100/50 hover:text-red-700 hover:scale-105 transition-all duration-200"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <ComponentContent component={component} />
    </div>
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
  onSave: () => void;
  onCancel: () => void;
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

  const ComponentIcon = getComponentIcon(component.component_type);

  return (
    <div className="rounded-xl border border-brand-200/50 bg-gradient-to-br from-brand-50/50 to-white shadow-lg p-4">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 hover:bg-red-100/50 hover:text-red-700 transition-colors duration-200"
          >
            <X className="h-3 w-3 mr-1" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            className="h-7 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-sm transition-all duration-200 hover:scale-105"
          >
            <Save className="h-3 w-3 mr-1" />
            Guardar
          </Button>
        </div>
      </div>

      <ComponentEditor
        component={component}
        data={editData}
        onChange={onDataChange}
      />
    </div>
  );
}

function ComponentContent({ component }: { component: StageComponent }) {
  switch (component.component_type) {
    case 'text_block':
      return (
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            {(component.config?.content as string) || 'Sin contenido'}
          </p>
        </div>
      );

    case 'upload_request':
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {(component.config?.description as string) || 'Solicitud de archivos'}
          </p>
          <p className="text-xs text-muted-foreground">
            Tipos permitidos: {(component.config?.allowed_types as string[])?.join(', ') || 'Todos'}
          </p>
        </div>
      );

    case 'checklist':
      return (
        <DynamicChecklist
          initialItems={(component.config?.items as string[]) || []}
          readonly={true}
          className="text-sm"
        />
      );

    case 'approval':
      return (
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            {(component.config?.instructions as string) || 'Solicitud de aprobación'}
          </p>
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

function ComponentEditor({
  component,
  data,
  onChange
}: {
  component: StageComponent;
  data: any;
  onChange: (data: any) => void;
}) {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  switch (component.component_type) {
    case 'text_block':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Contenido
            </label>
            <Textarea
              value={data.content || ''}
              onChange={(e) => updateField('content', e.target.value)}
              placeholder="Escribe el contenido de la nota..."
              rows={4}
            />
          </div>
        </div>
      );

    case 'upload_request':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Descripción
            </label>
            <Textarea
              value={data.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe qué archivos necesitas..."
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Tipos de archivo permitidos (separados por coma)
            </label>
            <Input
              value={data.allowed_types?.join(', ') || ''}
              onChange={(e) => updateField('allowed_types', e.target.value.split(',').map((t: string) => t.trim()))}
              placeholder="pdf, jpg, png, docx"
            />
          </div>
        </div>
      );

    case 'checklist':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Items de la lista
            </label>
            <DynamicChecklist
              initialItems={(data.items as string[]) || []}
              readonly={false}
              onUpdate={(items) => updateField('items', items.map(item => item.text))}
              className="text-sm"
            />
          </div>
        </div>
      );

    case 'approval':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Instrucciones para la aprobación
            </label>
            <Textarea
              value={data.instructions || ''}
              onChange={(e) => updateField('instructions', e.target.value)}
              placeholder="Describe qué necesita ser aprobado..."
              rows={3}
            />
          </div>
        </div>
      );

    case 'link':
      return (
        <div className="space-y-3">
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
}