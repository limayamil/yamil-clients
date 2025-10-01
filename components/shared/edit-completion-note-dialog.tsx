'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { updateStageCompletionNote } from '@/actions/stages';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface EditCompletionNoteDialogProps {
  stageId: string;
  projectId: string;
  currentNote: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCompletionNoteDialog({
  stageId,
  projectId,
  currentNote,
  isOpen,
  onOpenChange
}: EditCompletionNoteDialogProps) {
  const router = useRouter();
  const [completionNote, setCompletionNote] = useState(currentNote || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Remove HTML tags to check if there's actual content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = completionNote;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    if (!textContent.trim()) {
      toast.error('El comentario no puede estar vacío');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('stageId', stageId);
    formData.append('projectId', projectId);
    formData.append('completionNote', completionNote);

    const result = await updateStageCompletionNote(undefined, formData);

    setIsSubmitting(false);

    if (result?.error) {
      toast.error('Error al actualizar el comentario');
      console.error('Error updating completion note:', result.error);
      return;
    }

    toast.success(currentNote ? 'Comentario actualizado exitosamente' : 'Comentario agregado exitosamente');
    onOpenChange(false);
    router.refresh();
  };

  const handleCancel = () => {
    setCompletionNote(currentNote || '');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{currentNote ? 'Editar' : 'Agregar'} comentario de cierre</DialogTitle>
          <DialogDescription>
            {currentNote
              ? 'Actualiza el comentario que resume el trabajo realizado en esta etapa.'
              : 'Agrega un comentario que resuma el trabajo realizado en esta etapa.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">
            Comentario de cierre
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
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
