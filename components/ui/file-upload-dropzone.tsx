'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileIcon, Loader2, Link, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface FileUploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onUpload: (files: File[]) => Promise<void>;
  onUrlSubmitted?: (url: string, title?: string) => Promise<void>;
  maxFileSize?: number; // en MB
  allowedTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  mode?: 'files' | 'urls' | 'both'; // New prop to control mode
}

interface FileWithPreview extends File {
  id: string;
  preview?: string;
}

export function FileUploadDropzone({
  onFilesSelected,
  onUpload,
  onUrlSubmitted,
  maxFileSize = 10,
  allowedTypes = [],
  multiple = true,
  disabled = false,
  className,
  mode = 'files'
}: FileUploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const files = Array.from(fileList).map((file) => {
      const fileWithId = Object.assign(file, {
        id: Math.random().toString(36).substr(2, 9)
      }) as FileWithPreview;

      // Create preview for images
      if (file.type.startsWith('image/')) {
        fileWithId.preview = URL.createObjectURL(file);
      }

      return fileWithId;
    });

    // Filter by file size
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize * 1024 * 1024) {
        console.warn(`Archivo ${file.name} excede el tamaño máximo de ${maxFileSize}MB`);
        return false;
      }
      return true;
    });

    // Filter by allowed types
    const finalFiles = allowedTypes.length > 0
      ? validFiles.filter(file => allowedTypes.includes(file.type))
      : validFiles;

    if (!multiple) {
      setSelectedFiles(finalFiles.slice(0, 1));
      onFilesSelected(finalFiles.slice(0, 1));
    } else {
      setSelectedFiles(prev => [...prev, ...finalFiles]);
      onFilesSelected(finalFiles);
    }
  }, [maxFileSize, allowedTypes, multiple, onFilesSelected]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  }, [processFiles]);

  const removeFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Revoke object URL to prevent memory leaks
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updated;
    });
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(selectedFiles);
      // Clear files after successful upload
      selectedFiles.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmitUrl = async () => {
    if (!urlInput.trim() || !onUrlSubmitted) return;

    if (!validateUrl(urlInput.trim())) {
      console.warn('Invalid URL provided');
      return;
    }

    setIsSubmittingUrl(true);
    try {
      await onUrlSubmitted(urlInput.trim());
      setUrlInput('');
    } catch (error) {
      console.error('Error submitting URL:', error);
    } finally {
      setIsSubmittingUrl(false);
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitUrl();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* File upload interface - show if mode is 'files' or 'both' */}
      {(mode === 'files' || mode === 'both') && (
        <div
          className={cn(
            'relative rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors',
            isDragActive && 'border-brand-500 bg-brand-50',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'hover:border-brand-300 hover:bg-brand-50/50 cursor-pointer'
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={allowedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />

          <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
          <div className="space-y-2">
            <p className="text-base font-medium text-foreground">
              {isDragActive ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí o haz clic para seleccionar'}
            </p>
            <p className="text-sm text-muted-foreground">
              Máximo {maxFileSize}MB por archivo
              {allowedTypes.length > 0 && (
                <span className="block">
                  Tipos permitidos: {allowedTypes.map(type => type.split('/')[1]).join(', ')}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* URL input interface - show if mode is 'urls' or 'both' */}
      {(mode === 'urls' || mode === 'both') && (
        <div className="rounded-xl border border-border p-6 bg-brand-50/30">
          <div className="flex items-center gap-2 mb-4">
            <Link className="h-5 w-5 text-brand-600" />
            <h3 className="text-sm font-medium text-foreground">Compartir enlace</h3>
          </div>
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleUrlKeyDown}
              placeholder="https://drive.google.com/... o https://dropbox.com/..."
              className="flex-1"
              disabled={disabled || isSubmittingUrl}
            />
            <Button
              onClick={handleSubmitUrl}
              disabled={!urlInput.trim() || disabled || isSubmittingUrl}
              size="sm"
              className="px-3"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              Archivos seleccionados ({selectedFiles.length})
            </h4>
            <Button
              onClick={handleUpload}
              disabled={isUploading || disabled}
              loading={isUploading}
              size="sm"
            >
              {isUploading ? 'Subiendo...' : 'Subir archivos'}
            </Button>
          </div>

          <div className="space-y-2">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-white p-3"
              >
                {file.preview ? (
                  <Image
                    src={file.preview}
                    alt={file.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  disabled={isUploading}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}