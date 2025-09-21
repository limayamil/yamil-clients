'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { CommentEntry } from '@/types/project';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createComment } from '@/actions/comments';
import { useFormStatus, useFormState } from 'react-dom';
import { toast } from 'sonner';

interface ComponentCommentThreadProps {
  componentId: string;
  componentTitle: string;
  projectId: string;
  comments: CommentEntry[];
  isCompact?: boolean;
}

const initialState: { error?: string; success?: boolean; message?: string } = {};

export function ComponentCommentThread({
  componentId,
  componentTitle,
  projectId,
  comments,
  isCompact = true
}: ComponentCommentThreadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [state, formAction] = useFormState(createComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);

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
              <div key={comment.id} className="rounded-lg border border-border bg-white p-2.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
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
                <p className="text-sm text-foreground leading-relaxed">{comment.body}</p>
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
        <form ref={formRef} action={formAction} className="space-y-2">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="componentId" value={componentId} />
          <div className="space-y-2">
            <Textarea
              name="body"
              placeholder={`Comenta sobre "${componentTitle}"...`}
              rows={2}
              required
              minLength={1}
              maxLength={1000}
              className="resize-none text-sm"
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
      </div>
    </div>
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