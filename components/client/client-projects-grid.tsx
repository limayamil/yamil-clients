'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle, Clock, FolderPlus, MessageCircle, AlertTriangle, Target, TrendingUp } from 'lucide-react';
import type { ClientProjectCard } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate, cn } from '@/lib/utils';

interface ClientProjectsGridProps {
  projects: ClientProjectCard[];
  clientId: string;
}

// Función helper para obtener el color del badge según el estado
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'completado':
      return { variant: 'default' as const, color: 'bg-green-500', text: 'Completado', icon: CheckCircle };
    case 'in_progress':
    case 'en_progreso':
      return { variant: 'secondary' as const, color: 'bg-blue-500', text: 'En progreso', icon: TrendingUp };
    case 'on_hold':
    case 'pausado':
      return { variant: 'outline' as const, color: 'bg-yellow-500', text: 'Pausado', icon: Clock };
    case 'cancelled':
    case 'cancelado':
      return { variant: 'destructive' as const, color: 'bg-red-500', text: 'Cancelado', icon: AlertTriangle };
    default:
      return { variant: 'secondary' as const, color: 'bg-gray-500', text: status, icon: Target };
  }
};

// Función helper para determinar si una fecha está próxima (dentro de 7 días)
const isDeadlineNear = (deadline: string | null | undefined): boolean => {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7 && diffDays >= 0;
};

export function ClientProjectsGrid({ projects, clientId }: ClientProjectsGridProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Mis proyectos</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Seguimiento de hitos, materiales pendientes y aprobaciones.</p>
      </div>
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {projects.map((project, index) => {
          const statusInfo = getStatusBadge(project.status);
          const StatusIcon = statusInfo.icon;
          const isNearDeadline = isDeadlineNear(project.deadline);

          return (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/c/${clientId}/projects/${project.id}`}>
                <Card className={cn(
                  "relative overflow-hidden border-border/50 bg-gradient-to-br from-white to-gray-50/30 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1",
                  "group cursor-pointer"
                )}>
                  {/* Gradiente decorativo superior */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-brand-600" />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors">
                        {project.title}
                      </CardTitle>
                      <Badge variant={statusInfo.variant} className="shrink-0 text-xs">
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.text}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Barra de progreso mejorada */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-brand-600" />
                          <span className="text-sm font-medium text-foreground">Progreso</span>
                        </div>
                        <span className="text-sm font-semibold text-brand-600">
                          {Math.round(project.progress)}%
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={project.progress} className="h-2 bg-gray-200" />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-400/20 to-brand-600/20 animate-pulse" />
                      </div>
                    </div>

                    {/* Información condicional - solo mostrar si hay datos relevantes */}
                    <div className="space-y-3">
                      {/* Fecha límite - solo mostrar si existe */}
                      {project.deadline && (
                        <div className={cn(
                          "flex items-center gap-2 text-sm",
                          isNearDeadline ? "text-amber-600 font-medium" : "text-muted-foreground"
                        )}>
                          <CalendarDays className={cn("h-4 w-4", isNearDeadline && "text-amber-500")} />
                          <span>{formatDate(project.deadline)}</span>
                          {isNearDeadline && (
                            <Badge variant="outline" className="ml-auto text-xs bg-amber-50 text-amber-700 border-amber-300">
                              Próxima
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Próxima acción - solo mostrar si existe y no está vacía */}
                      {project.next_action && project.next_action.trim() && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{project.next_action}</span>
                        </div>
                      )}

                      {/* Elementos pendientes - solo mostrar si hay pendientes */}
                      {project.pending_items > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-muted-foreground">
                            {project.pending_items} pendiente{project.pending_items !== 1 ? 's' : ''}
                          </span>
                          <Badge variant="outline" className="ml-auto text-xs bg-blue-50 text-blue-700 border-blue-300">
                            {project.pending_items}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  {/* Efecto hover decorativo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </Card>
              </Link>
            </motion.div>
          );
        })}
        {projects.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3">
            <EmptyState
              icon={<FolderPlus className="h-8 w-8" />}
              title="No tienes proyectos asignados"
              description="Cuando tu proveedor te asigne a un proyecto, aparecerá aquí. Mientras tanto, puedes contactarlos para conocer el estado de tus iniciativas."
              action={{
                label: 'Contactar proveedor',
                onClick: () => window.open('mailto:', '_blank')
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
