'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { createCommentSchema, updateCommentSchema } from '@/lib/validators/comments';
import { z } from 'zod';
import { audit } from '@/lib/observability/audit';
import { rateLimitCurrentUser } from '@/lib/security/rate-limit';
import { getUser } from '@/lib/auth/session';

interface CommentActionState {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function createComment(_: unknown, formData: FormData): Promise<CommentActionState> {
  try {
    // Rate limiting with proper error handling
    try {
      rateLimitCurrentUser();
    } catch (rateLimitError) {
      return {
        error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos momentos.',
        success: false,
      };
    }

    const cookieStore = cookies();
    const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });

    // Parse form data
    const payload = Object.fromEntries(formData.entries());
    const parsed = createCommentSchema.safeParse({
      projectId: payload.projectId,
      stageId: payload.stageId || undefined,
      componentId: payload.componentId || undefined,
      body: payload.body
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
        error: 'Debes estar autenticado para comentar',
        success: false,
      };
    }

    // Authorization check for project access
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
        console.error('Client access check error:', memberError);
        return {
          error: 'No tienes permisos para comentar en este proyecto',
          success: false,
        };
      }

      // Verify the user has at least viewer access
      if (!['client_viewer', 'client_editor'].includes(memberCheck.role)) {
        return {
          error: 'No tienes permisos para comentar en este proyecto',
          success: false,
        };
      }
    }

    // Create comment
    const { data, error } = await supabase.from('comments').insert({
      project_id: parsed.data.projectId,
      stage_id: parsed.data.stageId,
      component_id: parsed.data.componentId,
      author_type: userRole as 'provider' | 'client',
      body: parsed.data.body,
      created_by: user.id,
    }).select().single();

    if (error) {
      console.error('Comment creation error:', error);
      return {
        error: 'Error al crear el comentario. Inténtalo de nuevo.',
        success: false,
      };
    }

    // Audit log
    try {
      await audit({
        projectId: parsed.data.projectId,
        actorType: userRole as 'provider' | 'client',
        action: 'comment.created',
        details: { comment_id: data?.id, comment_body: parsed.data.body.substring(0, 100) }
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
      // Don't fail the entire operation for audit log errors
    }

    // Revalidate the project pages
    revalidatePath(`/projects/${parsed.data.projectId}`);
    if (userRole === 'client') {
      revalidatePath(`/c/${user.email}/projects/${parsed.data.projectId}`);
    }

    return {
      success: true,
      message: 'Comentario publicado correctamente',
    };
  } catch (error) {
    console.error('Unexpected error in createComment:', error);
    return {
      error: 'Error inesperado. Inténtalo de nuevo.',
      success: false,
    };
  }
}

const deleteCommentSchema = createCommentSchema.pick({
  projectId: true
}).extend({
  commentId: z.string().uuid('ID de comentario inválido')
});

export async function deleteComment(_: unknown, formData: FormData): Promise<CommentActionState> {
  try {
    // Rate limiting
    try {
      rateLimitCurrentUser();
    } catch (rateLimitError) {
      return {
        error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos momentos.',
        success: false,
      };
    }

    const cookieStore = cookies();
    const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });

    // Parse form data
    const payload = Object.fromEntries(formData.entries());
    const parsed = deleteCommentSchema.safeParse({
      projectId: payload.projectId,
      commentId: payload.commentId
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
        error: 'Debes estar autenticado para eliminar comentarios',
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

    // Get comment to verify ownership
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', parsed.data.commentId)
      .eq('project_id', parsed.data.projectId)
      .single();

    if (commentError || !comment) {
      return {
        error: 'Comentario no encontrado',
        success: false,
      };
    }

    // Permission check:
    // - Users can delete their own comments
    // - Providers can delete client comments (but not vice versa)
    const isAuthor = comment.created_by === user.id;
    const canProviderDelete = userRole === 'provider' && comment.author_type === 'client';

    if (!isAuthor && !canProviderDelete) {
      if (userRole === 'client' && comment.author_type === 'provider') {
        return {
          error: 'No puedes eliminar comentarios del proveedor',
          success: false,
        };
      }
      return {
        error: 'Solo puedes eliminar tus propios comentarios',
        success: false,
      };
    }

    // For clients, verify they have access to this project
    if (userRole === 'client') {
      const { data: memberCheck, error: memberError } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', parsed.data.projectId)
        .eq('email', user.email?.toLowerCase())
        .single();

      if (memberError || !memberCheck) {
        return {
          error: 'No tienes permisos para eliminar comentarios en este proyecto',
          success: false,
        };
      }
    }

    // Delete comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', parsed.data.commentId);

    if (deleteError) {
      console.error('Comment deletion error:', deleteError);
      return {
        error: 'Error al eliminar el comentario. Inténtalo de nuevo.',
        success: false,
      };
    }

    // Audit log
    try {
      await audit({
        projectId: parsed.data.projectId,
        actorType: userRole,
        action: 'comment.deleted',
        details: { comment_id: parsed.data.commentId }
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
      // Don't fail the entire operation for audit log errors
    }

    // Revalidate the project pages
    revalidatePath(`/projects/${parsed.data.projectId}`);
    if (userRole === 'client') {
      revalidatePath(`/c/${user.email}/projects/${parsed.data.projectId}`);
    }

    return {
      success: true,
      message: 'Comentario eliminado correctamente',
    };
  } catch (error) {
    console.error('Unexpected error in deleteComment:', error);
    return {
      error: 'Error inesperado. Inténtalo de nuevo.',
      success: false,
    };
  }
}

export async function updateComment(_: unknown, formData: FormData): Promise<CommentActionState> {
  try {
    // Rate limiting
    try {
      rateLimitCurrentUser();
    } catch (rateLimitError) {
      return {
        error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos momentos.',
        success: false,
      };
    }

    const cookieStore = cookies();
    const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });

    // Parse form data
    const payload = Object.fromEntries(formData.entries());
    const parsed = updateCommentSchema.safeParse({
      projectId: payload.projectId,
      commentId: payload.commentId,
      body: payload.body
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
        error: 'Debes estar autenticado para editar comentarios',
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

    // Get comment to verify ownership
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', parsed.data.commentId)
      .eq('project_id', parsed.data.projectId)
      .single();

    if (commentError || !comment) {
      return {
        error: 'Comentario no encontrado',
        success: false,
      };
    }

    // Verify the user is the author of the comment (only authors can edit)
    if (comment.created_by !== user.id) {
      return {
        error: 'Solo puedes editar tus propios comentarios',
        success: false,
      };
    }

    // For clients, verify they have access to this project
    if (userRole === 'client') {
      const { data: memberCheck, error: memberError } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', parsed.data.projectId)
        .eq('email', user.email?.toLowerCase())
        .single();

      if (memberError || !memberCheck) {
        return {
          error: 'No tienes permisos para editar comentarios en este proyecto',
          success: false,
        };
      }
    }

    // Update comment
    const { error: updateError } = await supabase
      .from('comments')
      .update({
        body: parsed.data.body,
        updated_at: new Date().toISOString()
      })
      .eq('id', parsed.data.commentId);

    if (updateError) {
      console.error('Comment update error:', updateError);
      return {
        error: 'Error al actualizar el comentario. Inténtalo de nuevo.',
        success: false,
      };
    }

    // Audit log
    try {
      await audit({
        projectId: parsed.data.projectId,
        actorType: userRole,
        action: 'comment.updated',
        details: { comment_id: parsed.data.commentId, comment_body: parsed.data.body.substring(0, 100) }
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
      // Don't fail the entire operation for audit log errors
    }

    // Revalidate the project pages
    revalidatePath(`/projects/${parsed.data.projectId}`);
    if (userRole === 'client') {
      revalidatePath(`/c/${user.email}/projects/${parsed.data.projectId}`);
    }

    return {
      success: true,
      message: 'Comentario actualizado correctamente',
    };
  } catch (error) {
    console.error('Unexpected error in updateComment:', error);
    return {
      error: 'Error inesperado. Inténtalo de nuevo.',
      success: false,
    };
  }
}
