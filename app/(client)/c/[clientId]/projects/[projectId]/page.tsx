import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/guards';
import { getClientProject } from '@/lib/queries/client';
import { ClientProjectDetail } from '@/components/client/client-project-detail';

export const dynamic = 'force-dynamic';

interface ClientProjectPageProps {
  params: { clientId: string; projectId: string };
}

export default async function ClientProjectPage({ params }: ClientProjectPageProps) {
  console.log('Client project detail page - params:', params);

  const user = await requireRole(['client']);
  console.log('Client project detail page - User ID:', user.id);
  console.log('Client project detail page - User email:', user.email);

  if (!user.email) {
    console.error('Client project detail page - No email found for user');
    notFound();
  }

  console.log('Fetching project detail for:', { projectId: params.projectId, clientEmail: user.email });
  const project = await getClientProject(params.projectId, user.email);

  if (!project) {
    console.error('Client project detail page - Project not found or no access');
    notFound();
  }

  console.log('Client project detail page - Project loaded successfully:', {
    id: project.id,
    title: project.title,
    stagesCount: project.stages?.length || 0
  });

  return <ClientProjectDetail project={project} clientEmail={user.email} currentUserId={user.id} />;
}
