import { requireRole } from '@/lib/auth/guards';
import { getAllClients } from '@/lib/queries/provider';
import { ClientsList } from '@/components/provider/clients-list';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const session = await requireRole(['provider']);
  const clients = await getAllClients();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gestión de clientes</h1>
          <p className="text-sm text-muted-foreground">
            Administra la información de tus clientes y asigna nuevos proyectos.
          </p>
        </div>
      </div>
      <ClientsList clients={clients} />
    </div>
  );
}