import { requireRole } from '@/lib/auth/guards';
import { getClientById, getClientProjects } from '@/lib/queries/provider';
import { ClientProjectsManager } from '@/components/provider/client-projects-manager';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Building, Phone } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ClientDetailPageProps {
  params: {
    clientId: string;
  };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  await requireRole(['provider']);

  const [client, projects] = await Promise.all([
    getClientById(params.clientId),
    getClientProjects(params.clientId)
  ]);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">
            {client.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los proyectos asignados a este cliente
          </p>
        </div>
      </div>

      {/* Client Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información del Cliente</CardTitle>
            <Badge variant={client.active ? 'default' : 'secondary'}>
              {client.active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{client.email}</p>
            </div>
          </div>
          {client.company && (
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Empresa</p>
                <p className="text-sm text-muted-foreground">{client.company}</p>
              </div>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Teléfono</p>
                <p className="text-sm text-muted-foreground">{client.phone}</p>
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium">Registrado</p>
            <p className="text-sm text-muted-foreground">
              {new Date(client.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Projects Manager */}
      <ClientProjectsManager
        clientId={params.clientId}
        clientName={client.name}
        projects={projects}
      />
    </div>
  );
}
