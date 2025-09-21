import { requireRole } from '@/lib/auth/guards';
import { getProviderDashboardProjects, getActiveClients, getProjectTemplates } from '@/lib/queries/provider';
import { DashboardOverview } from '@/components/provider/dashboard-overview';
import { CreateProjectDialog } from '@/components/provider/create-project-dialog';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireRole(['provider']);
  const [projects, clients, templates] = await Promise.all([
    getProviderDashboardProjects(user.id),
    getActiveClients(),
    getProjectTemplates()
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Panel de proyectos</h1>
          <p className="text-sm text-muted-foreground">Mantené el rumbo de cada iniciativa y colaborá con tus clientes.</p>
        </div>
        <CreateProjectDialog clients={clients} templates={templates} />
      </div>
      <DashboardOverview projects={projects} />
    </div>
  );
}
