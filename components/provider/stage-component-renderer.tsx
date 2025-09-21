'use client';

import { Upload, CheckSquare, PenTool, ShieldCheck, FileText, ExternalLink, CalendarCheck, ListTodo } from 'lucide-react';
import type { Stage } from '@/types/project';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isFeatureEnabled } from '@/lib/config/feature-flags';

export function StageComponentRenderer({ stage }: { stage: Stage }) {
  if (!stage.components || stage.components.length === 0) {
    return <p className="text-sm text-muted-foreground">No components configured.</p>;
  }

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
                  <Upload className="h-4 w-4" /> Upload request
                </div>
                <p className="text-xs text-muted-foreground">{(component.config?.description as string) ?? 'Client needs to upload files.'}</p>
                <Button variant="secondary" size="sm">
                  Review uploads
                </Button>
              </div>
            );
          case 'checklist':
            return (
              <div key={component.id} className="space-y-2 rounded-2xl border border-brand-100 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckSquare className="h-4 w-4" /> Checklist
                </div>
                <Checklist items={(component.config?.items as string[]) ?? []} />
              </div>
            );
          case 'prototype':
            return (
              <div key={component.id} className="space-y-2 rounded-2xl border border-brand-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <PenTool className="h-4 w-4" /> Prototype
                  </span>
                  <Badge variant="secondary">{component.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{(component.config?.description as string) ?? 'Prototype ready for review.'}</p>
                {component.config?.url ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={String(component.config.url)} target="_blank" rel="noreferrer">
                      Open design
                    </a>
                  </Button>
                ) : null}
              </div>
            );
          case 'approval':
            return (
              <div key={component.id} className="space-y-2 rounded-2xl border border-brand-100 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4" /> Approval gate
                </div>
                <p className="text-xs text-muted-foreground">{(component.config?.instructions as string) ?? 'Awaiting approval to proceed.'}</p>
                <Badge variant={component.status === 'approved' ? 'success' : 'warning'}>{component.status}</Badge>
              </div>
            );
          case 'text_block':
            return (
              <div key={component.id} className="space-y-2 rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileText className="h-4 w-4" /> Brief
                </div>
                <p className="text-sm text-muted-foreground">{(component.config?.content as string) ?? 'No details provided yet.'}</p>
              </div>
            );
          case 'link':
            return (
              <div key={component.id} className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ExternalLink className="h-4 w-4" /> {(component.config?.label as string) ?? 'External link'}
                </span>
                <Button asChild size="sm" variant="outline">
                  <a href={String(component.config?.url ?? '#')} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </Button>
              </div>
            );
          case 'milestone':
            return (
              <div key={component.id} className="flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
                <div>
                  <p className="text-sm font-semibold text-brand-900">{(component.config?.title as string) ?? 'Milestone'}</p>
                  <p className="text-xs text-muted-foreground">{(component.config?.description as string) ?? 'Deliverable milestone'}</p>
                </div>
                <CalendarCheck className="h-5 w-5 text-brand-600" />
              </div>
            );
          case 'tasklist':
            return (
              <div key={component.id} className="space-y-2 rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ListTodo className="h-4 w-4" /> Task list
                </div>
                <Checklist items={(component.config?.items as string[]) ?? []} />
              </div>
            );
          default:
            return (
              <div key={component.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Componente no reconocido: <strong>{component.component_type}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Este tipo de componente puede requerir una actualización o no está soportado.
                  </p>
                </div>
              </div>
            );
        }
      })}
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">No items defined.</p>;
  }
  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand-400" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}
