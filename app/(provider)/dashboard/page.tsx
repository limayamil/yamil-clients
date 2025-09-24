import { requireRole } from '@/lib/auth/guards';
import { getProviderDashboardProjects, getActiveClients, getProjectTemplates } from '@/lib/queries/provider';
import { DashboardOverview } from '@/components/provider/dashboard-overview';
import { CreateProjectDialog } from '@/components/provider/create-project-dialog';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  console.log('🏠 Dashboard: Page loading started');

  try {
    const user = await requireRole(['provider']);
    console.log('🔍 Dashboard: User authenticated successfully:', {
      id: user.id,
      email: user.email,
      role: user.role,
      isProvider: user.role === 'provider'
    });

    console.log('📡 Dashboard: Starting data queries...');

    const [projects, clients, templates] = await Promise.all([
      getProviderDashboardProjects().catch(err => {
        console.error('❌ getProviderDashboardProjects failed:', err);
        return [];
      }),
      getActiveClients().catch(err => {
        console.error('❌ getActiveClients failed:', err);
        return [];
      }),
      getProjectTemplates().catch(err => {
        console.error('❌ getProjectTemplates failed:', err);
        return [];
      })
    ]);

    console.log('📊 Dashboard: All data loaded successfully:', {
      projectsCount: projects.length,
      clientsCount: clients.length,
      templatesCount: templates.length,
      projects: projects.map((p: any) => ({ id: p.id, title: p.title })),
      clients: clients.map((c: any) => ({ id: c.id, name: c.name }))
    });

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
  } catch (error) {
    console.error('💥 Dashboard: Fatal error during page load:', error);
    throw error;
  }
}
