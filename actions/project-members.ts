'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { audit } from '@/lib/observability/audit';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import {
  addProjectMemberSchema,
  removeProjectMemberSchema,
  updateProjectMemberRoleSchema
} from '@/lib/validators/project-members';

// Helper function to safely process FormData
function processFormData(formData: FormData): Record<string, any> {
  const payload: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    if (payload[key]) {
      if (Array.isArray(payload[key])) {
        payload[key].push(value);
      } else {
        payload[key] = [payload[key], value];
      }
    } else {
      payload[key] = value;
    }
  }
  return payload;
}

export async function addProjectMember(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const payload = processFormData(formData);
  const parsed = addProjectMemberSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // Verificar que el usuario sea un proveedor
  const user = await getUser();
  if (!user?.id) {
    return { error: { auth: ['No autorizado'] } };
  }

  // Verificar que el proyecto existe y el usuario tiene permisos
  const { data: project, error: projectError } = await (supabase as any)
    .from('projects')
    .select('id, title')
    .eq('id', parsed.data.projectId)
    .single();

  if (projectError || !project) {
    return { error: { project: ['Proyecto no encontrado'] } };
  }

  // Verificar que el email no esté ya agregado al proyecto
  const { data: existingMember, error: memberCheckError } = await (supabase as any)
    .from('project_members')
    .select('id')
    .eq('project_id', parsed.data.projectId)
    .eq('email', parsed.data.email.toLowerCase())
    .single();

  if (memberCheckError && memberCheckError.code !== 'PGRST116') {
    return { error: { db: [memberCheckError.message] } };
  }

  if (existingMember) {
    return { error: { email: ['Este usuario ya es miembro del proyecto'] } };
  }

  // Agregar el miembro al proyecto
  const { error: insertError } = await (supabase as any)
    .from('project_members')
    .insert({
      project_id: parsed.data.projectId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      invited_at: new Date().toISOString()
    });

  if (insertError) {
    return { error: { db: [insertError.message] } };
  }

  // Auditar la acción
  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'project.member_added',
    details: {
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role
    }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function removeProjectMember(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const payload = processFormData(formData);
  const parsed = removeProjectMemberSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // Verificar que el usuario sea un proveedor
  const user = await getUser();
  if (!user?.id) {
    return { error: { auth: ['No autorizado'] } };
  }

  // Eliminar el miembro del proyecto
  const { error: deleteError } = await (supabase as any)
    .from('project_members')
    .delete()
    .eq('project_id', parsed.data.projectId)
    .eq('email', parsed.data.email.toLowerCase());

  if (deleteError) {
    return { error: { db: [deleteError.message] } };
  }

  // Auditar la acción
  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'project.member_removed',
    details: { email: parsed.data.email.toLowerCase() }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function updateProjectMemberRole(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const payload = processFormData(formData);
  const parsed = updateProjectMemberRoleSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // Verificar que el usuario sea un proveedor
  const user = await getUser();
  if (!user?.id) {
    return { error: { auth: ['No autorizado'] } };
  }

  // Actualizar el rol del miembro
  const { error: updateError } = await (supabase as any)
    .from('project_members')
    .update({ role: parsed.data.role })
    .eq('project_id', parsed.data.projectId)
    .eq('email', parsed.data.email.toLowerCase());

  if (updateError) {
    return { error: { db: [updateError.message] } };
  }

  // Auditar la acción
  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'project.member_role_updated',
    details: {
      email: parsed.data.email.toLowerCase(),
      newRole: parsed.data.role
    }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function getProjectMembers(projectId: string) {
  const supabase = createSupabaseServerClient();

  // Verificar que el usuario tenga acceso
  const user = await getUser();
  if (!user?.id) {
    return [];
  }

  const { data, error } = await (supabase as any)
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching project members:', error);
    return [];
  }

  return data || [];
}