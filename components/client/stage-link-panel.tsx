'use client';

import { useState } from 'react';
import { Link, X, Trash2, Send, ExternalLink, Edit2, Check, X as Cancel, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import type { FileEntry } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExpandableText } from '@/components/ui/expandable-text';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { addStageLink, updateStageLink, deleteFile } from '@/actions/files';

interface StageLinkPanelProps {
  stageId: string;
  stageTitle: string;
  links: FileEntry[]; // Reusing FileEntry but for URLs
  isOpen: boolean;
  onClose: () => void;
  onLinkAdded?: (link: { url: string; title: string }) => void;
  projectId: string;
  currentUserId?: string;
}

interface SubmittedLink {
  id: string;
  url: string;
  title: string;
  submitted_at: string;
}

export function StageLinkPanel({
  stageId,
  stageTitle,
  links,
  isOpen,
  onClose,
  onLinkAdded,
  projectId,
  currentUserId
}: StageLinkPanelProps) {
  const [newUrl, setNewUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{title: string; description: string; url: string}>({title: '', description: '', url: ''});
  const [isAddFormExpanded, setIsAddFormExpanded] = useState(false);

  // Filter links for this stage (only get URLs, not regular files)
  const stageLinks = links.filter(link =>
    link.stage_id === stageId &&
    (link.mime === 'text/uri-list' || link.storage_path?.startsWith('http'))
  );

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const extractTitleFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('drive.google.com')) {
        return 'Google Drive';
      } else if (urlObj.hostname.includes('dropbox.com')) {
        return 'Dropbox';
      } else if (urlObj.hostname.includes('onedrive.live.com')) {
        return 'OneDrive';
      } else {
        return urlObj.hostname;
      }
    } catch {
      return 'Enlace';
    }
  };

  // Parse title and description from file_name field (format: "title|description")
  const parseLinkData = (fileName: string): { title: string; description?: string } => {
    const parts = fileName.split('|');
    if (parts.length > 1) {
      return {
        title: parts[0],
        description: parts.slice(1).join('|'), // In case description contains pipes
      };
    }
    return { title: fileName };
  };

  const handleSubmitLink = async () => {
    if (!newUrl.trim()) {
      toast.error('Por favor ingresa una URL');
      return;
    }

    if (!validateUrl(newUrl.trim())) {
      toast.error('Por favor ingresa una URL válida');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalTitle = linkTitle.trim() || extractTitleFromUrl(newUrl.trim());

      // Create FormData and call the addStageLink action
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('stageId', stageId);
      formData.append('title', finalTitle);
      formData.append('description', linkDescription.trim());
      formData.append('url', newUrl.trim());

      const result = await addStageLink(null, formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Enlace compartido correctamente');
      setNewUrl('');
      setLinkTitle('');
      setLinkDescription('');

      // Colapsar el formulario después del éxito
      setTimeout(() => {
        setIsAddFormExpanded(false);
      }, 500);
    } catch (error) {
      toast.error('Error al compartir el enlace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitLink();
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este enlace?')) {
      return;
    }

    const formData = new FormData();
    formData.append('fileId', linkId);
    formData.append('projectId', projectId);

    const result = await deleteFile(null, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Enlace eliminado correctamente');
    }
  };

  const handleEditLink = (link: FileEntry) => {
    const linkData = parseLinkData(link.file_name);
    setEditingLink(link.id);
    setEditingData({
      title: linkData.title,
      description: linkData.description || '',
      url: link.storage_path,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLink) return;

    if (!editingData.url.trim()) {
      toast.error('Por favor ingresa una URL');
      return;
    }

    if (!validateUrl(editingData.url.trim())) {
      toast.error('Por favor ingresa una URL válida');
      return;
    }

    if (!editingData.title.trim()) {
      toast.error('Por favor ingresa un título');
      return;
    }

    const formData = new FormData();
    formData.append('linkId', editingLink);
    formData.append('projectId', projectId);
    formData.append('title', editingData.title.trim());
    formData.append('description', editingData.description.trim());
    formData.append('url', editingData.url.trim());

    const result = await updateStageLink(null, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Enlace actualizado correctamente');
      setEditingLink(null);
      setEditingData({ title: '', description: '', url: '' });
    }
  };

  const handleCancelEdit = () => {
    setEditingLink(null);
    setEditingData({ title: '', description: '', url: '' });
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed inset-2 z-50 flex flex-col bg-white shadow-2xl sm:inset-4 md:inset-auto md:right-4 md:top-4 md:bottom-4 md:w-96 lg:w-[420px]">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link className="h-4 w-4 text-brand-600 flex-shrink-0" />
            <CardTitle className="text-base truncate">Enlaces de Etapa</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 touch-manipulation">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Badge variant="outline" className="text-xs w-fit">
            {stageTitle}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {stageLinks.length} enlace{stageLinks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
        {/* Formulario para agregar enlaces - Colapsable */}
        <div className="flex-shrink-0 mb-4">
          <div className="border border-border rounded-xl bg-brand-50/30">
            {/* Header del formulario - siempre visible */}
            <button
              onClick={() => setIsAddFormExpanded(!isAddFormExpanded)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-brand-50/50 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-brand-600" />
                <h4 className="text-sm font-medium text-foreground">Compartir nuevo enlace</h4>
              </div>
              {isAddFormExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Formulario expandible */}
            {isAddFormExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-border/50">
                <div className="pt-3">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    URL del enlace *
                  </label>
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="https://drive.google.com/... o https://dropbox.com/..."
                    className="text-sm"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Título (opcional)
                  </label>
                  <Input
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nombre descriptivo del enlace..."
                    className="text-sm"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Descripción (opcional)
                  </label>
                  <Input
                    value={linkDescription}
                    onChange={(e) => setLinkDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Descripción adicional del enlace..."
                    className="text-sm"
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  onClick={handleSubmitLink}
                  disabled={!newUrl.trim() || isSubmitting}
                  size="sm"
                  className="w-full"
                >
                  <Send className="h-3 w-3 mr-2" />
                  {isSubmitting ? 'Enviando...' : 'Compartir enlace'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Lista de enlaces existentes */}
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Enlaces compartidos en esta etapa
          </h4>
          {stageLinks.length > 0 ? (
            <div className="space-y-2">
              {stageLinks.map((link) => (
                <div key={link.id} className="p-3 rounded-lg border border-border hover:bg-gray-50">
                  {editingLink === link.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Link className="h-4 w-4 text-brand-600 flex-shrink-0" />
                        <span className="text-sm font-medium">Editando enlace</span>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Título *
                        </label>
                        <Input
                          value={editingData.title}
                          onChange={(e) => setEditingData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Nombre del enlace"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Descripción (opcional)
                        </label>
                        <Input
                          value={editingData.description}
                          onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descripción del enlace"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          URL *
                        </label>
                        <Input
                          value={editingData.url}
                          onChange={(e) => setEditingData(prev => ({ ...prev, url: e.target.value }))}
                          placeholder="https://..."
                          className="text-sm"
                          type="url"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          onClick={handleSaveEdit}
                          size="sm"
                          disabled={!editingData.title.trim() || !editingData.url.trim()}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          size="sm"
                        >
                          <Cancel className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-start gap-3">
                      <Link className="h-4 w-4 text-brand-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {(() => {
                              const linkData = parseLinkData(link.file_name);
                              return (
                                <>
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {linkData.title}
                                  </p>
                                  {linkData.description && (
                                    <ExpandableText
                                      content={linkData.description}
                                      maxLength={80}
                                      className="text-xs text-muted-foreground"
                                    />
                                  )}
                                  <a
                                    href={link.storage_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-brand-600 hover:text-brand-700 underline truncate block"
                                  >
                                    {link.storage_path}
                                  </a>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Compartido el {formatDate(link.uploaded_at)}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              asChild
                            >
                              <a
                                href={link.storage_path}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLink(link)}
                              className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              title="Editar enlace"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            {currentUserId && link.created_by === currentUserId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLink(link.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Eliminar enlace"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center py-8">
              <div>
                <Link className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Sin enlaces en esta etapa</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Los enlaces compartidos para esta etapa aparecerán aquí
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}