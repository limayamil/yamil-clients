'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { rateLimitCurrentUser } from '@/lib/security/rate-limit';
import { audit } from '@/lib/observability/audit';
import { getSession } from '@/lib/auth/session';

// File upload validation schema
const fileUploadSchema = z.object({
  projectId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().min(1).max(50 * 1024 * 1024), // 50MB max
  mimeType: z.string().min(1).max(100),
  storagePath: z.string().min(1).max(500),
});

// Allowed file types and their MIME types for security
const ALLOWED_FILE_TYPES = {
  // Documents
  'application/pdf': { extension: 'pdf', maxSize: 50 * 1024 * 1024 },
  'application/msword': { extension: 'doc', maxSize: 50 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { extension: 'docx', maxSize: 50 * 1024 * 1024 },
  'application/vnd.ms-excel': { extension: 'xls', maxSize: 50 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { extension: 'xlsx', maxSize: 50 * 1024 * 1024 },
  'application/vnd.ms-powerpoint': { extension: 'ppt', maxSize: 50 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { extension: 'pptx', maxSize: 50 * 1024 * 1024 },
  'text/plain': { extension: 'txt', maxSize: 10 * 1024 * 1024 },
  'text/csv': { extension: 'csv', maxSize: 50 * 1024 * 1024 },

  // Images
  'image/jpeg': { extension: 'jpg', maxSize: 20 * 1024 * 1024 },
  'image/png': { extension: 'png', maxSize: 20 * 1024 * 1024 },
  'image/gif': { extension: 'gif', maxSize: 10 * 1024 * 1024 },
  'image/webp': { extension: 'webp', maxSize: 20 * 1024 * 1024 },
  'image/svg+xml': { extension: 'svg', maxSize: 5 * 1024 * 1024 },

  // Archives
  'application/zip': { extension: 'zip', maxSize: 100 * 1024 * 1024 },
  'application/x-rar-compressed': { extension: 'rar', maxSize: 100 * 1024 * 1024 },

  // Audio/Video
  'audio/mpeg': { extension: 'mp3', maxSize: 50 * 1024 * 1024 },
  'audio/wav': { extension: 'wav', maxSize: 100 * 1024 * 1024 },
  'video/mp4': { extension: 'mp4', maxSize: 500 * 1024 * 1024 },
  'video/quicktime': { extension: 'mov', maxSize: 500 * 1024 * 1024 },
};

/**
 * Validates file security and type safety
 */
function validateFileUpload(fileName: string, mimeType: string, fileSize: number) {
  // Check if MIME type is allowed
  const allowedType = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES];
  if (!allowedType) {
    throw new Error(`Tipo de archivo no permitido: ${mimeType}`);
  }

  // Check file size against type-specific limits
  if (fileSize > allowedType.maxSize) {
    const maxSizeMB = Math.round(allowedType.maxSize / (1024 * 1024));
    throw new Error(`El archivo ${fileName} supera el tamaño máximo de ${maxSizeMB}MB para este tipo de archivo`);
  }

  // Basic filename validation - prevent path traversal
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    throw new Error('Nombre de archivo no válido');
  }

  // Check for suspicious file extensions
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  if (!fileExtension || fileExtension !== allowedType.extension) {
    throw new Error(`La extensión del archivo debe ser .${allowedType.extension} para el tipo ${mimeType}`);
  }

  // Additional security checks
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|sh)$/i, // Executable files
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i, // Windows reserved names
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fileName)) {
      throw new Error('Nombre de archivo no permitido por seguridad');
    }
  }
}

export async function uploadFileRecord(_: unknown, formData: FormData) {
  try {
    // Rate limiting
    rateLimitCurrentUser(5); // Lower limit for file uploads

    const cookieStore = cookies();
    const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });

    // Get form data
    const payload = Object.fromEntries(formData.entries());
    const parsed = fileUploadSchema.safeParse({
      projectId: payload.projectId,
      fileName: payload.fileName,
      fileSize: Number(payload.fileSize),
      mimeType: payload.mimeType,
      storagePath: payload.storagePath,
    });

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      return {
        error: firstError || 'Datos del formulario inválidos',
        success: false,
      };
    }

    // Authentication check - usar nuestra función optimizada
    const session = await getSession();
    if (!session?.user) {
      return {
        error: 'Debes estar autenticado para subir archivos',
        success: false,
      };
    }

    const user = session.user;

    const userRole = user.user_metadata?.role as 'provider' | 'client';
    if (!userRole) {
      return {
        error: 'Rol de usuario no válido',
        success: false,
      };
    }

    // Validate file upload
    try {
      validateFileUpload(parsed.data.fileName, parsed.data.mimeType, parsed.data.fileSize);
    } catch (validationError) {
      return {
        error: validationError instanceof Error ? validationError.message : 'Archivo no válido',
        success: false,
      };
    }

    // For clients, verify they have access to this project
    if (userRole === 'client') {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('client_id, clients!inner(email)')
        .eq('id', parsed.data.projectId)
        .single();

      if (projectError || !project) {
        return {
          error: 'Proyecto no encontrado',
          success: false,
        };
      }

      // Check if client owns this project
      const clientEmail = (project.clients as any)?.email;
      if (clientEmail !== user.email) {
        return {
          error: 'No tienes permisos para subir archivos a este proyecto',
          success: false,
        };
      }
    }

    // Create file record in database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        project_id: parsed.data.projectId,
        uploader_type: userRole,
        storage_path: parsed.data.storagePath,
        file_name: parsed.data.fileName,
        mime: parsed.data.mimeType,
        size: parsed.data.fileSize,
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return {
        error: 'Error al guardar información del archivo',
        success: false,
      };
    }

    // Log the upload activity
    await audit({
      projectId: parsed.data.projectId,
      actorType: userRole,
      action: 'file_uploaded',
      details: {
        file_id: fileRecord.id,
        file_name: parsed.data.fileName,
        file_size: parsed.data.fileSize,
        mime_type: parsed.data.mimeType,
      },
    });

    // Revalidate the project page to show new file
    revalidatePath(`/c/${user.email}/projects/${parsed.data.projectId}`);
    revalidatePath(`/projects/${parsed.data.projectId}`);

    return {
      success: true,
      fileId: fileRecord.id,
      message: 'Archivo subido correctamente',
    };
  } catch (error) {
    console.error('File upload error:', error);
    return {
      error: 'Error inesperado al subir el archivo',
      success: false,
    };
  }
}

// Delete file action
const deleteFileSchema = z.object({
  fileId: z.string().uuid(),
  projectId: z.string().uuid(),
});

export async function deleteFile(_: unknown, formData: FormData) {
  try {
    // Rate limiting
    rateLimitCurrentUser(10);

    const cookieStore = cookies();
    const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });

    // Get form data
    const payload = Object.fromEntries(formData.entries());
    const parsed = deleteFileSchema.safeParse({
      fileId: payload.fileId,
      projectId: payload.projectId,
    });

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      return {
        error: firstError || 'Datos del formulario inválidos',
        success: false,
      };
    }

    // Authentication check - usar nuestra función optimizada
    const sessionData = await getSession();
    if (!sessionData?.user) {
      return {
        error: 'Debes estar autenticado para eliminar archivos',
        success: false,
      };
    }

    const user = sessionData.user;

    const userRole = user.user_metadata?.role as 'provider' | 'client';
    if (!userRole) {
      return {
        error: 'Rol de usuario no válido',
        success: false,
      };
    }

    // Get file information
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*, projects!inner(client_id, clients!inner(email))')
      .eq('id', parsed.data.fileId)
      .eq('project_id', parsed.data.projectId)
      .single();

    if (fileError || !file) {
      return {
        error: 'Archivo no encontrado',
        success: false,
      };
    }

    // Authorization check
    if (userRole === 'client') {
      const clientEmail = (file.projects?.clients as any)?.email;
      if (clientEmail !== user.email) {
        return {
          error: 'No tienes permisos para eliminar este archivo',
          success: false,
        };
      }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([file.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', parsed.data.fileId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return {
        error: 'Error al eliminar el archivo de la base de datos',
        success: false,
      };
    }

    // Log the deletion activity
    await audit({
      projectId: parsed.data.projectId,
      actorType: userRole,
      action: 'file_deleted',
      details: {
        file_name: file.file_name,
        file_size: file.size,
      },
    });

    // Revalidate pages
    revalidatePath(`/c/${user.email}/projects/${parsed.data.projectId}`);
    revalidatePath(`/projects/${parsed.data.projectId}`);

    return {
      success: true,
      message: 'Archivo eliminado correctamente',
    };
  } catch (error) {
    console.error('File deletion error:', error);
    return {
      error: 'Error inesperado al eliminar el archivo',
      success: false,
    };
  }
}