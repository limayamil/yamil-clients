'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ActivityPanel } from '@/components/shared/activity-panel';
// import { CommentsPanel } from '@/components/shared/comments-panel';
import { ProjectLinksPanel } from '@/components/shared/project-links-panel';
import { ProjectMinutesPanel } from '@/components/shared/project-minutes-panel';
import { GanttTimeline } from '@/components/client/gantt-timeline';
import { MobileTimeline } from '@/components/client/mobile-timeline';
import { EditableStageCard } from '@/components/client/editable-stage-card';
import { StageCommentThread } from '@/components/client/stage-comment-thread';
import { StageLinkPanel } from '@/components/client/stage-link-panel';
import type { ProjectSummary, Stage, StageComponent } from '@/types/project';
import { Home, FolderKanban, Clock, Calendar, Target, Users, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { addStageComponent, updateStageComponent, deleteStageComponent, updateStage } from '@/actions/stages';
import { toast } from 'sonner';

// Función helper para traducir estados del proyecto
const getProjectStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case 'in_progress':
    case 'en_progreso':
      return 'En progreso';
    case 'completed':
    case 'completado':
      return 'Completado';
    case 'on_hold':
    case 'pausado':
      return 'Pausado';
    case 'cancelled':
    case 'cancelado':
      return 'Cancelado';
    case 'pending':
    case 'pendiente':
      return 'Pendiente';
    case 'planning':
    case 'planificacion':
      return 'Planificación';
    default:
      return status;
  }
};

interface ClientProjectDetailProps {
  project: ProjectSummary;
  clientEmail: string;
  currentUserId: string;
}

export function ClientProjectDetail({ project, clientEmail, currentUserId }: ClientProjectDetailProps) {
  const router = useRouter();
  const [activeCommentStage, setActiveCommentStage] = useState<string | null>(null);
  const [activeFileStage, setActiveFileStage] = useState<string | null>(null);

  // Create current user object for comment permissions
  const currentUser = { id: currentUserId, role: 'client' as const };
  const pendingApproval = project.approvals?.find((approval) => approval.status === 'requested');
  const activeStage = project.stages?.find((stage) => stage.status !== 'done');

  const breadcrumbItems = [
    { label: 'Inicio', href: `/c/${clientEmail}/projects`, icon: <Home className="h-4 w-4" /> },
    { label: 'Mis proyectos', href: `/c/${clientEmail}/projects`, icon: <FolderKanban className="h-4 w-4" /> },
    { label: project.title }
  ];

  const handleToggleComments = (stageId: string) => {
    // Si estamos abriendo comentarios de una etapa diferente, cerrar el panel de archivos
    if (activeCommentStage !== stageId) {
      setActiveFileStage(null);
    }
    setActiveCommentStage(activeCommentStage === stageId ? null : stageId);
  };

  const handleShareLinks = (stageId: string) => {
    // Si estamos abriendo archivos de una etapa diferente, cerrar el panel de comentarios
    if (activeFileStage !== stageId) {
      setActiveCommentStage(null);
    }
    setActiveFileStage(activeFileStage === stageId ? null : stageId);
  };

  const handleAddComponent = async (stageId: string, componentType: string) => {
    const formData = new FormData();
    formData.append('stageId', stageId);
    formData.append('projectId', project.id);
    formData.append('componentType', componentType);
    formData.append('config', JSON.stringify({}));

    const result = await addStageComponent(null, formData);
    if (result.error) {
      toast.error('Error al agregar componente');
    } else {
      toast.success('Componente agregado correctamente');
    }
  };

  const handleUpdateComponent = async (componentId: string, updates: Partial<StageComponent>) => {
    const formData = new FormData();
    formData.append('componentId', componentId);
    formData.append('projectId', project.id);
    if (updates.title !== undefined) formData.append('title', updates.title || '');
    if (updates.config) formData.append('config', JSON.stringify(updates.config));
    if (updates.status) formData.append('status', updates.status);

    const result = await updateStageComponent(null, formData);

    if (result.error) {
      toast.error('Error al actualizar componente');
    } else {
      toast.success('Componente actualizado correctamente');
      router.refresh();
    }
  };

  const handleDeleteComponent = async (componentId: string) => {
    const formData = new FormData();
    formData.append('componentId', componentId);
    formData.append('projectId', project.id);

    const result = await deleteStageComponent(null, formData);
    if (result.error) {
      toast.error('Error al eliminar componente');
    } else {
      toast.success('Componente eliminado correctamente');
    }
  };

  const handleUpdateStage = async (stageId: string, updates: Partial<Stage>) => {
    const formData = new FormData();
    formData.append('stageId', stageId);
    formData.append('projectId', project.id);
    if (updates.status) formData.append('status', updates.status);
    if (updates.title) formData.append('title', updates.title);
    if (updates.description) formData.append('description', updates.description);
    if (updates.planned_start) formData.append('planned_start', updates.planned_start);
    if (updates.planned_end) formData.append('planned_end', updates.planned_end);
    if (updates.deadline) formData.append('deadline', updates.deadline);

    const result = await updateStage(null, formData);
    if (result.error) {
      toast.error('Error al actualizar etapa');
    } else {
      toast.success('Etapa actualizada correctamente');
    }
  };


  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="hidden sm:block">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Header Completamente Rediseñado - Mobile First */}
      <header className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border/50 shadow-xl bg-gradient-to-br from-white via-brand-50/30 to-brand-100/40 backdrop-blur-sm">
        {/* Gradiente de fondo decorativo */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-brand-600/5"></div>
        <div className="absolute top-0 right-0 w-16 h-16 sm:w-32 sm:h-32 lg:w-72 lg:h-72 bg-gradient-radial from-brand-200/20 to-transparent blur-2xl"></div>

        <div className="relative p-4 sm:p-6 lg:p-8">
          {/* Layout Mobile-First: Stack completo en móvil, grid en desktop */}
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">

            {/* Columna 1: Información del proyecto */}
            <div className="lg:col-span-2 space-y-3">
              {/* Título con ícono */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-xl lg:rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg flex-shrink-0">
                  <FolderKanban className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-foreground bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text leading-tight break-words">
                    {project.title}
                  </h1>

                  {/* Badge de estado - siempre debajo del título */}
                  <div className="mt-2 flex items-center gap-2">
                    {project.overdue ? (
                      <Badge variant="destructive" className="w-fit animate-pulse shadow-sm">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {getProjectStatusText(project.status)}
                      </Badge>
                    ) : project.waiting_on_client ? (
                      <Badge variant="warning" className="w-fit shadow-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {getProjectStatusText(project.status)}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="w-fit shadow-sm">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {getProjectStatusText(project.status)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {project.description && (
                <div className="pl-0 sm:pl-13 lg:pl-15">
                  <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                </div>
              )}

              {/* Etapa actual */}
              {activeStage && (
                <div className="pl-0 sm:pl-13 lg:pl-15">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-100/50 border border-brand-200/50">
                    <Zap className="h-4 w-4 text-brand-600" />
                    <span className="font-medium text-brand-800 text-sm">Etapa actual:</span>
                    <Badge variant="outline" className="text-xs bg-white/80 text-brand-700 border-brand-300">
                      {activeStage.title}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Columna 2: Progreso - En móvil va después del contenido principal */}
            <div className="lg:col-span-1">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-border/30 p-4 lg:p-6">
                <div className="text-center lg:text-right space-y-3">
                  <div className="flex items-center justify-center lg:justify-end gap-2">
                    <Target className="h-5 w-5 text-brand-600" />
                    <p className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
                      {Math.round(project.progress)}%
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                    Progreso del proyecto
                  </p>

                  {/* Barra de progreso */}
                  <div className="relative">
                    <Progress
                      value={project.progress}
                      className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 shadow-inner"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-400/20 to-brand-600/20"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Cronograma Visual */}
      {/* Versión móvil simplificada */}
      <div className="block sm:hidden">
        <MobileTimeline
          stages={project.stages ?? []}
          projectStartDate={project.start_date}
          projectEndDate={project.end_date}
          projectDeadline={project.deadline}
        />
      </div>

      {/* Versión desktop completa */}
      <div className="hidden sm:block">
        <GanttTimeline
          stages={project.stages ?? []}
          projectStartDate={project.start_date}
          projectEndDate={project.end_date}
          projectDeadline={project.deadline}
        />
      </div>

      {/* Grid de Etapas Editables */}
      <section className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">Etapas del Proyecto</h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 ml-8 sm:ml-11 lg:ml-0">
              <Badge variant="outline" className="text-xs shadow-sm">
                <Calendar className="h-3 w-3 mr-1" />
                <span className="hidden xs:inline">{project.stages?.length || 0} etapas</span>
                <span className="xs:hidden">{project.stages?.length || 0}</span>
              </Badge>
              <Badge variant="secondary" className="text-xs shadow-sm bg-green-100 text-green-700 border-green-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                <span className="hidden xs:inline">{project.stages?.filter(s => s.status === 'done').length || 0} completadas</span>
                <span className="xs:hidden">{project.stages?.filter(s => s.status === 'done').length || 0}</span>
              </Badge>
            </div>
          </div>
          <div className="grid gap-2 sm:gap-3 md:gap-4">
            {(project.stages ?? []).map((stage, index) => {
              const isActiveStage = activeStage?.id === stage.id;
              const isCompleted = stage.status === 'done';
              return (
                <div
                  key={stage.id}
                  className={`relative transition-all duration-500 ease-out ${
                    isActiveStage
                      ? 'opacity-100 scale-100'
                      : 'opacity-50 hover:opacity-100 hover:scale-[1.01] scale-95'
                  }`}
                >
                  <EditableStageCard
                    stage={stage}
                    projectId={project.id}
                    comments={project.comments || []}
                    files={project.files || []}
                    onAddComponent={handleAddComponent}
                    onUpdateComponent={handleUpdateComponent}
                    onDeleteComponent={handleDeleteComponent}
                    onUpdateStage={handleUpdateStage}
                    onToggleComments={handleToggleComments}
                    onUploadFiles={handleShareLinks}
                    defaultExpanded={isActiveStage}
                    viewMode="client"
                    currentUserId={currentUserId}
                    clientName={project.client_name}
                    className={`transition-all duration-300 ${
                      isActiveStage
                        ? 'ring-2 ring-brand-500/20 shadow-lg shadow-brand-500/10 bg-gradient-to-br from-white to-brand-50/30'
                        : isCompleted
                        ? 'bg-gradient-to-br from-green-50/50 to-white border-green-200/50'
                        : 'hover:shadow-md hover:ring-1 hover:ring-brand-200/50'
                    }`}
                  />
                  {isActiveStage && (
                    <div className="absolute -left-1 sm:-left-2 top-1/2 -translate-y-1/2 w-0.5 sm:w-1 h-8 sm:h-12 bg-gradient-to-b from-brand-500 to-brand-600 rounded-full shadow-lg animate-pulse"></div>
                  )}
                </div>
              );
            })}
          </div>
      </section>

      {/* Chat Global del Proyecto */}
      <Card className="relative overflow-hidden border-border/50 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
        <div className="absolute top-0 right-0 w-16 h-16 sm:w-32 sm:h-32 bg-gradient-radial from-brand-100/20 to-transparent blur-2xl"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
            Discusión del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {/* <CommentsPanel comments={project.comments ?? []} projectId={project.id} /> */}
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">Los comentarios ahora están organizados por componente específico.</p>
            <p className="text-xs mt-1">Encuentra las discusiones en cada elemento del proyecto.</p>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Links y Minutas - Responsive */}
      <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <ProjectLinksPanel
          links={project.links ?? []}
          projectId={project.id}
          canEdit={false}
        />

        <ProjectMinutesPanel
          minutes={project.minutes ?? []}
          projectId={project.id}
          stages={project.stages ?? []}
          canEdit={false}
        />
      </section>

      {/* Paneles modales */}
      {activeCommentStage && (
        <StageCommentThread
          stageId={activeCommentStage}
          stageTitle={project.stages?.find(s => s.id === activeCommentStage)?.title || 'Etapa'}
          comments={project.comments ?? []}
          isOpen={true}
          onClose={() => setActiveCommentStage(null)}
          projectId={project.id}
          currentUser={currentUser}
          stageComponents={project.stages?.find(s => s.id === activeCommentStage)?.components || []}
          clientName={project.client_name}
        />
      )}

      {activeFileStage && (
        <StageLinkPanel
          stageId={activeFileStage}
          stageTitle={project.stages?.find(s => s.id === activeFileStage)?.title || 'Etapa'}
          links={project.files ?? []}
          isOpen={true}
          onClose={() => setActiveFileStage(null)}
          projectId={project.id}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}

