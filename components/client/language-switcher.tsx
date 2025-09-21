'use client';

import { setLocale } from '@/actions/preferences';
import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';

export function LanguageSwitcher() {
  const handleSubmit = async (formData: FormData) => {
    await setLocale(undefined, formData);
  };

  return (
    <form action={handleSubmit} className="flex items-center gap-3">
      <select name="locale" className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? '...' : 'Guardar'}
    </Button>
  );
}
