'use client';

import { respondApproval } from '@/actions/approvals';
import { Button } from '@/components/ui/button';
import type { ApprovalEntry } from '@/types/project';
import { Textarea } from '@/components/ui/textarea';
import { useFormState, useFormStatus } from 'react-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ApprovalActionsProps {
  approval?: ApprovalEntry;
}

const initialState: any = { success: false };

export function ApprovalActions({ approval }: ApprovalActionsProps) {
  const [state, formAction] = useFormState(respondApproval as any, initialState);
  if (!approval) {
    return <p className="text-sm text-muted-foreground">No hay aprobaciones pendientes.</p>;
  }
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="approvalId" value={approval.id} />
      <Textarea name="feedback" placeholder="Comentarios opcionales" rows={3} />
      <div className="flex flex-col gap-2">
        <SubmitButton status="approved" icon="approve" />
        <SubmitButton status="changes_requested" icon="changes" />
      </div>
      {state?.error && <p className="text-xs text-error">{JSON.stringify(state.error)}</p>}
    </form>
  );
}

function SubmitButton({ status, icon }: { status: 'approved' | 'changes_requested'; icon: 'approve' | 'changes' }) {
  const { pending } = useFormStatus();
  const isApprove = status === 'approved';
  return (
    <Button
      type="submit"
      name="status"
      value={status}
      variant={isApprove ? 'success' : 'outline'}
      className="w-full gap-2"
      disabled={pending}
    >
      {icon === 'approve' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {pending ? 'Enviando…' : isApprove ? 'Aprobar' : 'Solicitar cambios'}
    </Button>
  );
}
