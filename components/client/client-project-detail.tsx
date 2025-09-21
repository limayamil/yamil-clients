'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ActivityPanel } from '@/components/shared/activity-panel';
import { CommentsPanel } from '@/components/shared/comments-panel';
import dynamic from 'next/dynamic';

const GanttTimeline = dynamic(
  () => import('@/components/client/gantt-timeline').then(mod => ({ default: mod.GanttTimeline })),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-40 rounded"></div>,
    ssr: false
  }
);
import { EditableStageCard } from '@/components/client/editable-stage-card';
import { StageCommentThread } from '@/components/client/stage-comment-thread';
import { StageFileDropzone } from '@/components/client/stage-file-dropzone';
import type { ProjectSummary, Stage, StageComponent } from '@/types/project';
import { Home, FolderKanban, Clock, Calendar, Target, Users, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { addStageComponent, updateStageComponent, deleteStageComponent, updateStage } from '@/actions/stages';
import { toast } from 'sonner';

interface ClientProjectDetailProps {
  project: ProjectSummary;
  clientEmail: string;
}

export function ClientProjectDetail({ project, clientEmail }: ClientProjectDetailProps) {
  const [activeCommentStage, setActiveCommentStage] = useState<string | null>(null);
  const [activeFileStage, setActiveFileStage] = useState<string | null>(null);
  const pendingApproval = project.approvals?.find((approval) => approval.status === 'requested');
  const activeStage = project.stages?.find((stage) => stage.status !== 'done');

  const breadcrumbItems = [
    { label: 'Inicio', href: `/c/${clientEmail}/projects`, icon: <Home className="h-4 w-4" /> },
    { label: 'Mis proyectos', href: `/c/${clientEmail}/projects`, icon: <FolderKanban className="h-4 w-4" /> },
    { label: project.title }
  ];

  const handleToggleComments = (stageId: string) => {
    setActiveCommentStage(activeCommentStage === stageId ? null : stageId);
    setActiveFileStage(null);
  };

  const handleUploadFiles = (stageId: string) => {
    setActiveFileStage(activeFileStage === stageId ? null : stageId);
    setActiveCommentStage(null);
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
      console.error('Error adding component:', result.error);
    } else {
      toast.success('Componente agregado correctamente');
    }
  };

  const handleUpdateComponent = async (componentId: string, updates: Partial<StageComponent>) => {
    const formData = new FormData();
    formData.append('componentId', componentId);
    formData.append('projectId', project.id);
    if (updates.config) formData.append('config', JSON.stringify(updates.config));
    if (updates.status) formData.append('status', updates.status);

    const result = await updateStageComponent(null, formData);
    if (result.error) {
      toast.error('Error al actualizar componente');
      console.error('Error updating component:', result.error);
    } else {
      toast.success('Componente actualizado correctamente');
    }
  };

  const handleDeleteComponent = async (componentId: string) => {
    const formData = new FormData();
    formData.append('componentId', componentId);
    formData.append('projectId', project.id);

    const result = await deleteStageComponent(null, formData);
    if (result.error) {
      toast.error('Error al eliminar componente');
      console.error('Error deleting component:', result.error);
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

    const result = await updateStage(null, formData);
    if (result.error) {
      toast.error('Error al actualizar etapa');
      console.error('Error updating stage:', result.error);
    } else {
      toast.success('Etapa actualizada correctamente');
    }
  };

  return (
    <div className="space-y-8">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header Mejorado */}
      <header className="relative overflow-hidden rounded-3xl border border-border/50 shadow-xl bg-gradient-to-br from-white via-brand-50/30 to-brand-100/40 backdrop-blur-sm">
        {/* Gradiente de fondo decorativo */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-brand-600/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-brand-200/20 to-transparent blur-3xl"></div>

        <div className="relative p-4 md:p-6 lg:p-8">
          <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg">
                    <FolderKanban className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-foreground truncate bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                    {project.title}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  {project.overdue ? (
                    <Badge variant="destructive" className="w-fit animate-pulse shadow-sm">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {project.status}
                    </Badge>
                  ) : project.waiting_on_client ? (
                    <Badge variant="warning" className="w-fit shadow-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {project.status}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="w-fit shadow-sm">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {project.status}
                    </Badge>
                  )}
                </div>
              </div>

              {project.description && (
                <p className="text-sm md:text-base text-muted-foreground line-clamp-2 pl-13">
                  {project.description}
                </p>
              )}

              {activeStage && (
                <div className="flex items-center gap-2 text-sm pl-13">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-100/50 border border-brand-200/50">
                    <Zap className="h-4 w-4 text-brand-600" />
                    <span className="font-medium text-brand-800">Etapa actual:</span>
                    <Badge variant="outline" className="text-xs bg-white/80 text-brand-700 border-brand-300">
                      {activeStage.title}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-row sm:flex-wrap lg:flex-col items-start sm:items-center gap-4 lg:items-end">
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
      </header>

      {/* Cronograma Gantt */}
      <GanttTimeline
        stages={project.stages ?? []}
        projectStartDate={project.start_date}
        projectEndDate={project.end_date}
      />

      {/* Grid de Etapas Editables */}
      <section className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground">Etapas del Proyecto</h2>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs shadow-sm">
                <Calendar className="h-3 w-3 mr-1" />
                {project.stages?.length || 0} etapas
              </Badge>
              <Badge variant="secondary" className="text-xs shadow-sm bg-green-100 text-green-700 border-green-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {project.stages?.filter(s => s.status === 'done').length || 0} completadas
              </Badge>
            </div>
          </div>
          <div className="grid gap-3 md:gap-4">
            {(project.stages ?? []).map((stage, index) => {
              const isActiveStage = activeStage?.id === stage.id;
              const isCompleted = stage.status === 'done';
              return (
                <div
                  key={stage.id}
                  className={`transition-all duration-500 ease-out ${
                    isActiveStage
                      ? 'opacity-100 scale-100'
                      : 'opacity-50 hover:opacity-100 hover:scale-[1.01] scale-95'
                  }`}
                >
                  <EditableStageCard
                    stage={stage}
                    onAddComponent={handleAddComponent}
                    onUpdateComponent={handleUpdateComponent}
                    onDeleteComponent={handleDeleteComponent}
                    onUpdateStage={handleUpdateStage}
                    onToggleComments={handleToggleComments}
                    onUploadFiles={handleUploadFiles}
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

      {/* Chat Global del Proyecto */}
      <Card className="relative overflow-hidden border-border/50 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-brand-100/20 to-transparent blur-2xl"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
            Discusión del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <CommentsPanel comments={project.comments ?? []} projectId={project.id} />
        </CardContent>
      </Card>

      {/* Paneles modales */}
      {activeCommentStage && (
        <StageCommentThread
          stageId={activeCommentStage}
          stageTitle={project.stages?.find(s => s.id === activeCommentStage)?.title || 'Etapa'}
          comments={project.comments ?? []}
          isOpen={true}
          onClose={() => setActiveCommentStage(null)}
          projectId={project.id}
        />
      )}

      {activeFileStage && (
        <StageFileDropzone
          stageId={activeFileStage}
          stageTitle={project.stages?.find(s => s.id === activeFileStage)?.title || 'Etapa'}
          files={project.files ?? []}
          isOpen={true}
          onClose={() => setActiveFileStage(null)}
          projectId={project.id}
        />
      )}
    </div>
  );
}

