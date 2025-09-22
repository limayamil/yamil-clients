'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, AlertCircle, Trash2 } from 'lucide-react';
import type { CommentEntry } from '@/types/project';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createComment, deleteComment } from '@/actions/comments';
import { useFormStatus, useFormState } from 'react-dom';
import { toast } from 'sonner';

interface StageCommentThreadProps {
  stageId: string;
  stageTitle: string;
  comments: CommentEntry[];
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentUserId?: string;
  stageComponents?: Array<{ id: string; component_type: string; config?: any }>;
}

const initialState: { error?: string; success?: boolean; message?: string } = {};

export function StageCommentThread({
  stageId,
  stageTitle,
  comments,
  isOpen,
  onClose,
  projectId,
  currentUserId,
  stageComponents = []
}: StageCommentThreadProps) {
  const [state, formAction] = useFormState(createComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Get component IDs for this stage
  const componentIds = stageComponents.map(comp => comp.id);

  // Include both stage-level comments and component-level comments for this stage
  const stageComments = comments.filter(comment =>
    comment.stage_id === stageId ||
    (comment.component_id && componentIds.includes(comment.component_id))
  );

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      return;
    }

    const formData = new FormData();
    formData.append('commentId', commentId);
    formData.append('projectId', projectId);

    const result = await deleteComment(null, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Comentario eliminado correctamente');
    }
  };

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Comentario publicado correctamente');
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  if (!isOpen) return null;

  return (
    <Card className="fixed inset-2 z-50 flex flex-col bg-white shadow-2xl sm:inset-4 md:inset-auto md:right-4 md:top-4 md:bottom-4 md:w-96 lg:w-[420px]">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="h-4 w-4 text-brand-600 flex-shrink-0" />
            <CardTitle className="text-base truncate">Comentarios</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 touch-manipulation">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Badge variant="outline" className="text-xs w-fit">
            {stageTitle}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {stageComments.length} comentario{stageComments.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
        {/* Lista de comentarios */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {stageComments.length > 0 ? (
            stageComments
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((comment) => (
                <div key={comment.id} className="rounded-xl border border-border bg-gray-50 p-3">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={comment.author_type === 'provider' ? 'default' : 'secondary'} className="text-xs">
                        {comment.author_type === 'provider' ? 'Proveedor' : 'Cliente'}
                      </Badge>
                      {comment.component_id && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                          {(() => {
                            const componentType = stageComponents.find(comp => comp.id === comment.component_id)?.component_type;
                            switch (componentType) {
                              case 'checklist': return 'Checklist';
                              case 'upload_request': return 'Subir archivo';
                              case 'approval': return 'Aprobación';
                              case 'text_block': return 'Texto';
                              case 'link': return 'Enlace';
                              case 'milestone': return 'Hito';
                              case 'tasklist': return 'Lista de tareas';
                              case 'prototype': return 'Prototipo';
                              default: return 'Componente';
                            }
                          })()}
                        </Badge>
                      )}
                      <time className="text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </time>
                    </div>
                    {currentUserId && comment.created_by === currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{comment.body}</p>
                </div>
              ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-center py-8">
              <div>
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Sin comentarios en esta etapa</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sé el primero en comentar sobre este tema
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Formulario de nuevo comentario */}
        <div className="flex-shrink-0 border-t border-border pt-4">
          <form ref={formRef} action={formAction} className="space-y-3">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="stageId" value={stageId} />
            <div className="space-y-2">
              <Textarea
                name="body"
                placeholder={`Comenta sobre "${stageTitle}"...`}
                rows={3}
                required
                minLength={1}
                maxLength={1000}
                className="resize-none"
              />
              {state?.error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Comentario específico de esta etapa
              </span>
              <SubmitButton />
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function SubmitButton() {
  const status = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={status.pending} className="h-8">
      <Send className="h-3 w-3 mr-1.5" />
      {status.pending ? 'Enviando...' : 'Enviar'}
    </Button>
  );
}