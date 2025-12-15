'use server';

import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { audit } from '@/lib/observability/audit';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/simple-auth';
import {
  updateProjectBasicInfoSchema,
  updateProjectDatesSchema,
  updateProjectStatusSchema,
  updateProjectBudgetSchema,
  updateProjectStageSchema
} from '@/lib/validators/projects';

// Helper function to safely process FormData and handle duplicate keys
function processFormData(formData: FormData): Record<string, any> {
  const payload: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    if (payload[key]) {
      // If key already exists, convert to array or add to existing array
      if (Array.isArray(payload[key])) {
        payload[key].push(value);
      } else {
        payload[key] = [payload[key], value];
      }
    } else {
      payload[key] = value;
    }
  }

  // For projectId specifically, always take the first value if it's an array
  if (Array.isArray(payload.projectId)) {
    payload.projectId = payload.projectId[0];
  }

  return payload;
}

const createProjectSchema = z.object({
  template: z.string(),
  clientId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().optional(),
  deadline: z.string().optional()
});

const assignProjectToClientSchema = z.object({
  projectId: z.string().uuid(),
  clientId: z.string().uuid()
});

export async function createProjectFromTemplate(_: unknown, formData: FormData) {
  const supabase = createSupabaseServerClient();
  const payload = processFormData(formData);
  const parsed = createProjectSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  // Authentication check - usar nuestra función optimizada
  const user = await getCurrentUser();
  const userId = user?.id;
  if (!userId) return { error: { auth: ['No user'] } };

  const { data, error } = await (supabase as any).rpc('create_project_from_template', {
    template_slug: parsed.data.template,
    client_id_input: parsed.data.clientId,
    title_input: parsed.data.title,
    description_input: parsed.data.description ?? '',
    deadline_input: parsed.data.deadline ?? null,
    created_by_input: userId
  });

  if (error) return { error: { rpc: [error.message] } };

  await audit({
    projectId: data ?? null,
    actorType: 'provider',
    action: 'project.created',
    details: { template: parsed.data.template }
  });

  revalidatePath('/dashboard');
  return { success: true, projectId: data };
}

export async function updateProjectBasicInfo(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const payload = processFormData(formData);
  const parsed = updateProjectBasicInfoSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getCurrentUser();
  const userId = user?.id;
  if (!userId) return { error: { auth: ['No user'] } };

  const { error } = await (supabase as any)
    .from('projects')
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null
    })
    .eq('id', parsed.data.projectId);

  if (error) return { error: { db: [error.message] } };

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'project.updated',
    details: { fields: ['title', 'description'] }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function updateProjectDates(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const payload = processFormData(formData);
  const parsed = updateProjectDatesSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getCurrentUser();
  const userId = user?.id;
  if (!userId) return { error: { auth: ['No user'] } };

  const updateData: any = {};
  if (parsed.data.startDate) updateData.start_date = parsed.data.startDate;
  if (parsed.data.endDate) updateData.end_date = parsed.data.endDate;
  if (parsed.data.deadline) updateData.deadline = parsed.data.deadline;

  const { error } = await (supabase as any)
    .from('projects')
    .update(updateData)
    .eq('id', parsed.data.projectId);

  if (error) return { error: { db: [error.message] } };

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'project.dates_updated',
    details: { fields: Object.keys(updateData) }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function updateProjectStatus(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const payload = processFormData(formData);
  const parsed = updateProjectStatusSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getCurrentUser();
  const userId = user?.id;
  if (!userId) return { error: { auth: ['No user'] } };

  const { error } = await (supabase as any)
    .from('projects')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.projectId);

  if (error) return { error: { db: [error.message] } };

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'project.status_updated',
    details: { newStatus: parsed.data.status }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function updateProjectCurrentStage(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const payload = processFormData(formData);
  const parsed = updateProjectStageSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getCurrentUser();
  const userId = user?.id;
  if (!userId) return { error: { auth: ['No user'] } };

  // Get all stages for this project, ordered by sequence
  const { data: stages, error: stagesError } = await (supabase as any)
    .from('stages')
    .select('id, order, status')
    .eq('project_id', parsed.data.projectId)
    .order('order');

  if (stagesError) return { error: { db: [stagesError.message] } };

  // If currentStageId is provided, mark all stages before it as 'done' and it as 'todo'
  if (parsed.data.currentStageId) {
    const targetStage = stages.find((s: any) => s.id === parsed.data.currentStageId);
    if (!targetStage) return { error: { stage: ['Stage not found'] } };

    // Update stages: mark all before target as 'done', target as 'todo', others remain as is
    const updates = stages.map((stage: any) => ({
      id: stage.id,
      status: stage.order < targetStage.order ? 'done' as const :
              stage.order === targetStage.order ? 'todo' as const :
              stage.order > targetStage.order && stage.status === 'done' ? 'todo' as const :
              stage.status
    })).filter((update: any) => {
      const originalStage = stages.find((s: any) => s.id === update.id);
      return originalStage && originalStage.status !== update.status;
    });

    // Apply the updates
    for (const update of updates) {
      const { error: updateError } = await (supabase as any)
        .from('stages')
        .update({ status: update.status })
        .eq('id', update.id);

      if (updateError) return { error: { db: [updateError.message] } };
    }
  } else {
    // If no currentStageId provided, mark all stages as 'todo' (reset project)
    const { error: resetError } = await (supabase as any)
      .from('stages')
      .update({ status: 'todo' })
      .eq('project_id', parsed.data.projectId);

    if (resetError) return { error: { db: [resetError.message] } };
  }

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'project.stage_changed',
    details: { newStageId: parsed.data.currentStageId }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function assignProjectToClient(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const payload = processFormData(formData);
  const parsed = assignProjectToClientSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getCurrentUser();
  const userId = user?.id;
  if (!userId) return { error: { auth: ['No autorizado'] } };

  // Verificar que el proyecto existe
  const { data: project, error: projectError } = await (supabase as any)
    .from('projects')
    .select('id, title, client_id')
    .eq('id', parsed.data.projectId)
    .single();

  if (projectError || !project) {
    return { error: { project: ['Proyecto no encontrado'] } };
  }

  // Verificar que el cliente existe y está activo
  const { data: client, error: clientError } = await (supabase as any)
    .from('clients')
    .select('id, email, active')
    .eq('id', parsed.data.clientId)
    .single();

  if (clientError || !client) {
    return { error: { client: ['Cliente no encontrado'] } };
  }

  if (!client.active) {
    return { error: { client: ['El cliente no está activo'] } };
  }

  // Actualizar el client_id del proyecto
  const { error: updateError } = await (supabase as any)
    .from('projects')
    .update({ client_id: parsed.data.clientId })
    .eq('id', parsed.data.projectId);

  if (updateError) {
    return { error: { db: [updateError.message] } };
  }

  // Actualizar project_members: eliminar el anterior y agregar el nuevo
  // Primero eliminar miembros existentes con rol de cliente
  await (supabase as any)
    .from('project_members')
    .delete()
    .eq('project_id', parsed.data.projectId)
    .in('role', ['client_viewer', 'client_editor']);

  // Agregar el nuevo cliente como miembro
  const { error: memberError } = await (supabase as any)
    .from('project_members')
    .insert({
      project_id: parsed.data.projectId,
      email: client.email.toLowerCase(),
      role: 'client_viewer',
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString()
    });

  if (memberError) {
    console.error('Error adding project member:', memberError);
    // No retornamos error aquí, el proyecto ya fue asignado
  }

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'project.client_assigned',
    details: {
      newClientId: parsed.data.clientId,
      previousClientId: project.client_id
    }
  });

  revalidatePath('/clients');
  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath(`/projects/${parsed.data.projectId}`);
  revalidatePath('/dashboard');

  return { success: true };
}
