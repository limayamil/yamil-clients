import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/guards';
import { getClientProject } from '@/lib/queries/client';
import { ClientProjectDetail } from '@/components/client/client-project-detail';

export const dynamic = 'force-dynamic';

interface ClientProjectPageProps {
  params: { clientId: string; projectId: string };
}

export default async function ClientProjectPage({ params }: ClientProjectPageProps) {
  const session = await requireRole(['client']);
  const project = await getClientProject(params.projectId, session.user.email!);
  if (!project) notFound();
  return <ClientProjectDetail project={project} clientEmail={session.user.email!} />;
}
