'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CustomDateInput } from '@/components/ui/custom-date-input';
import { createProjectFromTemplate } from '@/actions/projects';
import { useFormState, useFormStatus } from 'react-dom';
import { AddClientDialog } from './add-client-dialog';

interface CreateProjectDialogProps {
  clients: Array<{ id: string; name: string; email: string }>;
  templates: Array<{ key: string; value: Record<string, unknown> }>;
}

const initialState: { error?: any; success?: boolean; projectId?: any } = {};

export function CreateProjectDialog({ clients, templates }: CreateProjectDialogProps) {
  const [state, formAction] = useFormState(createProjectFromTemplate, initialState);
  const [localClients, setLocalClients] = useState(clients);
  const [deadline, setDeadline] = useState<string>('');

  const handleClientAdded = (newClient: any) => {
    setLocalClients((prev) => [...prev, newClient]);
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">Nuevo proyecto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nuevo proyecto</DialogTitle>
          <DialogDescription>Seleccioná una plantilla base y personaliza las etapas según tus necesidades.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="template">
              Plantilla base
            </label>
            <select id="template" name="template" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm">
              {templates.map((template) => (
                <option key={template.key} value={template.key}>
                  {(template.value?.name as string) ?? template.key.replace('template.', '')}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Las etapas de la plantilla servirán como punto de partida. Podrás editarlas, agregar nuevas o eliminar las que no necesites.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground" htmlFor="clientId">
                Cliente
              </label>
              <AddClientDialog
                triggerText="Agregar cliente"
                triggerVariant="outline"
                onClientAdded={handleClientAdded}
              />
            </div>
            <select id="clientId" name="clientId" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm">
              {localClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} · {client.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="title">
              Nombre del proyecto
            </label>
            <Input id="title" name="title" minLength={3} required placeholder="Landing corporativa" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="description">
              Descripción
            </label>
            <Textarea id="description" name="description" placeholder="Notas iniciales para el equipo" rows={3} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="deadline">
              Deadline (opcional)
            </label>
            <CustomDateInput
              value={deadline}
              onChange={setDeadline}
              placeholder="DD/MM/YYYY"
            />
            <input type="hidden" name="deadline" value={deadline} />
          </div>
          {state?.error && <p className="text-sm text-error">{JSON.stringify(state.error)}</p>}
          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? '...' : 'Crear proyecto'}
    </Button>
  );
}
