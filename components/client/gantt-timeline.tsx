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
    <div className="rounded-3xl border border-border bg-white p-4 md:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-brand-600" />
          <h3 className="text-lg font-semibold text-foreground">Cronograma del Proyecto</h3>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span className="hidden sm:inline">Hoy: </span>
            <span>{formatDate(new Date().toISOString())}</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span>{timeline.totalDays} días total</span>
        </div>
      </div>

      {/* Encabezado de fechas */}
      <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
        <span>{formatDate(timeline.startDate.toISOString())}</span>
        <span>{formatDate(timeline.endDate.toISOString())}</span>
      </div>

      {/* Línea de tiempo principal */}
      <div className="relative mb-6">
        {/* Línea base */}
        <div className="h-2 bg-gray-100 rounded-full relative overflow-hidden">
          {/* Indicador de "hoy" */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
            style={{ left: `${timeline.todayPosition}%` }}
          />
          <div
            className="absolute -top-1 text-xs text-red-600 font-medium whitespace-nowrap transform -translate-x-1/2"
            style={{ left: `${timeline.todayPosition}%` }}
          >
            Hoy
          </div>
        </div>

        {/* Barras de etapas */}
        <div className="absolute inset-0 top-0">
          {timeline.stages.map((stage, index) => {
            const StageTypeIcon = getStageTypeIcon(stage.type);
            return (
              <div
                key={stage.id}
                className="absolute top-0 h-2 rounded-full flex items-center"
                style={{
                  left: `${stage.leftPosition}%`,
                  width: `${stage.width}%`,
                }}
              >
                <div className={`h-full w-full rounded-full ${getStageColor(stage.status)} opacity-80`} />
                {/* Icono de tipo de etapa al inicio de la barra */}
                <div
                  className={`absolute -top-1 -left-1 h-4 w-4 rounded-full ${getStageColor(stage.status)} flex items-center justify-center shadow-sm`}
                  title={`${stage.title} (${stage.type})`}
                >
                  <StageTypeIcon className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de etapas */}
      <div className="space-y-3">
        {timeline.stages.map((stage, index) => {
          const StageTypeIcon = getStageTypeIcon(stage.type);
          const StatusIcon = getStageStatusIcon(stage.status);

          const getStageTypeLabel = (type: string) => {
            switch (type) {
              case 'intake': return 'Admisión';
              case 'materials': return 'Materiales';
              case 'design': return 'Diseño';
              case 'development': return 'Desarrollo';
              case 'review': return 'Revisión';
              case 'handoff': return 'Entrega';
              case 'custom': return 'Personalizado';
              default: return type;
            }
          };

          return (
            <div key={stage.id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Icono principal por tipo de etapa */}
                <div className={`p-2 rounded-xl ${getStageColor(stage.status)} bg-opacity-10 relative`}>
                  <StageTypeIcon className={`h-4 w-4 ${getStageColor(stage.status).replace('bg-', 'text-')}`} />
                  {/* Icono pequeño de estado en la esquina */}
                  <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${getStageColor(stage.status)} flex items-center justify-center`}>
                    <StatusIcon className="h-2 w-2 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{stage.title}</p>
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      {getStageTypeLabel(stage.type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(stage.startDate.toISOString())} → {formatDate(stage.endDate.toISOString())}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    stage.status === 'done' ? 'success' :
                    stage.status === 'waiting_client' ? 'warning' :
                    stage.status === 'blocked' ? 'destructive' :
                    'secondary'
                  }
                  className="text-xs"
                >
                  {stage.status === 'todo' ? 'Por hacer' :
                   stage.status === 'waiting_client' ? 'Esperando cliente' :
                   stage.status === 'in_review' ? 'En revisión' :
                   stage.status === 'approved' ? 'Aprobado' :
                   stage.status === 'done' ? 'Completado' :
                   stage.status === 'blocked' ? 'Bloqueado' : stage.status}
                </Badge>
                <span className="text-xs text-muted-foreground w-8 text-right font-medium">
                  {Math.ceil((stage.endDate.getTime() - stage.startDate.getTime()) / (1000 * 60 * 60 * 24))}d
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}