'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { completeStage } from '@/actions/stages';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CompleteStageDialogProps {
  stageId: string;
  projectId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CompleteStageDialog({
  stageId,
  projectId,
  isOpen,
  onOpenChange,
  onSuccess
}: CompleteStageDialogProps) {
  const router = useRouter();
  const [completionNote, setCompletionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('stageId', stageId);
    formData.append('projectId', projectId);
    if (completionNote) {
      formData.append('completionNote', completionNote);
    }

    const result = await completeStage(undefined, formData);

    setIsSubmitting(false);

    if (result?.error) {
      toast.error('Error al completar la etapa');
      console.error('Error completing stage:', result.error);
      return;
    }

    toast.success('Etapa completada exitosamente');
    setCompletionNote('');
    onOpenChange(false);
    router.refresh();
    onSuccess?.();
  };

  const handleCancel = () => {
    setCompletionNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Completar etapa</DialogTitle>
          <DialogDescription>
            Opcionalmente, puedes agregar un comentario de cierre que resuma el trabajo realizado en esta etapa.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">
            Comentario de cierre (opcional)
          </label>
          <RichTextEditor
            value={completionNote}
            onChange={setCompletionNote}
            placeholder="Describe las conclusiones y resultados de esta etapa..."
            mode="full"
            maxLength={5000}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Completando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Completar etapa
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
