'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, AlertCircle, Trash2, Edit, Save } from 'lucide-react';
import type { CommentEntry } from '@/types/project';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextViewer } from '@/components/ui/rich-text-viewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createComment, deleteComment, updateComment } from '@/actions/comments';
import { useFormStatus, useFormState } from 'react-dom';
import { toast } from 'sonner';

interface StageCommentThreadProps {
  stageId: string;
  stageTitle: string;
  comments: CommentEntry[];
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentUser?: { id: string; role: 'provider' | 'client' } | null;
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
  currentUser,
  stageComponents = []
}: StageCommentThreadProps) {
  const [state, formAction] = useFormState(createComment, initialState);
  const [editState, editAction] = useFormState(updateComment, initialState);
  const [deleteState, deleteAction] = useFormState(deleteComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');

  // Get component IDs for this stage
  const componentIds = stageComponents.map(comp => comp.id);

  // Include both stage-level comments and component-level comments for this stage
  const stageComments = comments.filter(comment =>
    comment.stage_id === stageId ||
    (comment.component_id && componentIds.includes(comment.component_id))
  );

  // Helper functions for permissions
  const canEditComment = (comment: CommentEntry) => {
    if (!currentUser) return false;
    // User can edit their own comments
    if (comment.created_by === currentUser.id) return true;
    // Providers can edit client comments
    if (currentUser.role === 'provider' && comment.author_type === 'client') return true;
    return false;
  };

  const canDeleteComment = (comment: CommentEntry) => {
    if (!currentUser) return false;
    // User can delete their own comments
    if (comment.created_by === currentUser.id) return true;
    // Providers can delete client comments
    if (currentUser.role === 'provider' && comment.author_type === 'client') return true;
    return false;
  };

  // Handlers
  const handleEditComment = (comment: CommentEntry) => {
    setEditingComment(comment.id);
    setEditContent(comment.body);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return;

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('commentId', commentId);
    formData.append('body', editContent);

    editAction(formData);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleDeleteComment = (commentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('commentId', commentId);

    deleteAction(formData);
  };

  const handleSubmitNewComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('stageId', stageId);
    formData.append('body', newCommentContent);

    formAction(formData);
    setNewCommentContent('');
  };

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Comentario publicado correctamente');
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  useEffect(() => {
    if (editState?.success) {
      toast.success(editState.message || 'Comentario actualizado correctamente');
      setEditingComment(null);
      setEditContent('');
    } else if (editState?.error) {
      toast.error(editState.error);
    }
  }, [editState]);

  useEffect(() => {
    if (deleteState?.success) {
      toast.success(deleteState.message || 'Comentario eliminado correctamente');
    } else if (deleteState?.error) {
      toast.error(deleteState.error);
    }
  }, [deleteState]);

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
                <div key={comment.id} className="rounded-xl border border-border bg-gray-50 p-3 group">
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
                    {/* Action buttons */}
                    {(canEditComment(comment) || canDeleteComment(comment)) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEditComment(comment) && editingComment !== comment.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditComment(comment)}
                            className="h-6 w-6 p-0 hover:bg-blue-100/50 hover:text-blue-700"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {canDeleteComment(comment) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-6 w-6 p-0 hover:bg-red-100/50 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comment content or edit form */}
                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <RichTextEditor
                        value={editContent}
                        onChange={setEditContent}
                        placeholder="Edita tu comentario..."
                        mode="full"
                        maxLength={10000}
                        className="min-h-[60px]"
                        showHtmlEditor={true}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-7 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={!editContent.trim()}
                          className="h-7 text-xs"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <RichTextViewer
                      content={comment.body}
                      className="text-sm text-foreground leading-relaxed"
                      fallback="Comentario vacío"
                    />
                  )}
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
          <form ref={formRef} onSubmit={handleSubmitNewComment} className="space-y-3">
            <div className="space-y-2">
              <RichTextEditor
                value={newCommentContent}
                onChange={setNewCommentContent}
                placeholder={`Comenta sobre "${stageTitle}"...`}
                mode="full"
                maxLength={10000}
                className="min-h-[80px]"
                showHtmlEditor={true}
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
              <Button
                type="submit"
                size="sm"
                disabled={!newCommentContent.trim()}
                className="h-7 text-xs"
              >
                <Send className="h-3 w-3 mr-1" />
                Enviar
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}