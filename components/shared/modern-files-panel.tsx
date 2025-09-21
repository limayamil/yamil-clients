'use client';

import { useState } from 'react';
import { Paperclip, Download, Upload, Plus, File, Trash2 } from 'lucide-react';
import type { FileEntry } from '@/types/project';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ModernFilesPanelProps {
  files: FileEntry[];
  projectId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  showUploadZone?: boolean;
  className?: string;
}

export function ModernFilesPanel({
  files,
  projectId,
  canUpload = false,
  canDelete = false,
  showUploadZone = false,
  className
}: ModernFilesPanelProps) {
  const [dragActive, setDragActive] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileType = (mime: string | null): { label: string; color: string } => {
    if (!mime) return { label: 'Archivo', color: 'text-gray-600' };

    if (mime.includes('image/')) return { label: 'Imagen', color: 'text-green-600' };
    if (mime.includes('pdf')) return { label: 'PDF', color: 'text-red-600' };
    if (mime.includes('word') || mime.includes('document')) return { label: 'Documento', color: 'text-blue-600' };
    if (mime.includes('sheet') || mime.includes('excel')) return { label: 'Hoja de cálculo', color: 'text-green-600' };
    if (mime.includes('zip') || mime.includes('rar')) return { label: 'Archivo', color: 'text-yellow-600' };

    return { label: 'Archivo', color: 'text-gray-600' };
  };

  const stageFiles = files.filter(file => !file.stage_id); // Archivos generales del proyecto
  const stageSpecificFiles = files.filter(file => file.stage_id); // Archivos específicos de etapas

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg">Archivos del Proyecto</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {files.length} archivo{files.length !== 1 ? 's' : ''}
            </Badge>
            {canUpload && (
              <Button size="sm" className="h-8">
                <Plus className="h-3 w-3 mr-1.5" />
                Subir
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zona de subida opcional */}
        {showUploadZone && canUpload && (
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragActive
                ? 'border-brand-500 bg-brand-50'
                : 'border-border hover:border-brand-300 hover:bg-brand-50/50'
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              // TODO: Manejar subida de archivos
            }}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground">
              Soporta todos los tipos de archivo hasta 10MB
            </p>
          </div>
        )}

        {/* Archivos generales del proyecto */}
        {stageFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Archivos Generales</h4>
            <div className="space-y-2">
              {stageFiles.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  canDelete={canDelete}
                  onDelete={() => {
                    // TODO: Implementar eliminación
                    console.log('Delete file:', file.id);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Archivos específicos de etapas */}
        {stageSpecificFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Archivos por Etapa</h4>
            <div className="space-y-2">
              {stageSpecificFiles.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  canDelete={canDelete}
                  showStage={true}
                  onDelete={() => {
                    // TODO: Implementar eliminación
                    console.log('Delete file:', file.id);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {files.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Paperclip className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">Sin archivos subidos</p>
            <p className="text-xs text-muted-foreground mt-1">
              Los archivos del proyecto aparecerán aquí
            </p>
            {canUpload && (
              <Button variant="outline" size="sm" className="mt-3">
                <Plus className="h-3 w-3 mr-1.5" />
                Subir primer archivo
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FileRowProps {
  file: FileEntry;
  canDelete: boolean;
  showStage?: boolean;
  onDelete: () => void;
}

function FileRow({ file, canDelete, showStage = false, onDelete }: FileRowProps) {
  const fileInfo = getFileType(file.mime ?? null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50 transition-colors">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 ${fileInfo.color}`}>
        <File className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate" title={file.file_name}>
          {file.file_name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{fileInfo.label}</span>
          <span>•</span>
          <span>{formatFileSize(file.size ?? 0)}</span>
          <span>•</span>
          <span>{formatDate(file.uploaded_at)}</span>
          {showStage && file.stage_id && (
            <>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                Etapa específica
              </Badge>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
          <a href={`https://supabase.storage/${file.storage_path}`} download aria-label={`Descargar ${file.file_name}`}>
            <Download className="h-3 w-3" />
          </a>
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function getFileType(mime: string | null): { label: string; color: string } {
  if (!mime) return { label: 'Archivo', color: 'text-gray-600' };

  if (mime.includes('image/')) return { label: 'Imagen', color: 'text-green-600' };
  if (mime.includes('pdf')) return { label: 'PDF', color: 'text-red-600' };
  if (mime.includes('word') || mime.includes('document')) return { label: 'Documento', color: 'text-blue-600' };
  if (mime.includes('sheet') || mime.includes('excel')) return { label: 'Hoja de cálculo', color: 'text-green-600' };
  if (mime.includes('zip') || mime.includes('rar')) return { label: 'Archivo', color: 'text-yellow-600' };

  return { label: 'Archivo', color: 'text-gray-600' };
}