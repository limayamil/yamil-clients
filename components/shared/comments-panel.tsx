'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import type { CommentEntry } from '@/types/project';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createComment } from '@/actions/comments';
import { useFormStatus, useFormState } from 'react-dom';
import { toast } from 'sonner';

interface CommentsPanelProps {
  comments: CommentEntry[];
  projectId: string;
}

const initialState: { error?: string; success?: boolean; message?: string } = {};

export function CommentsPanel({ comments, projectId }: CommentsPanelProps) {
  const sorted = useMemo(
    () => [...comments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [comments]
  );
  const [state, formAction] = useFormState(createComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Handle form success/error states
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Comentario publicado correctamente');
      // Reset form on success
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {sorted.map((comment) => (
          <article key={comment.id} className="rounded-2xl border border-border bg-white p-4">
            <header className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{comment.author_type === 'provider' ? 'Proveedor' : 'Cliente'}</span>
              <time className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</time>
            </header>
            <p className="mt-2 text-sm text-muted-foreground">{comment.body}</p>
          </article>
        ))}
        {sorted.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
      </div>
      <form ref={formRef} action={formAction} className="space-y-3 rounded-2xl border border-dashed border-border p-4">
        <input type="hidden" name="projectId" value={projectId} />
        <Textarea
          name="body"
          placeholder="Comparte una actualización..."
          rows={3}
          required
          minLength={1}
          maxLength={10000}
        />
        {state?.error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{state.error}</span>
          </div>
        )}
        <SubmitButton />
      </form>
    </div>
  );
}

function SubmitButton() {
  const status = useFormStatus();
  return (
    <Button type="submit" className="inline-flex items-center gap-2" disabled={status.pending}>
      <Send className="h-4 w-4" />
      {status.pending ? 'Sending…' : 'Post comment'}
    </Button>
  );
}
