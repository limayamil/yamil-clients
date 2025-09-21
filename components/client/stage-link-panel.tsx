'use client';

import { useState } from 'react';
import { Link, X, Trash2, Send, ExternalLink } from 'lucide-react';
import type { FileEntry } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface StageLinkPanelProps {
  stageId: string;
  stageTitle: string;
  links: FileEntry[]; // Reusing FileEntry but for URLs
  isOpen: boolean;
  onClose: () => void;
  onLinkAdded?: (link: { url: string; title: string }) => void;
  projectId: string;
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
  projectId
}: StageLinkPanelProps) {
  const [newUrl, setNewUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter links for this stage (reusing the files structure)
  const stageLinks = links.filter(link => link.stage_id === stageId);

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

      // Here would be the API call to save the link
      // For now, just simulate the action
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onLinkAdded) {
        onLinkAdded({
          url: newUrl.trim(),
          title: finalTitle
        });
      }

      toast.success('Enlace compartido correctamente');
      setNewUrl('');
      setLinkTitle('');
    } catch (error) {
      console.error('Error submitting link:', error);
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
        {/* Formulario para agregar enlaces */}
        <div className="flex-shrink-0 mb-4">
          <div className="border border-border rounded-xl p-4 bg-brand-50/30">
            <h4 className="text-sm font-medium text-foreground mb-3">Compartir nuevo enlace</h4>

            <div className="space-y-3">
              <div>
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
                <div key={link.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-gray-50">
                  <Link className="h-4 w-4 text-brand-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {link.file_name}
                        </p>
                        <a
                          href={link.storage_path} // Assuming storage_path contains the URL
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-600 hover:text-brand-700 underline truncate block"
                        >
                          {link.storage_path}
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">
                          Compartido el {formatDate(link.uploaded_at)}
                        </p>
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
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
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