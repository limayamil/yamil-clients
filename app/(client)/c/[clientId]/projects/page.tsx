import { requireRole } from '@/lib/auth/guards';
import { getClientProjects } from '@/lib/queries/client';
import { ClientProjectsGrid } from '@/components/client/client-projects-grid';

export const dynamic = 'force-dynamic';

interface ClientProjectsPageProps {
  params: { clientId: string };
}

export default async function ClientProjectsPage({ params }: ClientProjectsPageProps) {
  const user = await requireRole(['client']);

  if (!user.email) {
    throw new Error('No se pudo obtener el email del usuario');
  }

  const projects = await getClientProjects(user.email);

  return <ClientProjectsGrid projects={projects} clientId={params.clientId} />;
}
