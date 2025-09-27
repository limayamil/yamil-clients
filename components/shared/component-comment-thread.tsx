'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, ChevronDown, ChevronUp, AlertCircle, Edit, Trash2, Save, X } from 'lucide-react';
import type { CommentEntry } from '@/types/project';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextViewer } from '@/components/ui/rich-text-viewer';
import { createComment, updateComment, deleteComment } from '@/actions/comments';
import { useFormStatus, useFormState } from 'react-dom';
import { toast } from 'sonner';

interface ComponentCommentThreadProps {
  componentId: string;
  componentTitle: string;
  projectId: string;
  comments: CommentEntry[];
  isCompact?: boolean;
  currentUser?: { id: string; role: 'provider' | 'client' } | null;
}

const initialState: { error?: string; success?: boolean; message?: string } = {};

export function ComponentCommentThread({
  componentId,
  componentTitle,
  projectId,
  comments,
  isCompact = true,
  currentUser
}: ComponentCommentThreadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [state, formAction] = useFormState(createComment, initialState);
  const [editState, editAction] = useFormState(updateComment, initialState);
  const [deleteState, deleteAction] = useFormState(deleteComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const componentComments = comments.filter(comment => comment.component_id === componentId);
  const unreadCount = componentComments.length; // TODO: Implement actual unread logic

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

  if (isCompact && !isExpanded) {
    return (
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="h-8 gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="h-3 w-3" />
          {componentComments.length > 0 ? (
            <>
              {componentComments.length} comentario{componentComments.length !== 1 ? 's' : ''}
              {unreadCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </>
          ) : (
            'Comentar'
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-gray-50/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="h-4 w-4 text-brand-600 flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            Comentarios - {componentTitle}
          </span>
          {componentComments.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {componentComments.length}
            </Badge>
          )}
        </div>
        {isCompact && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-6 w-6 p-0"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Lista de comentarios */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {componentComments.length > 0 ? (
          componentComments
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((comment) => (
              <div key={comment.id} className="rounded-lg border border-border bg-white p-2.5 group">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={comment.author_type === 'provider' ? 'default' : 'secondary'}
                      className="text-xs h-5"
                    >
                      {comment.author_type === 'provider' ? 'Proveedor' : 'Cliente'}
                    </Badge>
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
          <div className="text-center py-4">
            <MessageSquare className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Sin comentarios sobre este componente</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inicia la conversación
            </p>
          </div>
        )}
      </div>

      {/* Formulario de nuevo comentario */}
      <div className="border-t border-border pt-3">
        <CommentForm
          projectId={projectId}
          componentId={componentId}
          componentTitle={componentTitle}
          formRef={formRef}
          formAction={formAction}
          state={state}
        />
      </div>
    </div>
  );
}

interface CommentFormProps {
  projectId: string;
  componentId: string;
  componentTitle: string;
  formRef: React.RefObject<HTMLFormElement>;
  formAction: (formData: FormData) => void;
  state: { error?: string; success?: boolean; message?: string };
}

function CommentForm({ projectId, componentId, componentTitle, formRef, formAction, state }: CommentFormProps) {
  const [commentContent, setCommentContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('componentId', componentId);
    formData.append('body', commentContent);

    formAction(formData);
    setCommentContent('');
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
      <div className="space-y-2">
        <RichTextEditor
          value={commentContent}
          onChange={setCommentContent}
          placeholder={`Comenta sobre "${componentTitle}"...`}
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
          Comentario específico de este componente
        </span>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const status = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={status.pending} className="h-7 text-xs">
      <Send className="h-3 w-3 mr-1" />
      {status.pending ? 'Enviando...' : 'Enviar'}
    </Button>
  );
}