'use client';

import { Paperclip, Download } from 'lucide-react';
import type { FileEntry } from '@/types/project';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

export function FilesPanel({ files }: { files: FileEntry[] }) {
  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Paperclip className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">Sin archivos subidos</p>
        <p className="text-xs text-muted-foreground mt-1">Los archivos del proyecto aparecerán aquí</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {files.map((file) => {
        const fileInfo = getFileInfo(file.mime || 'application/octet-stream');
        const FileIcon = fileInfo.icon;

        return (
          <li key={file.id} className="group flex items-center justify-between rounded-2xl border border-border px-4 py-3 transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 ${fileInfo.color}`}>
                <FileIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate" title={file.file_name}>
                  {file.file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fileInfo.label} · {formatFileSize(file.size ?? 0)} · {formatDate(file.uploaded_at)}
                </p>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <a href={`https://supabase.storage/${file.storage_path}`} download aria-label={`Descargar ${file.file_name}`}>
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
