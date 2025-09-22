'use client';

import { useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Circle,
  ChevronRight
} from 'lucide-react';
import type { Stage } from '@/types/project';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDate, getStageStatusColors } from '@/lib/utils';

interface MobileTimelineProps {
  stages: Stage[];
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  projectDeadline?: string | null;
}

export function MobileTimeline({ stages, projectStartDate, projectEndDate, projectDeadline }: MobileTimelineProps) {
  const timelineData = useMemo(() => {
    if (stages.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular progreso general
    const completedStages = stages.filter(stage => stage.status === 'done').length;
    const totalStages = stages.length;
    const overallProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

    // Etapa actual (primera no completada)
    const currentStage = stages.find(stage => stage.status !== 'done');

    return {
      overallProgress,
      completedStages,
      totalStages,
      currentStage,
      stages: stages.map((stage, index) => {
        const isCompleted = stage.status === 'done';
        const isCurrent = currentStage?.id === stage.id;

        return {
          ...stage,
          isCompleted,
          isCurrent,
          stageNumber: index + 1
        };
      })
    };
  }, [stages]);

  if (!timelineData) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">Sin cronograma disponible</p>
        <p className="text-xs text-muted-foreground mt-1">Las fechas aparecerán cuando se configuren las etapas</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    return getStageStatusColors(status).solid;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo': return 'Por hacer';
      case 'approved': return 'Aprobado';
      case 'waiting_client': return 'Esperando cliente';
      case 'in_review': return 'En revisión';
      case 'done': return 'Completado';
      case 'blocked': return 'Bloqueado';
      default: return status;
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-white to-brand-50/30 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30 bg-gradient-to-r from-brand-500 to-brand-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 shadow-lg">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Progreso del proyecto</h3>
          </div>
        </div>
      </div>

      {/* Progreso general */}
      <div className="p-4 bg-gray-50/50 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progreso general</span>
          <span className="text-sm font-bold text-brand-600">
            {timelineData.completedStages}/{timelineData.totalStages} etapas
          </span>
        </div>
        <Progress value={timelineData.overallProgress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{Math.round(timelineData.overallProgress)}% completado</span>
          {projectDeadline && (
            <span>Límite: {formatDate(projectDeadline)}</span>
          )}
        </div>
      </div>

      {/* Lista de etapas */}
      <div className="divide-y divide-border/30">
        {timelineData.stages.map((stage) => (
          <div
            key={stage.id}
            className={`p-4 transition-colors ${
              stage.isCurrent
                ? 'bg-brand-50/50 border-l-4 border-l-brand-500'
                : stage.isCompleted
                ? 'bg-green-50/30'
                : 'hover:bg-gray-50/50'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Indicador de estado */}
              <div className="flex-shrink-0 mt-1">
                {stage.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : stage.isCurrent ? (
                  <div className="h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center animate-pulse">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  </div>
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* Contenido de la etapa */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    Etapa {stage.stageNumber}: {stage.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(stage.status)} border-current`}
                  >
                    {getStatusText(stage.status)}
                  </Badge>
                </div>

                {stage.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {stage.description}
                  </p>
                )}

                {/* Fechas */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {stage.planned_start && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Inicio: {formatDate(stage.planned_start)}</span>
                    </div>
                  )}
                  {(stage.planned_end || stage.deadline) && (
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      <span>
                        Fin: {formatDate(stage.planned_end || stage.deadline!)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Indicador de etapa actual */}
              {stage.isCurrent && (
                <div className="flex-shrink-0">
                  <ChevronRight className="h-4 w-4 text-brand-500" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50/50 border-t border-border/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Completado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-brand-500"></div>
              <span>Actual</span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-gray-400" />
              <span>Pendiente</span>
            </div>
          </div>
          {projectStartDate && projectEndDate && (
            <div className="text-right">
              <div className="font-medium">
                {formatDate(projectStartDate)} → {formatDate(projectEndDate)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}