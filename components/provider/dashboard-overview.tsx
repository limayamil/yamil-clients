'use client';

import { useState, useMemo, useCallback } from 'react';
import type { ProjectSummary } from '@/types/project';
import { ProjectSummaryCard } from '@/components/provider/project-summary-card';
import { ProjectFilters } from '@/components/provider/project-filters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProjectGridSkeleton } from '@/components/ui/project-card-skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { FolderPlus, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface DashboardOverviewProps {
  projects: ProjectSummary[];
}

export function DashboardOverview({ projects }: DashboardOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isFiltering, setIsFiltering] = useState(false);

  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const clients = useMemo(() => {
    const uniqueClients = projects.reduce((acc, project) => {
      if (!acc.some(c => c.name === project.client_name)) {
        acc.push({ id: project.client_name, name: project.client_name });
      }
      return acc;
    }, [] as Array<{ id: string; name: string }>);
    return uniqueClients;
  }, [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    const normalizeString = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    let filtered = projects.filter((project) => {
      const normalizedQuery = normalizeString(debouncedSearchQuery);
      const matchesSearch = debouncedSearchQuery === '' ||
        normalizeString(project.title).includes(normalizedQuery) ||
        normalizeString(project.client_name).includes(normalizedQuery) ||
        (project.description && normalizeString(project.description).includes(normalizedQuery));

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && !project.overdue && !project.waiting_on_client) ||
        (statusFilter === 'waiting_client' && project.waiting_on_client) ||
        (statusFilter === 'overdue' && project.overdue) ||
        (statusFilter === 'completed' && project.status === 'done');

      const matchesClient = clientFilter === 'all' || project.client_name === clientFilter;

      return matchesSearch && matchesStatus && matchesClient;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'deadline':
          aValue = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          bValue = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          break;
        case 'title':
          aValue = normalizeString(a.title);
          bValue = normalizeString(b.title);
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        case 'client_name':
          aValue = normalizeString(a.client_name);
          bValue = normalizeString(b.client_name);
          break;
        default:
          aValue = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          bValue = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [projects, debouncedSearchQuery, statusFilter, clientFilter, sortBy, sortOrder]);

  const awaitingClient = projects.filter((project) => project.waiting_on_client);
  const overdue = projects.filter((project) => project.overdue);
  const upcoming = projects
    .filter((project) => project.deadline)
    .sort((a, b) => new Date(a.deadline ?? '').getTime() - new Date(b.deadline ?? '').getTime())
    .slice(0, 5);

  const activeFiltersCount = [
    debouncedSearchQuery !== '',
    statusFilter !== 'all',
    clientFilter !== 'all'
  ].filter(Boolean).length;

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setClientFilter('all');
    setSortBy('deadline');
    setSortOrder('desc');
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setIsFiltering(true);
    setSearchQuery(query);
    // Reset filtering state after debounce delay + buffer
    setTimeout(() => setIsFiltering(false), 350);
  }, []);

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Proyectos activos</h2>
            <p className="text-sm text-muted-foreground">Controla el progreso, fechas límite y necesidades del cliente.</p>
          </div>
        </div>
        <ProjectFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          clientFilter={clientFilter}
          onClientChange={setClientFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          clients={clients}
          totalResults={filteredAndSortedProjects.length}
          activeFiltersCount={activeFiltersCount}
          onClearFilters={handleClearFilters}
        />
        {isFiltering ? (
          <ProjectGridSkeleton count={6} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedProjects.map((project) => (
              <ProjectSummaryCard key={project.id} project={project} />
            ))}
            {filteredAndSortedProjects.length === 0 && debouncedSearchQuery === '' && activeFiltersCount === 0 && (
              <div className="md:col-span-2 xl:col-span-3">
                <EmptyState
                  icon={<FolderPlus className="h-8 w-8" />}
                  title="Comienza tu primer proyecto"
                  description="Crea un proyecto para empezar a colaborar con tus clientes y hacer seguimiento del progreso."
                  action={{
                    label: 'Crear proyecto',
                    onClick: () => {/* TODO: Open create project dialog */}
                  }}
                />
              </div>
            )}
            {filteredAndSortedProjects.length === 0 && (debouncedSearchQuery !== '' || activeFiltersCount > 0) && (
              <div className="md:col-span-2 xl:col-span-3">
                <EmptyState
                  icon={<Search className="h-8 w-8" />}
                  title="No se encontraron proyectos"
                  description="Intenta ajustar los filtros o términos de búsqueda para encontrar lo que buscas."
                  action={{
                    label: 'Limpiar filtros',
                    onClick: handleClearFilters
                  }}
                />
              </div>
            )}
          </div>
        )}
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Esperando cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {awaitingClient.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Sin bloqueos por parte del cliente
              </p>
            )}
            {awaitingClient.map((project) => (
              <div key={project.id} className="rounded-xl border border-border/50 bg-brand-50/50 p-4">
                <p className="font-medium text-foreground">{project.title}</p>
                <p className="text-sm text-muted-foreground">Vencimiento {project.deadline ? formatDate(project.deadline) : '—'}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Atrasados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overdue.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Todos los proyectos al día
              </p>
            )}
            {overdue.map((project) => (
              <div key={project.id} className="rounded-xl border border-error/40 bg-error/10 p-4">
                <p className="font-medium text-error">{project.title}</p>
                <p className="text-sm text-error/80">Fecha límite {project.deadline ? formatDate(project.deadline) : '—'}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Próximos vencimientos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcoming.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Sin fechas límite próximas
              </p>
            )}
            {upcoming.map((project) => (
              <div key={project.id} className="flex items-center justify-between rounded-xl border border-border/70 p-4">
                <div>
                  <p className="font-medium text-foreground">{project.title}</p>
                  <p className="text-sm text-muted-foreground">Cliente {project.client_name}</p>
                </div>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                  {project.deadline ? formatDate(project.deadline) : '—'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
