'use client';

import { CheckCircle, FileUp, MessageCircle, RefreshCw, Play, Pause, Clock, UserPlus, UserMinus, Settings } from 'lucide-react';
import type { ActivityEntry } from '@/types/project';
import { formatDate } from '@/lib/utils';

// Mapa de acciones a iconos y traducciones
const activityMap: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  'comment.created': { icon: MessageCircle, label: 'Comentario agregado', color: 'bg-blue-100 text-blue-700' },
  'files.uploaded': { icon: FileUp, label: 'Archivos subidos', color: 'bg-green-100 text-green-700' },
  'stage.completed': { icon: CheckCircle, label: 'Etapa completada', color: 'bg-emerald-100 text-emerald-700' },
  'stage.reopened': { icon: RefreshCw, label: 'Etapa reabierta', color: 'bg-orange-100 text-orange-700' },
  'stage.started': { icon: Play, label: 'Etapa iniciada', color: 'bg-blue-100 text-blue-700' },
  'stage.paused': { icon: Pause, label: 'Etapa pausada', color: 'bg-yellow-100 text-yellow-700' },
  'project.created': { icon: Play, label: 'Proyecto creado', color: 'bg-brand-100 text-brand-700' },
  'approval.requested': { icon: Clock, label: 'Aprobación solicitada', color: 'bg-purple-100 text-purple-700' },
  'approval.approved': { icon: CheckCircle, label: 'Aprobación otorgada', color: 'bg-green-100 text-green-700' },
  'approval.rejected': { icon: RefreshCw, label: 'Cambios solicitados', color: 'bg-red-100 text-red-700' },
  'member.added': { icon: UserPlus, label: 'Miembro agregado', color: 'bg-indigo-100 text-indigo-700' },
  'member.removed': { icon: UserMinus, label: 'Miembro removido', color: 'bg-gray-100 text-gray-700' },
  'settings.updated': { icon: Settings, label: 'Configuración actualizada', color: 'bg-gray-100 text-gray-700' },
};

function getActivityInfo(action: string) {
  return activityMap[action] || {
    icon: RefreshCw,
    label: action,
    color: 'bg-gray-100 text-gray-600'
  };
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const activityDate = new Date(date);
  const diffInHours = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    return diffInMinutes <= 1 ? 'Hace un momento' : `Hace ${diffInMinutes} minutos`;
  }

  if (diffInHours < 24) {
    return diffInHours === 1 ? 'Hace 1 hora' : `Hace ${diffInHours} horas`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;

  return formatDate(date);
}

export function ActivityPanel({ activity }: { activity: ActivityEntry[] }) {
  if (activity.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">Sin actividad reciente</p>
        <p className="text-xs text-muted-foreground mt-1">Las acciones del proyecto aparecerán aquí</p>
      </div>
    );
  }

  // Agrupar actividades por fecha
  const groupedActivity = activity.reduce((groups, item) => {
    const date = new Date(item.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, ActivityEntry[]>);

  const sortedDates = Object.keys(groupedActivity).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedDates.map((dateString) => {
        const items = groupedActivity[dateString];
        const date = new Date(dateString);
        const isToday = date.toDateString() === new Date().toDateString();
        const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString();

        let dateLabel = formatDate(dateString);
        if (isToday) dateLabel = 'Hoy';
        else if (isYesterday) dateLabel = 'Ayer';

        return (
          <div key={dateString} className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-1">
              {dateLabel}
            </h4>
            <ul className="space-y-3">
              {items.map((item) => {
                const activityInfo = getActivityInfo(item.action);
                const Icon = activityInfo.icon;

                return (
                  <li key={item.id} className="flex gap-3 group">
                    <span className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full ${activityInfo.color} flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activityInfo.label}</p>
                      <p className="text-xs text-muted-foreground" title={formatDate(item.created_at)}>
                        {formatRelativeTime(item.created_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
