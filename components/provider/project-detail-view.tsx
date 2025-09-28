'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Progress } from '@/components/ui/progress';
import { EditableText } from '@/components/ui/editable-text';
import { EditableDate } from '@/components/ui/editable-date';
import { EditableDateTile } from '@/components/ui/editable-date-tile';
import { EditableStatus } from '@/components/ui/editable-status';
import { EditableStageSelector } from '@/components/ui/editable-stage-selector';
// import { CommentsPanel } from '@/components/shared/comments-panel';
import { ActivityPanel } from '@/components/shared/activity-panel';
import { ProjectLinksPanel } from '@/components/shared/project-links-panel';
import { ProjectMinutesPanel } from '@/components/shared/project-minutes-panel';
import { GanttTimeline } from '@/components/client/gantt-timeline';
import { MobileTimeline } from '@/components/client/mobile-timeline';
import { EditableStageCard } from '@/components/client/editable-stage-card';
import { StageCommentThread } from '@/components/client/stage-comment-thread';
import { StageLinkPanel } from '@/components/client/stage-link-panel';
import type { ProjectSummary, ProjectStatus, StageComponent, Stage } from '@/types/project';
import { formatDate, formatCurrency } from '@/lib/utils';
import { updateProjectBasicInfo, updateProjectDates, updateProjectStatus, updateProjectCurrentStage } from '@/actions/projects';
import { addStageComponent, updateStageComponent, deleteStageComponent, updateStage, reorderStageComponents } from '@/actions/stages';
import { Home, FolderKanban, Clock, Calendar, Target, Users, CheckCircle2, AlertCircle, Zap, Settings, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectMembersManager } from './project-members-manager';
import { StageManagementPanel } from './stage-management-panel';

interface ProjectDetailViewProps {
  project: ProjectSummary;
  currentUserId?: string;
}

export function ProjectDetailView({ project, currentUserId }: ProjectDetailViewProps) {
  const [activeCommentStage, setActiveCommentStage] = useState<string | null>(null);
  const [activeFileStage, setActiveFileStage] = useState<string | null>(null);

  // Create current user object for comment permissions
  const currentUser = currentUserId ? { id: currentUserId, role: 'provider' as const } : null;
  const activeStage = project.stages?.find((stage) => stage.status !== 'done');

  const breadcrumbItems = [
    { label: 'Panel de control', href: '/dashboard', icon: <Home className="h-4 w-4" /> },
    { label: 'Proyectos', href: '/dashboard', icon: <FolderKanban className="h-4 w-4" /> },
    { label: project.title }
  ];

  const handleUpdateTitle = async (newTitle: string) => {
    const formData = new FormData();
    formData.append('projectId', project.id);
    formData.append('title', newTitle);
    formData.append('description', project.description || '');

    const result = await updateProjectBasicInfo(formData);
    if (result.error) {
      toast.error('Error al actualizar el título');
      throw new Error('Error updating title');
    } else {
      toast.success('Título actualizado correctamente');
    }
  };

  const handleUpdateDescription = async (newDescription: string) => {
    const formData = new FormData();
    formData.append('projectId', project.id);
    formData.append('title', project.title);
    formData.append('description', newDescription);

    const result = await updateProjectBasicInfo(formData);
    if (result.error) {
      toast.error('Error al actualizar la descripción');
      throw new Error('Error updating description');
    } else {
      toast.success('Descripción actualizada correctamente');
    }
  };

  const handleUpdateDeadline = async (newDeadline: string | null) => {
    const formData = new FormData();
    formData.append('projectId', project.id);
    if (newDeadline) formData.append('deadline', newDeadline);

    const result = await updateProjectDates(formData);
    if (result.error) {
      toast.error('Error al actualizar la fecha límite');
      throw new Error('Error updating deadline');
    } else {
      toast.success('Fecha límite actualizada correctamente');
    }
  };

  const handleUpdateStartDate = async (newStartDate: string | null) => {
    const formData = new FormData();
    formData.append('projectId', project.id);
    if (newStartDate) formData.append('startDate', newStartDate);

    const result = await updateProjectDates(formData);
    if (result.error) {
      toast.error('Error al actualizar la fecha de inicio');
      throw new Error('Error updating start date');
    } else {
      toast.success('Fecha de inicio actualizada correctamente');
    }
  };

  const handleUpdateEndDate = async (newEndDate: string | null) => {
    const formData = new FormData();
    formData.append('projectId', project.id);
    if (newEndDate) formData.append('endDate', newEndDate);

    const result = await updateProjectDates(formData);
    if (result.error) {
      toast.error('Error al actualizar la fecha de finalización');
      throw new Error('Error updating end date');
    } else {
      toast.success('Fecha de finalización actualizada correctamente');
    }
  };

  const handleUpdateStatus = async (newStatus: ProjectStatus) => {
    const formData = new FormData();
    formData.append('projectId', project.id);
    formData.append('status', newStatus);

    const result = await updateProjectStatus(formData);
    if (result.error) {
      toast.error('Error al actualizar el estado del proyecto');
      throw new Error('Error updating project status');
    } else {
      toast.success('Estado del proyecto actualizado correctamente');
    }
  };

  const handleUpdateCurrentStage = async (newStageId: string | null) => {
    const formData = new FormData();
    formData.append('projectId', project.id);
    formData.append('currentStageId', newStageId || '');

    const result = await updateProjectCurrentStage(formData);
    if (result.error) {
      toast.error('Error al cambiar la etapa actual');
      throw new Error('Error updating current stage');
    } else {
      toast.success('Etapa actual actualizada correctamente');
    }
  };

  const handleToggleComments = (stageId: string) => {
    setActiveCommentStage(activeCommentStage === stageId ? null : stageId);
    setActiveFileStage(null);
  };

  const handleShareLinks = (stageId: string) => {
    setActiveFileStage(activeFileStage === stageId ? null : stageId);
    setActiveCommentStage(null);
  };

  const handleAddComponent = async (stageId: string, componentType: string) => {
    // Mostrar feedback inmediato
    toast.loading('Agregando componente...', { id: `add-${stageId}` });

    try {
      const formData = new FormData();
      formData.append('stageId', stageId);
      formData.append('projectId', project.id);
      formData.append('componentType', componentType);
      formData.append('config', JSON.stringify({}));

      const result = await addStageComponent(null, formData);

      if (result.error) {
        toast.error('Error al agregar componente', { id: `add-${stageId}` });
        console.error('Error adding component:', result.error);
      } else {
        toast.success('Componente agregado correctamente', { id: `add-${stageId}` });
      }
    } catch (error) {
      toast.error('Error al agregar componente', { id: `add-${stageId}` });
      console.error('Error adding component:', error);
    }
  };

  const handleUpdateComponent = async (componentId: string, updates: Partial<StageComponent>) => {
    // Mostrar feedback inmediato
    toast.loading('Actualizando componente...', { id: `update-${componentId}` });

    try {
      const formData = new FormData();
      formData.append('componentId', componentId);
      formData.append('projectId', project.id);
      if (updates.config) formData.append('config', JSON.stringify(updates.config));
      if (updates.status) formData.append('status', updates.status);
      if (updates.title) formData.append('title', updates.title);

      const result = await updateStageComponent(null, formData);

      if (result.error) {
        toast.error('Error al actualizar componente', { id: `update-${componentId}` });
        console.error('Error updating component:', result.error);
      } else {
        toast.success('Componente actualizado correctamente', { id: `update-${componentId}` });
      }
    } catch (error) {
      toast.error('Error al actualizar componente', { id: `update-${componentId}` });
      console.error('Error updating component:', error);
    }
  };

  const handleDeleteComponent = async (componentId: string) => {
    // Mostrar confirmación con animación
    toast.loading('Eliminando componente...', { id: `delete-${componentId}` });

    try {
      const formData = new FormData();
      formData.append('componentId', componentId);
      formData.append('projectId', project.id);

      const result = await deleteStageComponent(null, formData);

      if (result.error) {
        toast.error('Error al eliminar componente', { id: `delete-${componentId}` });
        console.error('Error deleting component:', result.error);
      } else {
        toast.success('Componente eliminado correctamente', { id: `delete-${componentId}` });
      }
    } catch (error) {
      toast.error('Error al eliminar componente', { id: `delete-${componentId}` });
      console.error('Error deleting component:', error);
    }
  };

  const handleReorderComponents = async (stageId: string, componentIds: string[]) => {
    try {
      const formData = new FormData();
      formData.append('projectId', project.id);
      formData.append('stageId', stageId);

      // Add each component ID to the form data
      componentIds.forEach(id => {
        formData.append('componentIds', id);
      });

      const result = await reorderStageComponents(null, formData);

      if (result.error) {
        toast.error('Error al reordenar componentes');
        console.error('Error reordering components:', result.error);
      } else {
        toast.success('Componentes reordenados correctamente');
      }
    } catch (error) {
      toast.error('Error al reordenar componentes');
      console.error('Error reordering components:', error);
    }
  };

  const handleUpdateStage = async (stageId: string, updates: Partial<Stage>) => {
    // Determinar el tipo de actualización para el mensaje apropiado
    const updateType = updates.status ? 'estado de la etapa' : 'etapa';
    toast.loading(`Actualizando ${updateType}...`, { id: `stage-${stageId}` });

    try {
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
        toast.error(`Error al actualizar ${updateType}`, { id: `stage-${stageId}` });
        console.error('Error updating stage:', result.error);
      } else {
        toast.success(`${updateType.charAt(0).toUpperCase() + updateType.slice(1)} actualizada correctamente`, { id: `stage-${stageId}` });
      }
    } catch (error) {
      toast.error(`Error al actualizar ${updateType}`, { id: `stage-${stageId}` });
      console.error('Error updating stage:', error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="hidden sm:block">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Header Mejorado */}
      <header className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border/50 shadow-xl bg-gradient-to-br from-white via-brand-50/30 to-brand-100/40 backdrop-blur-sm mobile-safe-container">
        {/* Gradiente de fondo decorativo */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-brand-600/5"></div>
        <div className="absolute top-0 right-0 w-16 h-16 sm:w-32 sm:h-32 lg:w-96 lg:h-96 bg-gradient-radial from-brand-200/20 to-transparent blur-2xl lg:blur-3xl"></div>

        <div className="relative p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 min-w-0 flex-1 mobile-flex-safe">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1 mobile-flex-safe">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg flex-shrink-0">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <EditableText
                    value={project.title}
                    onSave={handleUpdateTitle}
                    className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text mobile-text-safe flex-1"
                    editClassName="text-2xl md:text-3xl font-semibold"
                    maxLength={200}
                    placeholder="Título del proyecto"
                  />
                </div>
                <EditableStatus
                  value={project.status}
                  onSave={handleUpdateStatus}
                />
              </div>

              <div className="pl-0 sm:pl-13 mobile-flex-safe">
                <EditableText
                  value={project.description || ''}
                  onSave={handleUpdateDescription}
                  className="text-sm md:text-base text-muted-foreground line-clamp-2 mobile-text-safe"
                  editClassName="text-sm md:text-base"
                  placeholder="Hacer clic para agregar descripción..."
                  multiline={true}
                  maxLength={1000}
                />
              </div>

              {project.stages && project.stages.length > 0 && (
                <div className="pl-0 sm:pl-13">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-100/50 border border-brand-200/50">
                      <Zap className="h-4 w-4 text-brand-600" />
                      <span className="font-medium text-brand-800">Gestión de etapa:</span>
                      <EditableStageSelector
                        stages={project.stages}
                        currentStageId={activeStage?.id}
                        onSave={handleUpdateCurrentStage}
                        className="text-xs bg-white/80 text-brand-700 border-brand-300"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-row sm:flex-wrap lg:flex-col items-start sm:items-center gap-3 lg:items-end">
                <div className="text-left sm:text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <Target className="h-4 w-4 text-brand-600" />
                    <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
                      {Math.round(project.progress)}%
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Progreso</p>
                </div>
                <div className="w-full sm:w-32 lg:w-48">
                  <div className="relative">
                    <Progress
                      value={project.progress}
                      className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 shadow-inner"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-400/20 to-brand-600/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4 sm:mt-6 grid-mobile-safe">
            <div className="rounded-xl sm:rounded-2xl border border-border/50 bg-gradient-to-br from-white to-blue-50/30 p-3 sm:p-4 shadow-sm space-y-2 mobile-safe-container">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <p className="text-xs uppercase text-muted-foreground">Cliente</p>
              </div>
              <p className="text-base sm:text-lg font-semibold text-foreground mobile-text-safe">{project.client_name}</p>
            </div>
            <EditableDateTile
              label="Fecha límite"
              value={project.deadline}
              onSave={handleUpdateDeadline}
            />
            <div className="rounded-xl sm:rounded-2xl border border-border/50 bg-gradient-to-br from-white to-green-50/30 p-3 sm:p-4 shadow-sm space-y-2 sm:col-span-2 lg:col-span-1 mobile-safe-container">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-xs uppercase text-muted-foreground">Fechas del proyecto</p>
              </div>
              <div className="space-y-1">
                <EditableDate
                  value={project.start_date}
                  onSave={handleUpdateStartDate}
                  placeholder="Sin fecha de inicio"
                  label="Inicio"
                  className="text-sm mobile-text-safe"
                />
                <EditableDate
                  value={project.end_date}
                  onSave={handleUpdateEndDate}
                  placeholder="Sin fecha de fin"
                  label="Fin"
                  className="text-sm mobile-text-safe"
                />
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
      <section className="space-y-4 md:space-y-6 stage-container-mobile">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 mobile-flex-safe">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground mobile-text-safe">Etapas del Proyecto</h2>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge variant="outline" className="text-xs shadow-sm stage-badge-mobile">
                <Calendar className="h-3 w-3 mr-1" />
                <span className="hidden xs:inline">{project.stages?.length || 0} etapas</span>
                <span className="xs:hidden">{project.stages?.length || 0}</span>
              </Badge>
              <Badge variant="secondary" className="text-xs shadow-sm bg-green-100 text-green-700 border-green-300 stage-badge-mobile">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                <span className="hidden xs:inline">{project.stages?.filter(s => s.status === 'done').length || 0} completadas</span>
                <span className="xs:hidden">{project.stages?.filter(s => s.status === 'done').length || 0}</span>
              </Badge>
            </div>
          </div>
          <div className="grid gap-3 md:gap-4 stage-container-mobile">
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
                    onReorderComponents={handleReorderComponents}
                    onUpdateStage={handleUpdateStage}
                    onToggleComments={handleToggleComments}
                    onUploadFiles={handleShareLinks}
                    defaultExpanded={isActiveStage}
                    viewMode="provider"
                    currentUserId={currentUserId}
                    clientName={project.client_name}
                    providerName={project.provider_name}
                    className={`transition-all duration-300 ${
                      isActiveStage
                        ? 'ring-2 ring-brand-500/20 shadow-lg shadow-brand-500/10 bg-gradient-to-br from-white to-brand-50/30'
                        : isCompleted
                        ? 'bg-gradient-to-br from-green-50/50 to-white border-green-200/50'
                        : 'hover:shadow-md hover:ring-1 hover:ring-brand-200/50'
                    }`}
                  />
                  {isActiveStage && (
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-brand-500 to-brand-600 rounded-full shadow-lg animate-pulse"></div>
                  )}
                </div>
              );
            })}
          </div>
      </section>

      {/* Gestión de Miembros del Proyecto - Oculto en mobile */}
      <section className="space-y-4 panel-mobile-safe hidden sm:block">
        <div className="flex items-center gap-3 mobile-flex-safe">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg flex-shrink-0">
            <UserCheck className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-foreground mobile-text-safe">Acceso del Cliente</h2>
        </div>
        <ProjectMembersManager
          projectId={project.id}
          members={project.project_members || []}
        />
      </section>

      {/* Gestión de Etapas - Oculto en mobile */}
      <div className="hidden sm:block">
        <StageManagementPanel
          stages={project.stages ?? []}
          projectId={project.id}
          onStagesUpdated={() => {
            // This would trigger a refetch in the actual implementation
            window.location.reload();
          }}
        />
      </div>

      {/* Sección de Links y Minutas */}
      <section className="grid gap-4 sm:gap-6 lg:grid-cols-2 panel-mobile-safe grid-mobile-safe">
        <ProjectLinksPanel
          links={project.links ?? []}
          projectId={project.id}
          canEdit={true}
        />

        <ProjectMinutesPanel
          minutes={project.minutes ?? []}
          projectId={project.id}
          stages={project.stages ?? []}
          canEdit={true}
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
          providerName={project.provider_name}
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

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
