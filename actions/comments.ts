'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { createCommentSchema } from '@/lib/validators/comments';
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

      const clientEmail = (project.clients as any)?.email;
      if (clientEmail !== user.email) {
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
