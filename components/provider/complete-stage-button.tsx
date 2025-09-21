'use client';

import { Button } from '@/components/ui/button';
import { completeStage } from '@/actions/stages';
import { useFormStatus } from 'react-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface CompleteStageButtonProps {
  stageId?: string;
  projectId?: string;
}

export function CompleteStageButton({ stageId, projectId }: CompleteStageButtonProps) {
  if (!stageId || !projectId) return null;

  const handleSubmit = async (formData: FormData) => {
    await completeStage(undefined, formData);
  };

  return (
    <form action={handleSubmit} className="inline-flex">
      <input type="hidden" name="stageId" value={stageId} />
      <input type="hidden" name="projectId" value={projectId} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="gap-2" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      {pending ? '...' : 'Complete stage'}
    </Button>
  );
}
