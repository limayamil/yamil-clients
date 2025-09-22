import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/guards';
import { getProviderProject } from '@/lib/queries/provider';
import nextDynamic from 'next/dynamic';

const ProjectDetailView = nextDynamic(
  () => import('@/components/provider/project-detail-view').then(mod => ({ default: mod.ProjectDetailView })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse bg-gray-200 h-32 w-full rounded"></div>
      </div>
    ),
    ssr: false
  }
);

export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: { projectId: string };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const user = await requireRole(['provider']);
  const project = await getProviderProject(params.projectId);
  if (!project) notFound();
  return <ProjectDetailView project={project} currentUserId={user.id} />;
}
