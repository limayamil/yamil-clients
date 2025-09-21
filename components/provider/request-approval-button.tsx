'use client';

import { requestApproval } from '@/actions/stages';
import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Stage } from '@/types/project';

interface RequestApprovalButtonProps {
  projectId: string;
  stageId?: string;
  stages?: Stage[];
}

export function RequestApprovalButton({ projectId, stageId, stages }: RequestApprovalButtonProps) {
  const selectedStage = stageId ?? stages?.[0]?.id;

  const handleSubmit = async (formData: FormData) => {
    await requestApproval(undefined, formData);
  };

  return (
    <form action={handleSubmit} className="inline-flex items-center gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      {selectedStage && <input type="hidden" name="stageId" value={selectedStage} />}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" className="gap-2" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
      {pending ? '...' : 'Request approval'}
    </Button>
  );
}
