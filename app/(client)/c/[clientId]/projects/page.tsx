import { requireRole } from '@/lib/auth/guards';
import { getClientProjects } from '@/lib/queries/client';
import { ClientProjectsGrid } from '@/components/client/client-projects-grid';

export const dynamic = 'force-dynamic';

interface ClientProjectsPageProps {
  params: { clientId: string };
}

export default async function ClientProjectsPage({ params }: ClientProjectsPageProps) {
  const user = await requireRole(['client']);

  console.log('Client projects page - User ID:', user.id);
  console.log('Client projects page - User email:', user.email);
  console.log('Client projects page - Client ID from URL:', params.clientId);

  if (!user.email) {
    console.error('Client projects page - No email found for user');
    throw new Error('No se pudo obtener el email del usuario');
  }

  console.log('Fetching projects for client email:', user.email);
  const projects = await getClientProjects(user.email);

  console.log('Projects found for client:', projects.length);
  console.log('Project details:', projects.map(p => ({ id: p.id, title: p.title })));

  return <ClientProjectsGrid projects={projects} clientId={params.clientId} />;
}
