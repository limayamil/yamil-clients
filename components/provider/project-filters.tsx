'use client';

import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  clientFilter: string;
  onClientChange: (client: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  clients: Array<{ id: string; name: string }>;
  totalResults: number;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

export function ProjectFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  clientFilter,
  onClientChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  clients,
  totalResults,
  activeFiltersCount,
  onClearFilters,
}: ProjectFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11"
            aria-label="Buscar proyectos por nombre, cliente o descripción"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 h-11 px-4"
            aria-expanded={showFilters}
            aria-controls="filters-panel"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="gap-2 h-11 px-4"
            aria-label={`Ordenar ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            <span className="hidden sm:inline">{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
          </Button>
        </div>
      </div>

      {showFilters && (
        <div
          id="filters-panel"
          className="rounded-xl border border-border bg-white p-4 shadow-sm"
          role="region"
          aria-label="Panel de filtros"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="status-filter">
                Estado
              </label>
              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger id="status-filter" className="h-11">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="waiting_client">Esperando cliente</SelectItem>
                  <SelectItem value="overdue">Atrasados</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="client-filter">
                Cliente
              </label>
              <Select value={clientFilter} onValueChange={onClientChange}>
                <SelectTrigger id="client-filter" className="h-11">
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="sort-filter">
                Ordenar por
              </label>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger id="sort-filter" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Fecha límite</SelectItem>
                  <SelectItem value="title">Nombre</SelectItem>
                  <SelectItem value="progress">Progreso</SelectItem>
                  <SelectItem value="client_name">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile-only quick clear button */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-border md:hidden">
              <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full">
                Limpiar todos los filtros
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{totalResults} proyecto{totalResults !== 1 ? 's' : ''}</span>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}