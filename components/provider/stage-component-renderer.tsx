'use client';

import { Upload, CheckSquare, PenTool, ShieldCheck, FileText, ExternalLink, CalendarCheck, ListTodo, Link } from 'lucide-react';
import type { Stage, CommentEntry } from '@/types/project';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ComponentCommentThread } from '@/components/shared/component-comment-thread';
import { RichTextViewer } from '@/components/ui/rich-text-viewer';
import { ExpandableText } from '@/components/ui/expandable-text';
import { DynamicChecklist } from '@/components/client/dynamic-checklist';
import type { ChecklistItem } from '@/components/client/dynamic-checklist';
import { isFeatureEnabled } from '@/lib/config/feature-flags';

interface StageComponentRendererProps {
  stage: Stage;
  projectId: string;
  comments: CommentEntry[];
  currentUser?: { id: string; role: 'provider' | 'client' } | null;
  clientName?: string;
  providerName?: string;
}

export function StageComponentRenderer({ stage, projectId, comments, currentUser, clientName, providerName }: StageComponentRendererProps) {
  console.log('🎭 [Provider] StageComponentRenderer for stage', stage.id, ':', {
    stageTitle: stage.title,
    hasComponents: !!stage.components,
    componentsLength: stage.components?.length || 0,
    components: stage.components?.map(c => ({ id: c.id, type: c.component_type, title: c.title })) || []
  });

  if (!stage.components || stage.components.length === 0) {
    console.log('🎭 [Provider] No components found for stage', stage.id);
    return <p className="text-sm text-muted-foreground">No components configured.</p>;
  }

  const getComponentTitle = (component: any): string => {
    switch (component.component_type) {
      case 'upload_request':
        return 'Link request';
      case 'checklist':
        return 'Checklist';
      case 'prototype':
        return 'Prototype';
      case 'approval':
        return 'Approval gate';
      case 'text_block':
        return 'Brief';
      case 'link':
        return (component.config?.label as string) ?? 'External link';
      case 'milestone':
        return (component.config?.title as string) ?? 'Milestone';
      case 'tasklist':
        return 'Task list';
      default:
        return 'Componente';
    }
  };

  return (
    <div className="space-y-4">
      {stage.components.map((component) => {
        if (component.metadata && 'featureFlag' in component.metadata) {
          const feature = component.metadata.featureFlag as 'prototype' | 'tasklist' | 'milestone';
          if (!isFeatureEnabled(feature)) {
            return null;
          }
        }
        switch (component.component_type) {
          case 'upload_request':
            return (
              <div key={component.id} className="space-y-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-brand-800">
                  <Link className="h-4 w-4" /> Link request
                </div>
                <RichTextViewer
                  content={(component.config?.description as string) ?? 'Client needs to share links.'}
                  className="text-xs text-muted-foreground"
                />
                {(component.config?.submitted_urls as string[])?.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-brand-700">Enlaces recibidos:</p>
                    <div className="space-y-1">
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
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin enlaces recibidos aún</p>
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
          case 'checklist':
            return (
              <div key={component.id} className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckSquare className="h-4 w-4" /> Checklist
                </div>
                <DynamicChecklist
                  initialItems={(component.config?.items as string[] | ChecklistItem[]) ?? []}
                  readonly={true}
                  className="text-sm"
                />
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
          case 'prototype':
            return (
              <div key={component.id} className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <PenTool className="h-4 w-4" /> Prototype
                  </span>
                  <Badge variant="secondary">{component.status}</Badge>
                </div>
                <RichTextViewer
                  content={(component.config?.description as string) ?? 'Prototype ready for review.'}
                  className="text-xs text-muted-foreground"
                />
                <div className="flex items-center justify-between">
                  {component.config?.url ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={String(component.config.url)} target="_blank" rel="noreferrer">
                        Open design
                      </a>
                    </Button>
                  ) : <div />}
                  <ComponentCommentThread
                    componentId={component.id}
                    componentTitle={getComponentTitle(component)}
                    projectId={projectId}
                    comments={comments}
                    isCompact={true}
                    currentUser={currentUser}
                    clientName={clientName}
                  />
                </div>
              </div>
            );
          case 'approval':
            return (
              <div key={component.id} className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4" /> Approval gate
                </div>
                <RichTextViewer
                  content={(component.config?.instructions as string) ?? 'Awaiting approval to proceed.'}
                  className="text-xs text-muted-foreground"
                />
                <div className="flex items-center justify-between">
                  <Badge variant={component.status === 'approved' ? 'success' : 'warning'}>{component.status}</Badge>
                  <ComponentCommentThread
                    componentId={component.id}
                    componentTitle={getComponentTitle(component)}
                    projectId={projectId}
                    comments={comments}
                    isCompact={true}
                    currentUser={currentUser}
                    clientName={clientName}
                  />
                </div>
              </div>
            );
          case 'text_block':
            return (
              <div key={component.id} className="space-y-3 rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileText className="h-4 w-4" /> Brief
                </div>
                <RichTextViewer
                  content={(component.config?.content as string) ?? 'No details provided yet.'}
                  className="text-sm text-muted-foreground"
                />
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
          case 'link':
            return (
              <div key={component.id} className="space-y-3 rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ExternalLink className="h-4 w-4" /> {(component.config?.label as string) ?? 'External link'}
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <a href={String(component.config?.url ?? '#')} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </Button>
                </div>
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
          case 'milestone':
            return (
              <div key={component.id} className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-900">{(component.config?.title as string) ?? 'Milestone'}</p>
                    <RichTextViewer
                      content={(component.config?.description as string) ?? 'Deliverable milestone'}
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                  <CalendarCheck className="h-5 w-5 text-brand-600" />
                </div>
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
          case 'tasklist':
            return (
              <div key={component.id} className="space-y-3 rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ListTodo className="h-4 w-4" /> Task list
                </div>
                <DynamicChecklist
                  initialItems={(component.config?.items as string[] | ChecklistItem[]) ?? []}
                  readonly={true}
                  className="text-sm"
                />
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
          default:
            return (
              <div key={component.id} className="space-y-3 rounded-2xl border border-border bg-white p-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Componente no reconocido: <strong>{component.component_type}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Este tipo de componente puede requerir una actualización o no está soportado.
                  </p>
                </div>
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
      })}
    </div>
  );
}

