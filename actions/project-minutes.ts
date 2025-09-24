'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getUser } from '@/lib/auth/session';
import { audit } from '@/lib/observability/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const addMinuteSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().max(200, 'El título es demasiado largo').optional(),
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  contentMarkdown: z.string().min(0).max(50000, 'El contenido es demasiado largo'),
});

const updateMinuteSchema = z.object({
  minuteId: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().max(200, 'El título es demasiado largo').optional(),
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  contentMarkdown: z.string().min(0).max(50000, 'El contenido es demasiado largo'),
});

const deleteMinuteSchema = z.object({
  minuteId: z.string().uuid(),
  projectId: z.string().uuid(),
});

export async function addProjectMinute(formData: FormData) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return { error: { auth: ['No tienes permisos para realizar esta acción'] } };
    }

    const parsed = addMinuteSchema.safeParse({
      projectId: formData.get('projectId'),
      title: formData.get('title') || undefined,
      meetingDate: formData.get('meetingDate'),
      contentMarkdown: formData.get('contentMarkdown') || '',
    });

    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors };
    }

    const { projectId, title, meetingDate, contentMarkdown } = parsed.data;

    // Generar título automático si no se proporciona
    const finalTitle = title || `Reunión ${new Date(meetingDate).toLocaleDateString('es-ES')}}`;

    const supabase = createSupabaseServerClient();

    // Verificar que el usuario tiene acceso al proyecto
    const { data: project, error: projectError } = await (supabase as any)
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { error: { project: ['Proyecto no encontrado'] } };
    }

    // Verificar si ya existe una minuta para esa fecha
    const { data: existingMinute } = await (supabase as any)
      .from('project_minutes')
      .select('id')
      .eq('project_id', projectId)
      .eq('meeting_date', meetingDate)
      .single();

    if (existingMinute) {
      return { error: { meetingDate: ['Ya existe una minuta para esta fecha'] } };
    }

    // Insertar la nueva minuta
    const { data: insertedMinute, error: insertError } = await (supabase as any)
      .from('project_minutes')
      .insert({
        project_id: projectId,
        title: finalTitle,
        meeting_date: meetingDate,
        content_markdown: contentMarkdown,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding project minute:', insertError);
      return { error: { db: ['Error al agregar la minuta'] } };
    }

    // Registrar en auditoría
    await audit({
      projectId,
      actorType: 'provider',
      action: 'project.minute.added',
      details: { meetingDate, minuteId: insertedMinute.id },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/c/*/projects/${projectId}`);

    return { success: true, minute: insertedMinute };
  } catch (error) {
    console.error('Error in addProjectMinute:', error);
    return { error: { server: ['Error interno del servidor'] } };
  }
}

export async function updateProjectMinute(formData: FormData) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return { error: { auth: ['No tienes permisos para realizar esta acción'] } };
    }

    const parsed = updateMinuteSchema.safeParse({
      minuteId: formData.get('minuteId'),
      projectId: formData.get('projectId'),
      title: formData.get('title') || undefined,
      meetingDate: formData.get('meetingDate'),
      contentMarkdown: formData.get('contentMarkdown') || '',
    });

    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors };
    }

    const { minuteId, projectId, title, meetingDate, contentMarkdown } = parsed.data;

    // Generar título automático si no se proporciona
    const finalTitle = title || `Reunión ${new Date(meetingDate).toLocaleDateString('es-ES')}`;

    const supabase = createSupabaseServerClient();

    // Verificar si existe otra minuta con la misma fecha (excepto esta)
    const { data: existingMinute } = await (supabase as any)
      .from('project_minutes')
      .select('id')
      .eq('project_id', projectId)
      .eq('meeting_date', meetingDate)
      .neq('id', minuteId)
      .single();

    if (existingMinute) {
      return { error: { meetingDate: ['Ya existe una minuta para esta fecha'] } };
    }

    // Actualizar la minuta
    const { data: updatedMinute, error: updateError } = await (supabase as any)
      .from('project_minutes')
      .update({
        title: finalTitle,
        meeting_date: meetingDate,
        content_markdown: contentMarkdown,
      })
      .eq('id', minuteId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating project minute:', updateError);
      return { error: { db: ['Error al actualizar la minuta'] } };
    }

    // Registrar en auditoría
    await audit({
      projectId,
      actorType: 'provider',
      action: 'project.minute.updated',
      details: { minuteId, meetingDate },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/c/*/projects/${projectId}`);

    return { success: true, minute: updatedMinute };
  } catch (error) {
    console.error('Error in updateProjectMinute:', error);
    return { error: { server: ['Error interno del servidor'] } };
  }
}

export async function deleteProjectMinute(formData: FormData) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return { error: { auth: ['No tienes permisos para realizar esta acción'] } };
    }

    const parsed = deleteMinuteSchema.safeParse({
      minuteId: formData.get('minuteId'),
      projectId: formData.get('projectId'),
    });

    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors };
    }

    const { minuteId, projectId } = parsed.data;

    const supabase = createSupabaseServerClient();

    // Obtener la fecha de la minuta antes de eliminarla (para auditoría)
    const { data: minute } = await (supabase as any)
      .from('project_minutes')
      .select('meeting_date')
      .eq('id', minuteId)
      .single();

    // Eliminar la minuta
    const { error: deleteError } = await (supabase as any)
      .from('project_minutes')
      .delete()
      .eq('id', minuteId)
      .eq('project_id', projectId);

    if (deleteError) {
      console.error('Error deleting project minute:', deleteError);
      return { error: { db: ['Error al eliminar la minuta'] } };
    }

    // Registrar en auditoría
    await audit({
      projectId,
      actorType: 'provider',
      action: 'project.minute.deleted',
      details: { minuteId, meetingDate: minute?.meeting_date },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/c/*/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in deleteProjectMinute:', error);
    return { error: { server: ['Error interno del servidor'] } };
  }
}

export async function getProjectMinute(projectId: string, meetingDate: string) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return { error: { auth: ['No tienes permisos para realizar esta acción'] } };
    }

    const supabase = createSupabaseServerClient();

    const { data: minute, error } = await (supabase as any)
      .from('project_minutes')
      .select('*')
      .eq('project_id', projectId)
      .eq('meeting_date', meetingDate)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting project minute:', error);
      return { error: { db: ['Error al obtener la minuta'] } };
    }

    return { success: true, minute: minute || null };
  } catch (error) {
    console.error('Error in getProjectMinute:', error);
    return { error: { server: ['Error interno del servidor'] } };
  }
}