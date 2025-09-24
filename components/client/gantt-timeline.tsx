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
import { formatDate, getStageStatusColors } from '@/lib/utils';

interface GanttTimelineProps {
  stages: Stage[];
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  projectDeadline?: string | null;
}

export function GanttTimeline({ stages, projectStartDate, projectEndDate, projectDeadline }: GanttTimelineProps) {
  const timeline = useMemo(() => {
    if (stages.length === 0) return null;

    // Calcular fechas mínimas y máximas con prioridad a fechas del proyecto
    const dates = [
      projectStartDate,
      projectEndDate,
      projectDeadline,
      ...stages.flatMap(stage => [
        stage.planned_start,
        stage.planned_end,
        stage.deadline
      ])
    ].filter(Boolean) as string[];

    if (dates.length === 0) return null;

    // Usar fechas del proyecto como base, o calcular desde etapas
    const minDate = projectStartDate
      ? new Date(projectStartDate)
      : new Date(Math.min(...dates.map(d => new Date(d).getTime())));

    const maxDate = projectDeadline
      ? new Date(projectDeadline)
      : projectEndDate
      ? new Date(projectEndDate)
      : new Date(Math.max(...dates.map(d => new Date(d).getTime())));

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche

    // Calcular duración total en días
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Generar meses para el header
    const months = [];
    const currentDate = new Date(minDate);

    while (currentDate <= maxDate) {
      months.push({
        name: currentDate.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase(),
        year: currentDate.getFullYear(),
        startOfMonth: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        endOfMonth: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Eliminar duplicados de meses
    const uniqueMonths = months.filter((month, index, self) =>
      index === self.findIndex(m => m.name === month.name && m.year === month.year)
    );

    const todayPosition = Math.max(0, Math.min(100,
      ((today.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100
    ));

    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays,
      todayPosition,
      months: uniqueMonths,
      stages: stages.map(stage => {
        const stageStart = stage.planned_start ? new Date(stage.planned_start) : minDate;
        const stageEnd = stage.planned_end || stage.deadline ?
          new Date(stage.planned_end || stage.deadline!) : maxDate;

        const leftPosition = ((stageStart.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;
        const width = ((stageEnd.getTime() - stageStart.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;

        return {
          ...stage,
          leftPosition: Math.max(0, leftPosition),
          width: Math.max(1, width),
          startDate: stageStart,
          endDate: stageEnd
        };
      })
    };
  }, [stages, projectStartDate, projectEndDate, projectDeadline]);

  if (!timeline) {
    return (
      <div className="rounded-3xl border border-border bg-white p-8 text-center">
        <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">Sin cronograma disponible</p>
        <p className="text-xs text-muted-foreground mt-1">Las fechas aparecerán cuando se configuren las etapas</p>
      </div>
    );
  }

  const getStageColor = (status: string) => {
    return getStageStatusColors(status).solid;
  };

  return (
    <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-white to-brand-50/30 shadow-sm overflow-hidden">
      {/* Header del Gantt */}
      <div className="p-4 border-b border-border/30 bg-gradient-to-r from-brand-500 to-brand-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 shadow-lg">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Cronograma del proyecto</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/80">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeline.totalDays} días</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla tipo Gantt */}
      <div className="overflow-x-auto max-w-full">
        <div className="min-w-full">
          {/* Header de meses */}
          <div className="flex border-b border-border/30 bg-gray-50/50">
            {/* Columna de etapas */}
            <div className="w-32 sm:w-40 lg:w-48 flex-shrink-0 bg-gray-100/50 p-2 sm:p-3 lg:p-4 border-r border-border/30">
              <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground text-center uppercase tracking-wide">
                <span className="hidden sm:inline">Etapas</span>
                <span className="sm:hidden">Et.</span>
              </h4>
            </div>

            {/* Columnas de tiempo */}
            <div className="flex-1 flex">
              {timeline.months.map((month, index) => (
                <div
                  key={`${month.name}-${month.year}`}
                  className="flex-1 p-2 sm:p-3 lg:p-4 text-center border-r border-border/30 bg-gray-50/50"
                  style={{ minWidth: '60px' }}
                >
                  <div className="text-xs sm:text-sm font-semibold text-foreground capitalize">
                    <span className="hidden sm:inline">{month.name.toLowerCase()}</span>
                    <span className="sm:hidden">{month.name.toLowerCase().slice(0, 3)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">{month.year}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filas de etapas */}
          <div className="relative">
            {/* Línea de "hoy" */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 shadow-lg"
              style={{ left: `calc(8rem + ${timeline.todayPosition}% * (100% - 8rem) / 100)` }}
            />

            {timeline.stages.map((stage, stageIndex) => (
              <div key={stage.id} className="flex border-b border-border/30 hover:bg-brand-50/20 transition-colors">
                {/* Nombre de la etapa */}
                <div className="w-32 sm:w-40 lg:w-48 flex-shrink-0 p-2 sm:p-3 lg:p-4 border-r border-border/30 bg-gray-50/30">
                  <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                    <span className="hidden sm:inline">Etapa {stageIndex + 1}</span>
                    <span className="sm:hidden">E{stageIndex + 1}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    <span className="hidden sm:inline">{stage.title}</span>
                    <span className="sm:hidden">{stage.title.slice(0, 12)}{stage.title.length > 12 ? '...' : ''}</span>
                  </div>
                </div>

                {/* Área del timeline */}
                <div className="flex-1 relative h-8 sm:h-10 lg:h-12 flex items-center">
                  {/* Barra de la etapa */}
                  <div
                    className={`absolute h-3 sm:h-4 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg group cursor-pointer ${getStageColor(stage.status)}`}
                    style={{
                      left: `${stage.leftPosition}%`,
                      width: `${stage.width}%`,
                      minWidth: '20px'
                    }}
                    title={`${stage.title}: ${formatDate(stage.startDate.toISOString())} → ${formatDate(stage.endDate.toISOString())}`}
                  >
                    {/* Contenido de la barra */}
                    <div className="h-full w-full rounded-lg bg-gradient-to-r from-white/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl">
                      <div className="font-medium">{stage.title}</div>
                      <div className="text-gray-300 text-xs">
                        {formatDate(stage.startDate.toISOString())} → {formatDate(stage.endDate.toISOString())}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {Math.ceil((stage.endDate.getTime() - stage.startDate.getTime()) / (1000 * 60 * 60 * 24))} días
                      </div>
                      {/* Flecha del tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer con información adicional */}
      <div className="p-2 sm:p-3 lg:p-4 bg-gray-50/50 border-t border-border/30">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Hoy</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 ${getStageStatusColors('done').solid} rounded`}></div>
                <span className="hidden sm:inline">Completado</span>
                <span className="sm:hidden">Hecho</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 ${getStageStatusColors('waiting_client').solid} rounded`}></div>
                <span className="hidden sm:inline">En espera</span>
                <span className="sm:hidden">Espera</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 ${getStageStatusColors('in_review').solid} rounded`}></div>
                <span className="hidden sm:inline">En revisión</span>
                <span className="sm:hidden">Revisión</span>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="font-medium">Total: {timeline.totalDays} días</div>
            <div className="text-xs hidden sm:block">{formatDate(timeline.startDate.toISOString())} → {formatDate(timeline.endDate.toISOString())}</div>
          </div>
        </div>
      </div>
    </div>
  );
}