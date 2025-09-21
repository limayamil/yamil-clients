'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getUser } from '@/lib/auth/session';
import { audit } from '@/lib/observability/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const addLinkSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, 'El título es requerido').max(200),
  url: z.string().url('URL inválida'),
});

const updateLinkSchema = z.object({
  linkId: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1, 'El título es requerido').max(200),
  url: z.string().url('URL inválida'),
});

const deleteLinkSchema = z.object({
  linkId: z.string().uuid(),
  projectId: z.string().uuid(),
});

export async function addProjectLink(formData: FormData) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return { error: { auth: ['No tienes permisos para realizar esta acción'] } };
    }

    const parsed = addLinkSchema.safeParse({
      projectId: formData.get('projectId'),
      title: formData.get('title'),
      url: formData.get('url'),
    });

    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors };
    }

    const { projectId, title, url } = parsed.data;

    const supabase = createSupabaseServerClient();

    // Verificar que el usuario tiene acceso al proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { error: { project: ['Proyecto no encontrado'] } };
    }

    // Insertar el nuevo link
    const { error: insertError } = await supabase
      .from('project_links')
      .insert({
        project_id: projectId,
        title,
        url,
        created_by: user.id,
      });

    if (insertError) {
      console.error('Error adding project link:', insertError);
      return { error: { db: ['Error al agregar el link'] } };
    }

    // Registrar en auditoría
    await audit({
      projectId,
      actorType: 'provider',
      action: 'project.link.added',
      details: { title, url },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/c/*/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in addProjectLink:', error);
    return { error: { server: ['Error interno del servidor'] } };
  }
}

export async function updateProjectLink(formData: FormData) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return { error: { auth: ['No tienes permisos para realizar esta acción'] } };
    }

    const parsed = updateLinkSchema.safeParse({
      linkId: formData.get('linkId'),
      projectId: formData.get('projectId'),
      title: formData.get('title'),
      url: formData.get('url'),
    });

    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors };
    }

    const { linkId, projectId, title, url } = parsed.data;

    const supabase = createSupabaseServerClient();

    // Actualizar el link
    const { error: updateError } = await supabase
      .from('project_links')
      .update({ title, url })
      .eq('id', linkId)
      .eq('project_id', projectId);

    if (updateError) {
      console.error('Error updating project link:', updateError);
      return { error: { db: ['Error al actualizar el link'] } };
    }

    // Registrar en auditoría
    await audit({
      projectId,
      actorType: 'provider',
      action: 'project.link.updated',
      details: { linkId, title, url },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/c/*/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in updateProjectLink:', error);
    return { error: { server: ['Error interno del servidor'] } };
  }
}

export async function deleteProjectLink(formData: FormData) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return { error: { auth: ['No tienes permisos para realizar esta acción'] } };
    }

    const parsed = deleteLinkSchema.safeParse({
      linkId: formData.get('linkId'),
      projectId: formData.get('projectId'),
    });

    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors };
    }

    const { linkId, projectId } = parsed.data;

    const supabase = createSupabaseServerClient();

    // Eliminar el link
    const { error: deleteError } = await supabase
      .from('project_links')
      .delete()
      .eq('id', linkId)
      .eq('project_id', projectId);

    if (deleteError) {
      console.error('Error deleting project link:', deleteError);
      return { error: { db: ['Error al eliminar el link'] } };
    }

    // Registrar en auditoría
    await audit({
      projectId,
      actorType: 'provider',
      action: 'project.link.deleted',
      details: { linkId },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/c/*/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in deleteProjectLink:', error);
    return { error: { server: ['Error interno del servidor'] } };
  }
}