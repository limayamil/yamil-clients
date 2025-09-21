'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { addProjectMinute, updateProjectMinute, deleteProjectMinute, getProjectMinute } from '@/actions/project-minutes';
import type { ProjectMinuteEntry } from '@/types/project';
import { Calendar, Plus, Edit, Trash2, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface ProjectMinutesPanelProps {
  minutes: ProjectMinuteEntry[];
  projectId: string;
  canEdit?: boolean;
}

interface MinuteDialogState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  minuteId?: string;
  title: string;
  selectedDate: string;
  content: string;
}

export function ProjectMinutesPanel({ minutes, projectId, canEdit = false }: ProjectMinutesPanelProps) {
  const [dialogState, setDialogState] = useState<MinuteDialogState>({
    isOpen: false,
    mode: 'view',
    title: '',
    selectedDate: '',
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMinute, setIsLoadingMinute] = useState(false);

  // Ordenar minutas por fecha descendente
  const sortedMinutes = [...minutes].sort((a, b) =>
    new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
  );

  const openCreateDialog = () => {
    const today = new Date().toISOString().split('T')[0];
    setDialogState({
      isOpen: true,
      mode: 'create',
      title: '',
      selectedDate: today,
      content: '',
    });
  };

  const openMinuteDialog = async (minute: ProjectMinuteEntry, mode: 'edit' | 'view') => {
    setIsLoadingMinute(true);
    setDialogState({
      isOpen: true,
      mode,
      minuteId: minute.id,
      title: minute.title || '',
      selectedDate: minute.meeting_date,
      content: minute.content_markdown,
    });
    setIsLoadingMinute(false);
  };

  const closeDialog = () => {
    setDialogState({
      isOpen: false,
      mode: 'view',
      title: '',
      selectedDate: '',
      content: '',
    });
  };

  const handleSave = async () => {
    if (!dialogState.selectedDate.trim()) {
      toast.error('La fecha es requerida');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('projectId', projectId);
    if (dialogState.title.trim()) {
      formData.append('title', dialogState.title.trim());
    }
    formData.append('meetingDate', dialogState.selectedDate);
    formData.append('contentMarkdown', dialogState.content);

    let result;
    if (dialogState.mode === 'create') {
      result = await addProjectMinute(formData);
    } else if (dialogState.mode === 'edit' && dialogState.minuteId) {
      formData.append('minuteId', dialogState.minuteId);
      result = await updateProjectMinute(formData);
    }

    if (result?.error) {
      toast.error(
        dialogState.mode === 'create'
          ? 'Error al crear la minuta'
          : 'Error al actualizar la minuta'
      );
      console.error('Error saving minute:', result.error);
    } else {
      toast.success(
        dialogState.mode === 'create'
          ? 'Minuta creada correctamente'
          : 'Minuta actualizada correctamente'
      );
      closeDialog();
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (minuteId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta minuta?')) {
      return;
    }

    const formData = new FormData();
    formData.append('minuteId', minuteId);
    formData.append('projectId', projectId);

    const result = await deleteProjectMinute(formData);

    if (result.error) {
      toast.error('Error al eliminar la minuta');
      console.error('Error deleting minute:', result.error);
    } else {
      toast.success('Minuta eliminada correctamente');
      closeDialog();
    }
  };

  // Renderizar contenido markdown simplificado
  const renderMarkdown = (content: string) => {
    if (!content.trim()) return <p className="text-gray-500 italic">Sin contenido</p>;

    return (
      <div className="prose prose-sm max-w-none">
        {content.split('\n').map((line, index) => {
          if (line.startsWith('# ')) {
            return <h1 key={index} className="text-lg font-bold mb-2">{line.slice(2)}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={index} className="text-base font-semibold mb-2">{line.slice(3)}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={index} className="text-sm font-medium mb-1">{line.slice(4)}</h3>;
          }
          if (line.startsWith('- ')) {
            return <li key={index} className="text-sm mb-1">{line.slice(2)}</li>;
          }
          if (line.trim() === '') {
            return <br key={index} />;
          }
          return <p key={index} className="text-sm mb-2">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      <Card className="relative overflow-hidden border-border/50 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-purple-100/20 to-transparent blur-2xl"></div>

        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg">
                <FileText className="h-4 w-4 text-white" />
              </div>
              Minutas de Reuniones
            </CardTitle>
            {canEdit && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs shadow-sm">
                  {minutes.length} minutas
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openCreateDialog}
                  className="h-8 px-3"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Nueva
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative space-y-3">
          {sortedMinutes.length > 0 ? (
            <div className="space-y-3">
              {sortedMinutes.map((minute) => (
                <div
                  key={minute.id}
                  className="group rounded-xl border border-purple-200/50 bg-gradient-to-r from-purple-50/50 to-white p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => openMinuteDialog(minute, 'view')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-1">
                        <Calendar className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {minute.title || `Reunión ${formatDate(minute.meeting_date)}`}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(minute.meeting_date)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(minute.updated_at)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-3">
                          {minute.content_markdown.trim() ? (
                            <div className="prose prose-xs max-w-none">
                              {minute.content_markdown.split('\n').slice(0, 3).map((line, i) => (
                                <span key={i}>
                                  {line.replace(/^#+\s*/, '').replace(/^-\s*/, '• ')}
                                  {i < 2 && <br />}
                                </span>
                              ))}
                              {minute.content_markdown.split('\n').length > 3 && '...'}
                            </div>
                          ) : (
                            <span className="italic text-gray-400">Sin contenido</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMinuteDialog(minute, 'edit');
                          }}
                          className="h-8 w-8 p-0 hover:bg-purple-100"
                          title="Editar minuta"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(minute.id);
                          }}
                          className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                          title="Eliminar minuta"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">No hay minutas registradas</p>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openCreateDialog}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Crear primera minuta
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar/ver minutas */}
      <Dialog open={dialogState.isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="minute-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {dialogState.mode === 'create' && 'Nueva Minuta'}
              {dialogState.mode === 'edit' && 'Editar Minuta'}
              {dialogState.mode === 'view' && 'Ver Minuta'}
            </DialogTitle>
          </DialogHeader>
          <div id="minute-dialog-description" className="sr-only">
            {dialogState.mode === 'create' && 'Crear una nueva minuta de reunión con fecha y contenido en markdown'}
            {dialogState.mode === 'edit' && 'Editar el contenido y la fecha de la minuta seleccionada'}
            {dialogState.mode === 'view' && 'Ver el contenido de la minuta seleccionada'}
          </div>

          <div className="space-y-4">
            {/* Campo de título */}
            <div>
              <label className="block text-sm font-medium mb-2">Título de la minuta</label>
              <input
                type="text"
                value={dialogState.title}
                onChange={(e) => setDialogState(prev => ({ ...prev, title: e.target.value }))}
                disabled={dialogState.mode === 'view' || isLoadingMinute}
                placeholder="Ej: Reunión de seguimiento, Presentación de propuesta..."
                maxLength={200}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Si se deja vacío, se usará automáticamente &quot;Reunión&quot; + fecha
              </p>
            </div>

            {/* Campo de fecha */}
            <div>
              <label className="block text-sm font-medium mb-2">Fecha de la reunión</label>
              <input
                type="date"
                value={dialogState.selectedDate}
                onChange={(e) => setDialogState(prev => ({ ...prev, selectedDate: e.target.value }))}
                disabled={dialogState.mode === 'view' || isLoadingMinute}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            {/* Editor de contenido */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Contenido de la minuta
                {dialogState.mode !== 'view' && (
                  <span className="text-xs text-gray-500 ml-2">(Markdown soportado)</span>
                )}
              </label>

              {dialogState.mode === 'view' ? (
                <div className="min-h-[300px] p-4 border border-gray-200 rounded-lg bg-gray-50">
                  {renderMarkdown(dialogState.content)}
                </div>
              ) : (
                <textarea
                  value={dialogState.content}
                  onChange={(e) => setDialogState(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Escribe el contenido de la minuta aquí...

Puedes usar markdown:
# Título principal
## Subtítulo
- Punto importante
- Otro punto"
                  disabled={isLoadingMinute}
                  className="w-full min-h-[300px] px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  maxLength={50000}
                />
              )}
            </div>

            {/* Preview en modo edición */}
            {(dialogState.mode === 'create' || dialogState.mode === 'edit') && dialogState.content.trim() && (
              <div>
                <label className="block text-sm font-medium mb-2">Vista previa</label>
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                  {renderMarkdown(dialogState.content)}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                {dialogState.mode === 'view' && canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => setDialogState(prev => ({ ...prev, mode: 'edit' }))}
                    className="mr-2"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                >
                  {dialogState.mode === 'view' ? 'Cerrar' : 'Cancelar'}
                </Button>

                {(dialogState.mode === 'create' || dialogState.mode === 'edit') && (
                  <Button
                    onClick={handleSave}
                    disabled={isSubmitting || !dialogState.selectedDate.trim()}
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}