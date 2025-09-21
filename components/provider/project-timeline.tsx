'use client';

import { useMemo } from 'react';
import type { ProjectSummary } from '@/types/project';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const DAY_MS = 1000 * 60 * 60 * 24;

export function ProjectTimeline({ project }: { project: ProjectSummary }) {
  const stages = useMemo(() => (project.stages ?? []).sort((a, b) => a.order - b.order), [project.stages]);
  const minDate = useMemo(() => {
    const dates = stages.flatMap((stage) => [stage.planned_start, stage.planned_end].filter(Boolean)) as string[];
    if (project.start_date) dates.push(project.start_date);
    if (dates.length === 0) return new Date();
    return new Date(Math.min(...dates.map((date) => new Date(date).getTime())));
  }, [stages, project.start_date]);

  const maxDate = useMemo(() => {
    const dates = stages.flatMap((stage) => [stage.deadline, stage.planned_end].filter(Boolean)) as string[];
    if (project.deadline) dates.push(project.deadline);
    if (dates.length === 0) return new Date();
    return new Date(Math.max(...dates.map((date) => new Date(date).getTime())));
  }, [stages, project.deadline]);

  const totalDays = Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / DAY_MS));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(minDate)}</span>
        <span>{formatDate(maxDate)}</span>
      </div>
      <div className="space-y-4">
        {stages.map((stage) => {
          const start = stage.planned_start ? new Date(stage.planned_start) : minDate;
          const end = stage.planned_end ? new Date(stage.planned_end) : start;
          const offset = Math.max(0, Math.round((start.getTime() - minDate.getTime()) / DAY_MS));
          const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS));
          const widthPercent = (duration / totalDays) * 100;
          const offsetPercent = (offset / totalDays) * 100;

          return (
            <div key={stage.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{stage.title}</span>
                <Badge variant="secondary">{stage.status}</Badge>
              </div>
              <div className="relative h-10 overflow-hidden rounded-xl bg-brand-50">
                <div
                  className="absolute h-full rounded-xl bg-brand-400/80"
                  style={{ width: `${widthPercent}%`, left: `${offsetPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
