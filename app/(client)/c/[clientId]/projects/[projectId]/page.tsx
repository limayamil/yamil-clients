import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/guards';
import { getClientProject } from '@/lib/queries/client';
import { ClientProjectDetail } from '@/components/client/client-project-detail';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ClientProjectPageProps {
  params: { clientId: string; projectId: string };
}

export default async function ClientProjectPage({ params }: ClientProjectPageProps) {
  const user = await requireRole(['client']);

  if (!user.email) {
    notFound();
  }

  const project = await getClientProject(params.projectId, user.email);

  if (!project) {
    notFound();
  }

  return <ClientProjectDetail project={project} clientEmail={user.email} currentUserId={user.id} />;
}
