'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditableText } from '@/components/ui/editable-text';
import { addProjectLink, updateProjectLink, deleteProjectLink } from '@/actions/project-links';
import type { ProjectLinkEntry } from '@/types/project';
import { ExternalLink, Plus, Trash2, Link as LinkIcon, Github, Figma, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectLinksPanelProps {
  links: ProjectLinkEntry[];
  projectId: string;
  canEdit?: boolean;
}

export function ProjectLinksPanel({ links, projectId, canEdit = false }: ProjectLinksPanelProps) {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLinkIcon = (url: string) => {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      if (domain.includes('github.com')) return <Github className="h-4 w-4" />;
      if (domain.includes('figma.com')) return <Figma className="h-4 w-4" />;
      return <Globe className="h-4 w-4" />;
    } catch {
      return <Globe className="h-4 w-4" />;
    }
  };

  const handleAddLink = async () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      toast.error('Título y URL son requeridos');
      return;
    }

    try {
      // Validar URL básica
      new URL(newLinkUrl);
    } catch {
      toast.error('URL inválida');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('title', newLinkTitle.trim());
    formData.append('url', newLinkUrl.trim());

    const result = await addProjectLink(formData);

    if (result.error) {
      toast.error('Error al agregar el link');
      console.error('Error adding link:', result.error);
    } else {
      toast.success('Link agregado correctamente');
      setNewLinkTitle('');
      setNewLinkUrl('');
      setIsAddingLink(false);
    }

    setIsSubmitting(false);
  };

  const handleUpdateLinkTitle = async (linkId: string, newTitle: string) => {
    const link = links.find(l => l.id === linkId);
    if (!link) return;

    const formData = new FormData();
    formData.append('linkId', linkId);
    formData.append('projectId', projectId);
    formData.append('title', newTitle);
    formData.append('url', link.url);

    const result = await updateProjectLink(formData);

    if (result.error) {
      toast.error('Error al actualizar el título');
      throw new Error('Error updating link title');
    } else {
      toast.success('Título actualizado correctamente');
    }
  };

  const handleUpdateLinkUrl = async (linkId: string, newUrl: string) => {
    const link = links.find(l => l.id === linkId);
    if (!link) return;

    try {
      // Validar URL
      new URL(newUrl);
    } catch {
      toast.error('URL inválida');
      throw new Error('Invalid URL');
    }

    const formData = new FormData();
    formData.append('linkId', linkId);
    formData.append('projectId', projectId);
    formData.append('title', link.title);
    formData.append('url', newUrl);

    const result = await updateProjectLink(formData);

    if (result.error) {
      toast.error('Error al actualizar la URL');
      throw new Error('Error updating link URL');
    } else {
      toast.success('URL actualizada correctamente');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este link?')) {
      return;
    }

    const formData = new FormData();
    formData.append('linkId', linkId);
    formData.append('projectId', projectId);

    const result = await deleteProjectLink(formData);

    if (result.error) {
      toast.error('Error al eliminar el link');
      console.error('Error deleting link:', result.error);
    } else {
      toast.success('Link eliminado correctamente');
    }
  };

  return (
    <Card className="relative overflow-hidden border-border/50 shadow-lg bg-gradient-to-br from-white to-blue-50/30 panel-mobile-safe">
      <div className="absolute top-0 right-0 w-16 h-16 sm:w-32 sm:h-32 bg-gradient-radial from-blue-100/20 to-transparent blur-2xl"></div>

      <CardHeader className="relative">
        <div className="flex items-center justify-between mobile-flex-safe">
          <CardTitle className="flex items-center gap-3 text-lg mobile-flex-safe">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg flex-shrink-0">
              <LinkIcon className="h-4 w-4 text-white" />
            </div>
            <span className="mobile-text-safe">Links de Interés</span>
          </CardTitle>
          {canEdit && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="text-xs shadow-sm stage-badge-mobile">
                <span className="hidden xs:inline">{links.length} links</span>
                <span className="xs:hidden">{links.length}</span>
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingLink(true)}
                className="h-8 px-3 panel-button-mobile"
                disabled={isAddingLink}
              >
                <Plus className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Agregar</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        {/* Agregar nuevo link */}
        {isAddingLink && canEdit && (
          <div className="rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-white p-4 shadow-sm space-y-3 panel-mobile-safe">
            <div className="space-y-2 panel-form-mobile">
              <input
                type="text"
                placeholder="Título del link"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-text-safe"
                maxLength={200}
              />
              <input
                type="url"
                placeholder="https://ejemplo.com"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-text-safe"
              />
            </div>
            <div className="flex items-center gap-2 panel-form-mobile">
              <Button
                size="sm"
                onClick={handleAddLink}
                disabled={isSubmitting || !newLinkTitle.trim() || !newLinkUrl.trim()}
                className="h-8 panel-button-mobile"
              >
                <span className="hidden sm:inline">{isSubmitting ? 'Guardando...' : 'Guardar'}</span>
                <span className="sm:hidden">{isSubmitting ? '⏳' : '✓'}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingLink(false);
                  setNewLinkTitle('');
                  setNewLinkUrl('');
                }}
                className="h-8 panel-button-mobile"
                disabled={isSubmitting}
              >
                <span className="hidden sm:inline">Cancelar</span>
                <span className="sm:hidden">✕</span>
              </Button>
            </div>
          </div>
        )}

        {/* Lista de links */}
        {links.length > 0 ? (
          <div className="space-y-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="group rounded-xl border border-gray-200/50 bg-gradient-to-r from-white to-gray-50/30 p-3 shadow-sm hover:shadow-md transition-all duration-200 panel-mobile-safe"
              >
                <div className="flex items-center gap-3 mobile-flex-safe">
                  <div className="flex items-center gap-2 flex-1 min-w-0 mobile-flex-safe">
                    <div className="flex-shrink-0 text-gray-600">
                      {getLinkIcon(link.url)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      {canEdit ? (
                        <>
                          <EditableText
                            value={link.title}
                            onSave={(newTitle) => handleUpdateLinkTitle(link.id, newTitle)}
                            className="text-sm font-medium text-gray-900 line-clamp-1 mobile-text-safe"
                            editClassName="text-sm font-medium mobile-text-safe"
                            maxLength={200}
                            placeholder="Título del link"
                          />
                          <EditableText
                            value={link.url}
                            onSave={(newUrl) => handleUpdateLinkUrl(link.id, newUrl)}
                            className="text-xs text-gray-600 line-clamp-1 url-mobile-safe"
                            editClassName="text-xs mobile-text-safe"
                            placeholder="URL del link"
                          />
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1 mobile-text-safe">
                            {link.title}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-1 url-mobile-safe">
                            {link.url}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(link.url, '_blank')}
                      className="h-8 w-8 p-0 hover:bg-blue-100"
                      title="Abrir link"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteLink(link.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar link"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <LinkIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">No hay links agregados</p>
            {canEdit && !isAddingLink && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingLink(true)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar primer link
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}