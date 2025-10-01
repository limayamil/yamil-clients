'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import { CompleteStageDialog } from '@/components/shared/complete-stage-dialog';
import { CheckCircle2 } from 'lucide-react';

interface CompleteStageButtonProps {
  stageId?: string;
  projectId?: string;
}

export function CompleteStageButton({ stageId, projectId }: CompleteStageButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!stageId || !projectId) return null;

  return (
    <>
      <Button className="gap-2" onClick={() => setIsOpen(true)}>
        <CheckCircle2 className="h-4 w-4" />
        Completar etapa
      </Button>
      <CompleteStageDialog
        stageId={stageId}
        projectId={projectId}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
