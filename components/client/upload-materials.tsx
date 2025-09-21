'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabase } from '@/components/providers/supabase-provider';
import { uploadFileRecord } from '@/actions/files';
import { toast } from 'sonner';

interface UploadMaterialsProps {
  projectId: string;
  clientEmail: string;
}

// Allowed file types for client upload
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.zip', '.rar',
  '.mp3', '.wav', '.mp4', '.mov'
];

export function UploadMaterials({ projectId, clientEmail }: UploadMaterialsProps) {
  const { client } = useSupabase();
  const [isUploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of Array.from(files)) {
        try {
          // Basic client-side validation
          const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
          if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
            toast.error(`Tipo de archivo no permitido: ${file.name}`);
            errorCount++;
            continue;
          }

          // Create secure storage path
          const timestamp = Date.now();
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `${projectId}/${timestamp}-${sanitizedFileName}`;

          // Upload to storage first
          const { error: storageError } = await client.storage
            .from('project-files')
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type
            });

          if (storageError) {
            toast.error(`Error al subir ${file.name}: ${storageError.message}`);
            errorCount++;
            continue;
          }

          // Then create database record using secure server action
          const formData = new FormData();
          formData.append('projectId', projectId);
          formData.append('fileName', file.name);
          formData.append('fileSize', file.size.toString());
          formData.append('mimeType', file.type);
          formData.append('storagePath', storagePath);

          const result = await uploadFileRecord(null, formData);

          if (result?.success) {
            successCount++;
          } else {
            // If database record creation fails, clean up storage
            await client.storage.from('project-files').remove([storagePath]);
            toast.error(`Error al registrar ${file.name}: ${result?.error || 'Error desconocido'}`);
            errorCount++;
          }
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          toast.error(`Error al subir ${file.name}`);
          errorCount++;
        }
      }

      // Show summary message
      if (successCount > 0) {
        toast.success(`${successCount} archivo(s) subido(s) correctamente`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} archivo(s) fallaron al subir`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error general al subir archivos');
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  return (
    <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
      <Upload className="h-4 w-4" />
      {isUploading ? 'Subiendo…' : 'Subir materiales'}
      <input
        type="file"
        className="sr-only"
        multiple
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={handleUpload}
        disabled={isUploading}
      />
    </label>
  );
}
