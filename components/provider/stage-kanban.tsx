'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StageComponentRenderer } from '@/components/provider/stage-component-renderer';
import type { ProjectSummary, Stage } from '@/types/project';
import { formatDate, getStageStatusVariant } from '@/lib/utils';

interface StageKanbanProps {
  project: ProjectSummary;
}

export function StageKanban({ project }: StageKanbanProps) {
  const stages = useMemo(() => (project.stages ?? []).sort((a, b) => a.order - b.order), [project.stages]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {stages.map((stage) => (
        <div key={stage.id} className="h-full">
          <Card className="flex h-full flex-col border-border/70">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{stage.title}</CardTitle>
                <Badge variant={getStageStatusVariant(stage.status)}>{stage.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {stage.planned_start ? formatDate(stage.planned_start) : '—'} → {stage.planned_end ? formatDate(stage.planned_end) : '—'}
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              <StageComponentRenderer
                stage={stage}
                projectId={project.id}
                comments={project.comments || []}
                clientName={project.client_name}
              />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
