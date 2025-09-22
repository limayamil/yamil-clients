'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { rateLimitCurrentUser } from '@/lib/security/rate-limit';
import { audit } from '@/lib/observability/audit';
import { getUser } from '@/lib/auth/session';

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
    const user = await getUser();
    if (!user) {
      return {
        error: 'Debes estar autenticado para subir archivos',
        success: false,
      };
    }

    // user is already available from getUser() call above

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

    // For clients, verify they have access to this project using project_members
    if (userRole === 'client') {
      const { data: memberCheck, error: memberError } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', parsed.data.projectId)
        .eq('email', user.email?.toLowerCase())
        .single();

      if (memberError || !memberCheck) {
        console.error('Client access check error in files:', memberError);
        return {
          error: 'No tienes permisos para subir archivos a este proyecto',
          success: false,
        };
      }

      // Verify the user has at least viewer access
      if (!['client_viewer', 'client_editor'].includes(memberCheck.role)) {
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
    const user = await getUser();
    if (!user) {
      return {
        error: 'Debes estar autenticado para eliminar archivos',
        success: false,
      };
    }

    // user is already available from getUser() call above

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
      .select('*')
      .eq('id', parsed.data.fileId)
      .eq('project_id', parsed.data.projectId)
      .single();

    if (fileError || !file) {
      return {
        error: 'Archivo no encontrado',
        success: false,
      };
    }

    // Verify the user is the owner of the file/link
    if (file.created_by !== user.id) {
      return {
        error: 'Solo puedes eliminar tus propios archivos y enlaces',
        success: false,
      };
    }

    // Authorization check using project_members
    if (userRole === 'client') {
      const { data: memberCheck, error: memberError } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', parsed.data.projectId)
        .eq('email', user.email?.toLowerCase())
        .single();

      if (memberError || !memberCheck) {
        console.error('Client access check error for file deletion:', memberError);
        return {
          error: 'No tienes permisos para eliminar este archivo',
          success: false,
        };
      }

      // Verify the user has at least viewer access
      if (!['client_viewer', 'client_editor'].includes(memberCheck.role)) {
        return {
          error: 'No tienes permisos para eliminar este archivo',
          success: false,
        };
      }
    }

    // Delete from storage only if it's a real file, not a URL link
    if (file.mime !== 'text/uri-list') {
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([file.storage_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      }
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

// Schema for adding stage links
const stageLinkSchema = z.object({
  projectId: z.string().uuid(),
  stageId: z.string().uuid(),
  title: z.string().min(1, 'El título es requerido').max(200),
  url: z.string().url('URL inválida'),
});

export async function addStageLink(_: unknown, formData: FormData) {
  try {
    // Rate limiting
    rateLimitCurrentUser(10);

    const cookieStore = cookies();
    const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });

    // Get form data
    const payload = Object.fromEntries(formData.entries());
    const parsed = stageLinkSchema.safeParse({
      projectId: payload.projectId,
      stageId: payload.stageId,
      title: payload.title,
      url: payload.url,
    });

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      return {
        error: firstError || 'Datos del formulario inválidos',
        success: false,
      };
    }

    // Authentication check
    const user = await getUser();
    if (!user) {
      return {
        error: 'Debes estar autenticado para agregar enlaces',
        success: false,
      };
    }

    const userRole = user.user_metadata?.role as 'provider' | 'client';
    if (!userRole) {
      return {
        error: 'Rol de usuario no válido',
        success: false,
      };
    }

    // For clients, verify they have access to this project using project_members
    if (userRole === 'client') {
      const { data: memberCheck, error: memberError } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', parsed.data.projectId)
        .eq('email', user.email?.toLowerCase())
        .single();

      if (memberError || !memberCheck) {
        console.error('Client access check error in stage link:', memberError);
        return {
          error: 'No tienes permisos para agregar enlaces a este proyecto',
          success: false,
        };
      }

      // Verify the user has at least viewer access
      if (!['client_viewer', 'client_editor'].includes(memberCheck.role)) {
        return {
          error: 'No tienes permisos para agregar enlaces a este proyecto',
          success: false,
        };
      }
    }

    // Create link record in database using the files table
    const { data: linkRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        project_id: parsed.data.projectId,
        stage_id: parsed.data.stageId,
        uploader_type: userRole,
        storage_path: parsed.data.url, // Store the URL in storage_path
        file_name: parsed.data.title, // Store the title in file_name
        mime: 'text/uri-list', // Special MIME type for URLs
        size: parsed.data.url.length, // URL length as "size"
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return {
        error: 'Error al guardar el enlace',
        success: false,
      };
    }

    // Log the link addition activity
    await audit({
      projectId: parsed.data.projectId,
      actorType: userRole,
      action: 'stage.link.added',
      details: {
        stage_id: parsed.data.stageId,
        link_id: linkRecord.id,
        title: parsed.data.title,
        url: parsed.data.url,
      },
    });

    // Revalidate the project page to show new link
    revalidatePath(`/c/${user.email}/projects/${parsed.data.projectId}`);
    revalidatePath(`/projects/${parsed.data.projectId}`);

    return {
      success: true,
      linkId: linkRecord.id,
      message: 'Enlace agregado correctamente',
    };
  } catch (error) {
    console.error('Stage link addition error:', error);
    return {
      error: 'Error inesperado al agregar el enlace',
      success: false,
    };
  }
}