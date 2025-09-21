import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/guards';
import { getProviderProject } from '@/lib/queries/provider';
import { ProjectDetailView } from '@/components/provider/project-detail-view';

export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: { projectId: string };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  await requireRole(['provider']);
  const project = await getProviderProject(params.projectId);
  if (!project) notFound();
  return <ProjectDetailView project={project} />;
}
