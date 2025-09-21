'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Trash2, AlertCircle } from 'lucide-react';
import type { FileEntry } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface StageFileDropzoneProps {
  stageId: string;
  stageTitle: string;
  files: FileEntry[];
  isOpen: boolean;
  onClose: () => void;
  onFilesUploaded?: (files: FileEntry[]) => void;
  projectId: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export function StageFileDropzone({
  stageId,
  stageTitle,
  files,
  isOpen,
  onClose,
  onFilesUploaded,
  projectId
}: StageFileDropzoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stageFiles = files.filter(file => file.stage_id === stageId);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const uploadFile = async (file: File): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Simulamos el proceso de subida con progress
        const uploadItem: UploadingFile = {
          file,
          progress: 0,
          status: 'uploading'
        };

        setUploadingFiles(prev => [...prev, uploadItem]);

        // Aquí iría la lógica real de subida a Supabase Storage
        // Por ahora simulamos el progreso
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadingFiles(prev =>
            prev.map(item =>
              item.file === file ? { ...item, progress } : item
            )
          );
        }

        // Marcar como completado
        setUploadingFiles(prev =>
          prev.map(item =>
            item.file === file ? { ...item, status: 'completed' } : item
          )
        );

        // Aquí llamaríamos a la API para registrar el archivo en la base de datos
        toast.success(`Archivo "${file.name}" subido correctamente`);
        resolve();

      } catch (error) {
        setUploadingFiles(prev =>
          prev.map(item =>
            item.file === file
              ? { ...item, status: 'error', error: 'Error al subir archivo' }
              : item
          )
        );
        toast.error(`Error al subir "${file.name}"`);
        reject(error);
      }
    });
  };

  const handleFiles = useCallback(async (fileList: File[]) => {
    const validFiles = fileList.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB máximo
        toast.error(`El archivo "${file.name}" es demasiado grande (máximo 10MB)`);
        return false;
      }
      return true;
    });

    for (const file of validFiles) {
      await uploadFile(file);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, [handleFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(item => item.file !== file));
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed inset-2 z-50 flex flex-col bg-white shadow-2xl sm:inset-4 md:inset-auto md:right-4 md:top-4 md:bottom-4 md:w-96 lg:w-[420px]">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Upload className="h-4 w-4 text-brand-600 flex-shrink-0" />
            <CardTitle className="text-base truncate">Archivos de Etapa</CardTitle>
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
            {stageFiles.length} archivo{stageFiles.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
        {/* Zona de subida */}
        <div className="flex-shrink-0 mb-4">
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragActive
                ? 'border-brand-500 bg-brand-50'
                : 'border-border hover:border-brand-300 hover:bg-brand-50/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Máximo 10MB por archivo
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Seleccionar archivos
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Archivos en proceso de subida */}
        {uploadingFiles.length > 0 && (
          <div className="flex-shrink-0 mb-4 space-y-2">
            <h4 className="text-sm font-medium text-foreground">Subiendo...</h4>
            {uploadingFiles.map((item, index) => (
              <div key={index} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">{item.file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeUploadingFile(item.file)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {item.status === 'uploading' && (
                  <Progress value={item.progress} className="h-1" />
                )}
                {item.status === 'error' && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{item.error}</span>
                  </div>
                )}
                {item.status === 'completed' && (
                  <div className="text-xs text-green-600">✓ Completado</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Lista de archivos existentes */}
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Archivos de esta etapa
          </h4>
          {stageFiles.length > 0 ? (
            <div className="space-y-2">
              {stageFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50">
                  <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size ?? 0)} • {formatDate(file.uploaded_at)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center py-8">
              <div>
                <File className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Sin archivos en esta etapa</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Los archivos específicos de esta etapa aparecerán aquí
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}