'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, ExternalLink, Calendar, AlertCircle } from 'lucide-react';
import { assignProjectToClient } from '@/actions/projects';
import { toast } from 'sonner';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  status: string;
  created_at: string;
  deadline: string | null;
}

interface ClientProjectsManagerProps {
  clientId: string;
  clientName: string;
  projects: Project[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  active: 'bg-blue-500',
  done: 'bg-green-500',
  paused: 'bg-gray-500',
  cancelled: 'bg-red-500'
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  done: 'Completado',
  paused: 'Pausado',
  cancelled: 'Cancelado'
};

export function ClientProjectsManager({ clientId, clientName, projects }: ClientProjectsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const loadAvailableProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await fetch('/api/projects/available');
      const data = await response.json();
      setAvailableProjects(data);
    } catch (error) {
      toast.error('Error al cargar proyectos disponibles');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleAssignProject = async () => {
    if (!selectedProjectId) {
      toast.error('Selecciona un proyecto');
      return;
    }

    const formData = new FormData();
    formData.append('projectId', selectedProjectId);
    formData.append('clientId', clientId);

    startTransition(async () => {
      const result = await assignProjectToClient(formData);

      if (result.error) {
        const errorMessages = Object.values(result.error).flat();
        toast.error(errorMessages.join(', '));
      } else {
        toast.success('Proyecto asignado exitosamente');
        setIsDialogOpen(false);
        setSelectedProjectId('');
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Proyectos Asignados</CardTitle>
            <CardDescription>
              {projects.length === 0
                ? 'Este cliente no tiene proyectos asignados'
                : `${projects.length} ${projects.length === 1 ? 'proyecto' : 'proyectos'} asignado${projects.length === 1 ? '' : 's'}`}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={loadAvailableProjects}>
                <Plus className="h-4 w-4 mr-2" />
                Asignar Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Proyecto a {clientName}</DialogTitle>
                <DialogDescription>
                  Selecciona un proyecto para asignarlo a este cliente. Si el proyecto ya tiene un cliente asignado, será reasignado.
                </DialogDescription>
              </DialogHeader>

              {isLoadingProjects ? (
                <div className="py-8 text-center text-muted-foreground">
                  Cargando proyectos disponibles...
                </div>
              ) : availableProjects.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No hay proyectos disponibles para asignar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center justify-between gap-2">
                            <span>{project.title}</span>
                            {project.client_id && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {project.clients?.name || 'Asignado'}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
                  Cancelar
                </Button>
                <Button onClick={handleAssignProject} disabled={isPending || !selectedProjectId}>
                  {isPending ? 'Asignando...' : 'Asignar Proyecto'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay proyectos asignados a este cliente</p>
            <p className="text-sm mt-2">Haz clic en &quot;Asignar Proyecto&quot; para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{project.title}</h3>
                    <Badge
                      variant="secondary"
                      className="gap-1"
                      style={{
                        backgroundColor: `${statusColors[project.status]}20`,
                        borderColor: statusColors[project.status]
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: statusColors[project.status] }}
                      />
                      {statusLabels[project.status] || project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>
                      Creado: {new Date(project.created_at).toLocaleDateString('es-ES')}
                    </span>
                    {project.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vence: {new Date(project.deadline).toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </div>
                </div>
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Proyecto
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
