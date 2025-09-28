'use client';

import { useState } from 'react';
import type { StageComponent, CommentEntry } from '@/types/project';
import type { ChecklistItem } from '@/components/client/dynamic-checklist';
import { ComponentCommentThread } from '@/components/shared/component-comment-thread';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextViewer } from '@/components/ui/rich-text-viewer';
import { ExpandableText } from '@/components/ui/expandable-text';
import { DynamicChecklist } from '@/components/client/dynamic-checklist';
import { Send, Link, CheckSquare, CheckCircle2, FileText, ExternalLink, CalendarCheck, ListTodo, PenTool, ShieldCheck } from 'lucide-react';

interface ClientStageComponentsProps {
  components: StageComponent[];
  projectId: string;
  comments: CommentEntry[];
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
  currentUser?: { id: string; role: 'provider' | 'client' } | null;
  clientName?: string;
  providerName?: string;
}

export function ClientStageComponents({
  components,
  projectId,
  comments,
  onUpdateComponent,
  currentUser,
  clientName,
  providerName
}: ClientStageComponentsProps) {

  if (!components || components.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <FileText className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No hay componentes en esta etapa</p>
        <p className="text-xs text-muted-foreground mt-1">
          Tu proveedor aún no ha agregado contenido a esta etapa
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {components.map((component) => (
        <ClientComponentCard
          key={component.id}
          component={component}
          projectId={projectId}
          comments={comments}
          onUpdateComponent={onUpdateComponent}
          currentUser={currentUser}
          clientName={clientName}
          providerName={providerName}
        />
      ))}
    </div>
  );
}

interface ClientComponentCardProps {
  component: StageComponent;
  projectId: string;
  comments: CommentEntry[];
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
  currentUser?: { id: string; role: 'provider' | 'client' } | null;
  clientName?: string;
  providerName?: string;
}

function ClientComponentCard({
  component,
  projectId,
  comments,
  onUpdateComponent,
  currentUser,
  clientName,
  providerName
}: ClientComponentCardProps) {
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

  const ComponentIcon = getComponentIcon(component.component_type);

  return (
    <div className="group rounded-xl border border-border/50 bg-gradient-to-br from-white to-gray-50/30 p-4 hover:shadow-lg transition-all duration-300 mobile-safe-container">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1 mobile-flex-safe">
          {/* Icono del componente */}
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg shadow-sm flex-shrink-0 ${
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

          <div className="flex items-center gap-2 min-w-0 flex-1 mobile-flex-safe">
            <h4 className="text-sm font-medium text-foreground mobile-text-safe flex-1">
              {getComponentTitle(component)}
            </h4>
            <Badge variant={getStatusColor(component.status)} className="text-xs shadow-sm flex-shrink-0">
              <span className="hidden sm:inline">{getStatusText(component.status)}</span>
              <span className="sm:hidden">{getStatusText(component.status).slice(0, 4)}</span>
            </Badge>
          </div>
        </div>
      </div>

      <ComponentContent component={component} onUpdateComponent={onUpdateComponent} />

      {/* URL Submission for upload_request components */}
      {component.component_type === 'upload_request' && (
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
        clientName={clientName}
        providerName={providerName}
      />
    </div>
  );
}

function ComponentContent({
  component,
  onUpdateComponent
}: {
  component: StageComponent;
  onUpdateComponent?: (componentId: string, updates: Partial<StageComponent>) => void;
}) {
  switch (component.component_type) {
    case 'text_block':
      return (
        <div className="space-y-2 stage-component-content">
          <RichTextViewer
            content={(component.config?.content as string) || 'Sin contenido'}
            className="text-sm text-foreground mobile-text-safe"
          />
        </div>
      );

    case 'upload_request':
      return (
        <div className="space-y-2 stage-component-content">
          <RichTextViewer
            content={(component.config?.description as string) || 'Solicitud de enlaces'}
            className="text-sm text-muted-foreground mobile-text-safe"
          />
          {(component.config?.submitted_urls as string[])?.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground mobile-text-safe">Enlaces enviados:</p>
              {(component.config?.submitted_urls as string[]).map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-brand-600 hover:text-brand-700 underline mobile-text-safe"
                >
                  {url}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mobile-text-safe">
              Sin enlaces enviados aún
            </p>
          )}
        </div>
      );

    case 'checklist':
      return (
        <div className="space-y-2 stage-component-content">
          <p className="text-sm font-medium text-foreground mobile-text-safe">Lista de verificación:</p>
          <DynamicChecklist
            initialItems={(component.config?.items as string[] | ChecklistItem[]) || []}
            readonly={true}
            className="text-sm mobile-text-safe"
          />
        </div>
      );

    case 'approval':
      return (
        <div className="space-y-2 stage-component-content">
          <RichTextViewer
            content={(component.config?.instructions as string) || 'Solicitud de aprobación'}
            className="text-sm text-foreground mobile-text-safe"
          />
        </div>
      );

    case 'link':
      return (
        <div className="space-y-2 stage-component-content">
          <p className="text-sm text-foreground mobile-text-safe">
            {(component.config?.label as string) || 'Enlace externo'}
          </p>
          {(() => {
            const description = component.config?.description;
            if (description && typeof description === 'string') {
              return (
                <ExpandableText
                  content={description}
                  maxLength={100}
                  className="text-xs text-muted-foreground mobile-text-safe"
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

    case 'prototype':
      return (
        <div className="space-y-2">
          <RichTextViewer
            content={(component.config?.description as string) || 'Prototipo listo para revisión'}
            className="text-sm text-foreground"
          />
          {component.config?.url ? (
            <a
              href={String(component.config.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-600 hover:text-brand-700 underline"
            >
              Ver prototipo
            </a>
          ) : null}
        </div>
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

    case 'tasklist':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Lista de tareas:</p>
          <DynamicChecklist
            initialItems={(component.config?.items as string[] | ChecklistItem[]) || []}
            readonly={true}
            className="text-sm"
          />
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

