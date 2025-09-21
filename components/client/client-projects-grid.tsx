'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle, Clock, FolderPlus, MessageCircle } from 'lucide-react';
import type { ClientProjectCard } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';

interface ClientProjectsGridProps {
  projects: ClientProjectCard[];
  clientId: string;
}

export function ClientProjectsGrid({ projects, clientId }: ClientProjectsGridProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mis proyectos</h1>
        <p className="text-sm text-muted-foreground">Seguimiento de hitos, materiales pendientes y aprobaciones.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <motion.div key={project.id} layout initial={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
            <Link href={`/c/${clientId}/projects/${project.id}`}>
              <Card className="border-border/70 transition hover:border-brand-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">Estado: {project.status}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                      <span>Progreso</span>
                      <span>{Math.round(project.progress)}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {project.deadline ? formatDate(project.deadline) : 'Sin fecha límite'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {project.next_action ?? 'Sin pendientes inmediatos'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4" />
                    {project.pending_items} pendientes
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
        {projects.length === 0 && (
          <div className="md:col-span-2">
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
