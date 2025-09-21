'use client';

import { useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Circle,
  Settings,
  Paperclip,
  Palette,
  Code,
  Eye,
  Send,
  Target,
  Users
} from 'lucide-react';
import type { Stage } from '@/types/project';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface GanttTimelineProps {
  stages: Stage[];
  projectStartDate?: string | null;
  projectEndDate?: string | null;
}

export function GanttTimeline({ stages, projectStartDate, projectEndDate }: GanttTimelineProps) {
  const timeline = useMemo(() => {
    if (stages.length === 0) return null;

    // Calcular fechas mínimas y máximas
    const dates = stages.flatMap(stage => [
      stage.planned_start,
      stage.planned_end,
      stage.deadline,
      projectStartDate,
      projectEndDate
    ]).filter(Boolean) as string[];

    if (dates.length === 0) return null;

    const minDate = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => new Date(d).getTime())));
    const today = new Date();

    // Calcular duración total en días
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const todayPosition = Math.max(0, Math.min(100,
      ((today.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100
    ));

    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays,
      todayPosition,
      stages: stages.map(stage => {
        const stageStart = stage.planned_start ? new Date(stage.planned_start) : minDate;
        const stageEnd = stage.planned_end || stage.deadline ?
          new Date(stage.planned_end || stage.deadline!) : maxDate;

        const leftPosition = ((stageStart.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;
        const width = ((stageEnd.getTime() - stageStart.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;

        return {
          ...stage,
          leftPosition: Math.max(0, leftPosition),
          width: Math.max(2, width),
          startDate: stageStart,
          endDate: stageEnd
        };
      })
    };
  }, [stages, projectStartDate, projectEndDate]);

  if (!timeline) {
    return (
      <div className="rounded-3xl border border-border bg-white p-8 text-center">
        <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">Sin cronograma disponible</p>
        <p className="text-xs text-muted-foreground mt-1">Las fechas aparecerán cuando se configuren las etapas</p>
      </div>
    );
  }

  const getStageTypeIcon = (type: string) => {
    switch (type) {
      case 'intake': return Settings;
      case 'materials': return Paperclip;
      case 'design': return Palette;
      case 'development': return Code;
      case 'review': return Eye;
      case 'handoff': return Send;
      case 'custom': return Target;
      default: return Settings;
    }
  };

  const getStageStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return CheckCircle2;
      case 'waiting_client': case 'in_review': case 'approved': return AlertCircle;
      default: return Circle;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'approved': return 'bg-blue-500';
      case 'waiting_client': return 'bg-amber-500';
      case 'in_review': return 'bg-purple-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-brand-600" />
            <h3 className="text-lg font-semibold text-foreground">Cronograma</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeline.totalDays} días</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Timeline compacto */}
        <div className="relative">
          {/* Encabezado de fechas */}
          <div className="flex justify-between text-xs text-muted-foreground mb-3">
            <span>{formatDate(timeline.startDate.toISOString())}</span>
            <span>{formatDate(timeline.endDate.toISOString())}</span>
          </div>

          {/* Línea de tiempo principal */}
          <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
            {/* Indicador de "hoy" */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30"
              style={{ left: `${timeline.todayPosition}%` }}
            />
            <div
              className="absolute -top-6 text-xs text-red-600 font-medium whitespace-nowrap transform -translate-x-1/2"
              style={{ left: `${timeline.todayPosition}%` }}
            >
              Hoy
            </div>

            {/* Barras de etapas superpuestas */}
            {timeline.stages.map((stage, index) => {
              const StageTypeIcon = getStageTypeIcon(stage.type);
              return (
                <div
                  key={stage.id}
                  className="absolute top-1 h-4 rounded cursor-pointer group transition-all duration-200 hover:h-5 hover:top-0.5"
                  style={{
                    left: `${stage.leftPosition}%`,
                    width: `${stage.width}%`,
                    zIndex: 10 + index,
                  }}
                  title={`${stage.title}: ${formatDate(stage.startDate.toISOString())} → ${formatDate(stage.endDate.toISOString())}`}
                >
                  <div className={`h-full w-full rounded ${getStageColor(stage.status)} opacity-85 group-hover:opacity-100 shadow-sm`} />

                  {/* Icono de etapa */}
                  <div className={`absolute -top-1 -left-1 h-4 w-4 rounded-full ${getStageColor(stage.status)} flex items-center justify-center shadow-sm border-2 border-white`}>
                    <StageTypeIcon className="h-2 w-2 text-white" />
                  </div>

                  {/* Tooltip hover mejorado */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="font-medium">{stage.title}</div>
                    <div className="text-gray-300">{Math.ceil((stage.endDate.getTime() - stage.startDate.getTime()) / (1000 * 60 * 60 * 24))} días</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista compacta de etapas */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground mb-3">Etapas del proyecto</div>
          {timeline.stages.map((stage, index) => {
            const StageTypeIcon = getStageTypeIcon(stage.type);
            const StatusIcon = getStageStatusIcon(stage.status);

            return (
              <div key={stage.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Icono de etapa más pequeño */}
                  <div className={`p-1.5 rounded-lg ${getStageColor(stage.status)} bg-opacity-15 relative`}>
                    <StageTypeIcon className={`h-3 w-3 ${getStageColor(stage.status).replace('bg-', 'text-')}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{stage.title}</p>
                      <div className={`h-2 w-2 rounded-full ${getStageColor(stage.status)}`} title={stage.status}></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(stage.startDate.toISOString())} → {formatDate(stage.endDate.toISOString())}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {Math.ceil((stage.endDate.getTime() - stage.startDate.getTime()) / (1000 * 60 * 60 * 24))}d
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}