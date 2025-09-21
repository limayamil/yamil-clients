'use client';

import { useState } from 'react';
import { Paperclip, Download, Trash2, Upload, FolderOpen } from 'lucide-react';
import type { FileEntry } from '@/types/project';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileUploadDropzone } from '@/components/ui/file-upload-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { uploadFileRecord, deleteFile } from '@/actions/files';

// Mapa de tipos MIME a iconos y etiquetas en español
const fileTypeMap: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  'application/pdf': { icon: Paperclip, label: 'PDF', color: 'text-red-600' },
  'image/jpeg': { icon: Paperclip, label: 'Imagen', color: 'text-green-600' },
  'image/png': { icon: Paperclip, label: 'Imagen', color: 'text-green-600' },
  'image/gif': { icon: Paperclip, label: 'Imagen', color: 'text-green-600' },
  'application/msword': { icon: Paperclip, label: 'Word', color: 'text-blue-600' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: Paperclip, label: 'Word', color: 'text-blue-600' },
  'application/vnd.ms-excel': { icon: Paperclip, label: 'Excel', color: 'text-green-600' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: Paperclip, label: 'Excel', color: 'text-green-600' },
  'text/plain': { icon: Paperclip, label: 'Texto', color: 'text-gray-600' },
  'application/zip': { icon: Paperclip, label: 'ZIP', color: 'text-yellow-600' },
};

function getFileInfo(mime: string | null) {
  if (!mime) return { icon: Paperclip, label: 'Desconocido', color: 'text-gray-500' };
  return fileTypeMap[mime] || { icon: Paperclip, label: 'Archivo', color: 'text-gray-600' };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

interface FilesManagerProps {
  files: FileEntry[];
  projectId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  className?: string;
}

export function FilesManager({
  files,
  projectId,
  canUpload = true,
  canDelete = true,
  className
}: FilesManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleUpload = async (selectedFiles: File[]) => {
    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of selectedFiles) {
      try {
        // Create a unique storage path
        const timestamp = Date.now();
        const storagePath = `${projectId}/${timestamp}-${file.name}`;

        // Create form data for the server action
        const formData = new FormData();
        formData.append('projectId', projectId);
        formData.append('fileName', file.name);
        formData.append('fileSize', file.size.toString());
        formData.append('mimeType', file.type);
        formData.append('storagePath', storagePath);

        // Upload file to storage first
        const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser-client');
        const supabase = createSupabaseBrowserClient();
        const { error: storageError } = await supabase.storage
          .from('project-files')
          .upload(storagePath, file);

        if (storageError) {
          console.error('Storage upload error:', storageError);
          errorCount++;
          continue;
        }

        // Record file in database
        const result = await uploadFileRecord(null, formData);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error('Database record error:', result.error);
        }
      } catch (error) {
        console.error('Upload error:', error);
        errorCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} archivo${successCount !== 1 ? 's' : ''} subido${successCount !== 1 ? 's' : ''} correctamente`);
    }

    if (errorCount > 0) {
      toast.error(`Error al subir ${errorCount} archivo${errorCount !== 1 ? 's' : ''}`);
    }

    setShowUpload(false);
  };

  const handleDelete = async (fileId: string) => {
    setDeletingFileId(fileId);

    try {
      const formData = new FormData();
      formData.append('fileId', fileId);
      formData.append('projectId', projectId);

      const result = await deleteFile(null, formData);

      if (result.success) {
        toast.success('Archivo eliminado correctamente');
      } else {
        toast.error(result.error || 'Error al eliminar el archivo');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Error inesperado al eliminar el archivo');
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Archivos del proyecto
              {files.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {files.length}
                </Badge>
              )}
            </CardTitle>
            {canUpload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpload(!showUpload)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {showUpload ? 'Ocultar subida' : 'Subir archivos'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {canUpload && showUpload && (
            <FileUploadDropzone
              onFilesSelected={() => {}} // Not used in this implementation
              onUpload={handleUpload}
              maxFileSize={50}
              multiple={true}
              disabled={isUploading}
            />
          )}

          {files.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Paperclip className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">Sin archivos subidos</p>
              <p className="text-xs text-muted-foreground mt-1">
                {canUpload ? 'Haz clic en "Subir archivos" para comenzar' : 'Los archivos del proyecto aparecerán aquí'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => {
                const fileInfo = getFileInfo(file.mime || 'application/octet-stream');
                const FileIcon = fileInfo.icon;
                const isDeleting = deletingFileId === file.id;

                return (
                  <div
                    key={file.id}
                    className="group flex items-center justify-between rounded-2xl border border-border px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 ${fileInfo.color}`}>
                        <FileIcon className="h-5 w-5" />
                      </span>
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
                          {file.uploader_type && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                {file.uploader_type === 'provider' ? 'Proveedor' : 'Cliente'}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <a
                          href={`https://supabase.storage/${file.storage_path}`}
                          download
                          aria-label={`Descargar ${file.file_name}`}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>

                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(file.id)}
                          disabled={isDeleting}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          aria-label={`Eliminar ${file.file_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}