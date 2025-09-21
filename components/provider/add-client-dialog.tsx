'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/actions/clients';
import { useFormState, useFormStatus } from 'react-dom';
import { Plus } from 'lucide-react';

interface AddClientDialogProps {
  triggerText?: string;
  triggerVariant?: 'default' | 'outline' | 'ghost';
  onClientAdded?: (client: any) => void;
}

const initialState: { error?: any; success?: boolean; data?: any } = {};

export function AddClientDialog({
  triggerText = 'Agregar cliente',
  triggerVariant = 'default',
  onClientAdded
}: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createClient, initialState);

  const handleFormSubmit = async (formData: FormData) => {
    formAction(formData);
  };

  useEffect(() => {
    if (state.success && state.data) {
      setOpen(false);
      if (onClientAdded) {
        onClientAdded(state.data);
      }
    }
  }, [state.success, state.data, onClientAdded]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className="gap-2">
          <Plus className="h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar nuevo cliente</DialogTitle>
          <DialogDescription>
            Completa la información del cliente para agregarlo al sistema.
          </DialogDescription>
        </DialogHeader>
        <form action={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Juan Pérez"
                autoComplete="name"
              />
              {state?.error?.name && (
                <p className="text-sm text-destructive">{state.error.name[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="juan@empresa.com"
                autoComplete="email"
              />
              {state?.error?.email && (
                <p className="text-sm text-destructive">{state.error.email[0]}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              name="company"
              placeholder="Empresa S.A."
              autoComplete="organization"
            />
            {state?.error?.company && (
              <p className="text-sm text-destructive">{state.error.company[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+54 11 1234-5678"
              autoComplete="tel"
            />
            {state?.error?.phone && (
              <p className="text-sm text-destructive">{state.error.phone[0]}</p>
            )}
          </div>
          {state?.error?.database && (
            <p className="text-sm text-destructive">{state.error.database[0]}</p>
          )}
          {state?.error?.server && (
            <p className="text-sm text-destructive">{state.error.server[0]}</p>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Agregando...' : 'Agregar cliente'}
    </Button>
  );
}