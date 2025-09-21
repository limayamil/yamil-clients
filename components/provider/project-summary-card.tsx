'use client';

import Link from 'next/link';
import { memo } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronRight, Timer, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, getStageStatusVariant } from '@/lib/utils';
import type { ProjectSummary } from '@/types/project';
import { Progress } from '@/components/ui/progress';

export const ProjectSummaryCard = memo(function ProjectSummaryCard({ project }: { project: ProjectSummary }) {
  return (
    <motion.div layout initial={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }}>
      <Link href={`/projects/${project.id}`} className="block">
        <Card className="group h-full border-border/60 transition-all duration-200 hover:border-brand-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-start justify-between gap-3">
              <Badge
                variant={project.waiting_on_client ? 'warning' : project.overdue ? 'destructive' : 'secondary'}
                className="flex-shrink-0"
              >
                {project.status}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 transition-transform group-hover:translate-x-1" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-lg leading-tight line-clamp-2" title={project.title}>
                {project.title}
              </CardTitle>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2" title={project.description}>
                  {project.description}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Progress Section - Always visible */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Progreso</span>
                <span className="font-semibold">{Math.round(project.progress)}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>

            {/* Key Info - Mobile optimized */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground">Vencimiento: </span>
                  <span className="font-medium text-foreground">
                    {project.deadline ? formatDate(project.deadline) : 'Sin fecha'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground">Cliente: </span>
                  <span className="font-medium text-foreground truncate" title={project.client_name}>
                    {project.client_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
              project.waiting_on_client
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : project.overdue
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-brand-50 text-brand-700 border border-brand-200'
            }`}>
              <Timer className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {project.waiting_on_client
                  ? 'Esperando cliente'
                  : project.overdue
                  ? 'Atrasado'
                  : 'En progreso'
                }
              </span>
            </div>

            {/* Stages preview - Hidden on small screens */}
            {project.stages && project.stages.length > 0 && (
              <div className="space-y-2 hidden sm:block">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Etapas ({project.stages.filter(s => s.status === 'done').length}/{project.stages.length})
                </h4>
                <div className="space-y-1">
                  {project.stages.slice(0, 2).map((stage) => (
                    <div key={stage.id} className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1 mr-2" title={stage.title}>{stage.title}</span>
                      <Badge
                        variant={getStageStatusVariant(stage.status)}
                        className="text-xs py-0 px-1 h-auto"
                      >
                        {stage.status}
                      </Badge>
                    </div>
                  ))}
                  {project.stages.length > 2 && (
                    <p className="text-xs text-muted-foreground">+{project.stages.length - 2} más</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
});
