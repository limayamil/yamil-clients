'use client';

import { requestMaterials } from '@/actions/stages';
import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';
import { Loader2, PackagePlus } from 'lucide-react';

export function RequestMaterialsButton({ projectId }: { projectId: string }) {
  const handleSubmit = async (formData: FormData) => {
    await requestMaterials(undefined, formData);
  };

  return (
    <form action={handleSubmit} className="inline-flex">
      <input type="hidden" name="projectId" value={projectId} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" className="gap-2" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
      {pending ? '...' : 'Request materials'}
    </Button>
  );
}
