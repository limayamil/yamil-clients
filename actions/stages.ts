'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getCurrentUser } from '@/lib/auth/simple-auth';
import {
  requestMaterialsSchema,
  requestApprovalSchema,
  completeStageSchema,
  addStageComponentSchema,
  updateStageComponentSchema,
  deleteStageComponentSchema,
  updateStageSchema,
  createStageSchema,
  deleteStageSchema,
  reorderStagesSchema
} from '@/lib/validators/stages';
import { audit } from '@/lib/observability/audit';
import { trackEvent } from '@/lib/observability/events';
import { rateLimitCurrentUser } from '@/lib/security/rate-limit';
import { revalidatePath } from 'next/cache';

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

export async function requestMaterials(_: unknown, formData: FormData) {
  const supabase = createSupabaseServerClient();
  rateLimitCurrentUser();
  const payload = processFormData(formData);
  const parsed = requestMaterialsSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await (supabase as any).rpc('request_materials_for_project', { project_id_input: parsed.data.projectId });
  if (error) return { error: { rpc: [error.message] } };

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'stage.materials_requested'
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function requestApproval(_: unknown, formData: FormData) {
  const supabase = createSupabaseServerClient();
  rateLimitCurrentUser();
  const payload = processFormData(formData);
  const parsed = requestApprovalSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await (supabase as any).rpc('request_stage_approval', {
    project_id_input: parsed.data.projectId,
    stage_id_input: parsed.data.stageId
  });
  if (error) return { error: { rpc: [error.message] } };

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'stage.approval_requested',
    details: { stageId: parsed.data.stageId }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function completeStage(_: unknown, formData: FormData) {
  const supabase = createSupabaseServerClient();
  rateLimitCurrentUser();
  const payload = processFormData(formData);
  const parsed = completeStageSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await (supabase as any).rpc('complete_stage_and_move_next', { stage_id_input: parsed.data.stageId });
  if (error) return { error: { rpc: [error.message] } };

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'stage.completed',
    details: { stageId: parsed.data.stageId }
  });
  await trackEvent({ name: 'stage.completed', projectId: parsed.data.projectId, payload: { stageId: parsed.data.stageId } });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function addStageComponent(_: unknown, formData: FormData) {
  const supabase = createSupabaseServerClient();
  rateLimitCurrentUser();

  const payload = processFormData(formData);
  const parsed = addStageComponentSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getCurrentUser();
  if (!user) return { error: { auth: ['Sin sesión activa'] } };

  // Verificar que el usuario tiene acceso al proyecto
  const { data: project, error: projectError } = await (supabase as any)
    .from('projects')
    .select('id, organization_id')
    .eq('id', parsed.data.projectId)
    .single();

  if (projectError || !project) {
    return { error: { project: ['Proyecto no encontrado'] } };
  }

  // Insertar el componente
  const { data: component, error } = await (supabase as any)
    .from('stage_components')
    .insert({
      stage_id: parsed.data.stageId,
      component_type: parsed.data.componentType,
      title: parsed.data.title,
      config: parsed.data.config,
      status: 'todo'
    })
    .select()
    .single();

  if (error) return { error: { db: [error.message] } };

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'stage_component.created',
    details: {
      stageId: parsed.data.stageId,
      componentId: component.id,
      componentType: parsed.data.componentType
    }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true, component };
}

export async function updateStageComponent(_: unknown, formData: FormData) {
  const supabase = createSupabaseServerClient();
  rateLimitCurrentUser();

  const payload = processFormData(formData);
  const parsed = updateStageComponentSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getCurrentUser();
  if (!user) return { error: { auth: ['Sin sesión activa'] } };

  // Verificar que el componente existe y el usuario tiene acceso
  const { data: component, error: fetchError } = await (supabase as any)
    .from('stage_components')
    .select(`
      id,
      stage_id,
      stages!inner(
        id,
        project_id,
        projects!inner(id, organization_id)
      )
    `)
    .eq('id', parsed.data.componentId)
    .single();

  if (fetchError || !component) {
    return { error: { component: ['Componente no encontrado'] } };
  }

  // Preparar datos para actualizar
  const updateData: any = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.config !== undefined) updateData.config = parsed.data.config;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

  const { error } = await (supabase as any)
    .from('stage_components')
    .update(updateData)
    .eq('id', parsed.data.componentId);

  if (error) return { error: { db: [error.message] } };

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'stage_component.updated',
    details: {
      componentId: parsed.data.componentId,
      updates: updateData
    }
  });

  // Revalidar tanto rutas de provider como de cliente
  revalidatePath(`/projects/${parsed.data.projectId}`);
  revalidatePath(`/c`, 'layout'); // Revalidar todas las rutas de cliente

  return { success: true };
}

export async function deleteStageComponent(_: unknown, formData: FormData) {
  const supabase = createSupabaseServerClient();
  rateLimitCurrentUser();

  const payload = processFormData(formData);
  const parsed = deleteStageComponentSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getCurrentUser();
  if (!user) return { error: { auth: ['Sin sesión activa'] } };

  // Verificar que el componente existe y el usuario tiene acceso
  const { data: component, error: fetchError } = await (supabase as any)
    .from('stage_components')
    .select(`
      id,
      stage_id,
      component_type,
      stages!inner(
        id,
        project_id,
        projects!inner(id, organization_id)
      )
    `)
    .eq('id', parsed.data.componentId)
    .single();

  if (fetchError || !component) {
    return { error: { component: ['Componente no encontrado'] } };
  }

  const { error } = await (supabase as any)
    .from('stage_components')
    .delete()
    .eq('id', parsed.data.componentId);

  if (error) return { error: { db: [error.message] } };

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'stage_component.deleted',
    details: {
      componentId: parsed.data.componentId,
      stageId: component.stage_id,
      componentType: component.component_type
    }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function updateStage(_: unknown, formData: FormData) {
  const supabase = createSupabaseServerClient();
  rateLimitCurrentUser();

  const payload = processFormData(formData);
  const parsed = updateStageSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getCurrentUser();
  if (!user) return { error: { auth: ['Sin sesión activa'] } };

  // Verificar que la etapa existe y el usuario tiene acceso
  const { data: stage, error: fetchError } = await (supabase as any)
    .from('stages')
    .select(`
      id,
      project_id,
      title,
      status,
      projects!inner(id, organization_id)
    `)
    .eq('id', parsed.data.stageId)
    .single();

  if (fetchError || !stage) {
    return { error: { stage: ['Etapa no encontrada'] } };
  }

  // Preparar datos para actualizar
  const updateData: any = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.planned_start !== undefined) updateData.planned_start = parsed.data.planned_start;
  if (parsed.data.planned_end !== undefined) updateData.planned_end = parsed.data.planned_end;
  if (parsed.data.deadline !== undefined) updateData.deadline = parsed.data.deadline;

  const { error } = await (supabase as any)
    .from('stages')
    .update(updateData)
    .eq('id', parsed.data.stageId);

  if (error) return { error: { db: [error.message] } };

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'stage.updated',
    details: {
      stageId: parsed.data.stageId,
      updates: updateData
    }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function createStage(_: unknown, formData: FormData) {
  const supabase = createSupabaseServerClient();
  rateLimitCurrentUser();

  const payload = processFormData(formData);
  const parsed = createStageSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getCurrentUser();
  if (!user) return { error: { auth: ['Sin sesión activa'] } };

  // Verificar acceso al proyecto
  const { data: project, error: projectError } = await (supabase as any)
    .from('projects')
    .select('id')
    .eq('id', parsed.data.projectId)
    .single();

  if (projectError || !project) {
    return { error: { project: ['Proyecto no encontrado'] } };
  }

  // Obtener el siguiente order basado en la posición de inserción
  let nextOrder = 1;
  if (parsed.data.insertAfterStageId) {
    const { data: insertAfterStage } = await (supabase as any)
      .from('stages')
      .select('"order"')
      .eq('id', parsed.data.insertAfterStageId)
      .single();

    if (insertAfterStage) {
      nextOrder = insertAfterStage.order + 1;
      // Actualizar el orden de las etapas siguientes
      const { data: stagesToUpdate } = await (supabase as any)
        .from('stages')
        .select('id, order')
        .eq('project_id', parsed.data.projectId)
        .gte('order', nextOrder);

      if (stagesToUpdate && stagesToUpdate.length > 0) {
        for (const stage of stagesToUpdate) {
          await (supabase as any)
            .from('stages')
            .update({ order: stage.order + 1 })
            .eq('id', stage.id);
        }
      }
    }
  } else {
    // Si no se especifica posición, agregar al final
    const { data: lastStage } = await (supabase as any)
      .from('stages')
      .select('"order"')
      .eq('project_id', parsed.data.projectId)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    if (lastStage) {
      nextOrder = lastStage.order + 1;
    }
  }

  // Crear la nueva etapa
  const { data: newStage, error } = await (supabase as any)
    .from('stages')
    .insert({
      project_id: parsed.data.projectId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      type: parsed.data.type,
      status: parsed.data.status,
      planned_start: parsed.data.planned_start || null,
      planned_end: parsed.data.planned_end || null,
      deadline: parsed.data.deadline || null,
      owner: parsed.data.owner,
      order: nextOrder
    })
    .select('id')
    .single();

  if (error) return { error: { db: [error.message] } };

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'stage.created',
    details: {
      stageId: newStage.id,
      title: parsed.data.title,
      type: parsed.data.type
    }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true, stageId: newStage.id };
}

export async function deleteStage(_: unknown, formData: FormData) {
  const supabase = createSupabaseServerClient();
  rateLimitCurrentUser();

  const payload = processFormData(formData);
  const parsed = deleteStageSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getCurrentUser();
  if (!user) return { error: { auth: ['Sin sesión activa'] } };

  // Verificar que la etapa existe y obtener información
  const { data: stage, error: stageError } = await (supabase as any)
    .from('stages')
    .select(`
      id,
      title,
      "order",
      project_id,
      stage_components(id)
    `)
    .eq('id', parsed.data.stageId)
    .single();

  if (stageError || !stage) {
    return { error: { stage: ['Etapa no encontrada'] } };
  }

  // Verificar que no tenga componentes activos
  if (stage.stage_components && stage.stage_components.length > 0) {
    return { error: { stage: ['No se puede eliminar una etapa que contiene componentes'] } };
  }

  // Eliminar la etapa
  const { error } = await (supabase as any)
    .from('stages')
    .delete()
    .eq('id', parsed.data.stageId);

  if (error) return { error: { db: [error.message] } };

  // Actualizar el orden de las etapas siguientes
  const { data: stagesToUpdate } = await (supabase as any)
    .from('stages')
    .select('id, order')
    .eq('project_id', stage.project_id)
    .gt('order', stage.order);

  if (stagesToUpdate && stagesToUpdate.length > 0) {
    for (const stageToUpdate of stagesToUpdate) {
      await (supabase as any)
        .from('stages')
        .update({ order: stageToUpdate.order - 1 })
        .eq('id', stageToUpdate.id);
    }
  }

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'stage.deleted',
    details: {
      stageId: parsed.data.stageId,
      title: stage.title
    }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function reorderStages(_: unknown, formData: FormData) {
  const supabase = createSupabaseServerClient();
  rateLimitCurrentUser();

  const payload = processFormData(formData);
  const parsed = reorderStagesSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await getCurrentUser();
  if (!user) return { error: { auth: ['Sin sesión activa'] } };

  // Verificar que todas las etapas pertenecen al proyecto
  const { data: stages, error: stagesError } = await (supabase as any)
    .from('stages')
    .select('id, title')
    .eq('project_id', parsed.data.projectId)
    .in('id', parsed.data.stageIds);

  if (stagesError || !stages || stages.length !== parsed.data.stageIds.length) {
    return { error: { stages: ['Una o más etapas no encontradas'] } };
  }

  // Actualizar el orden de cada etapa
  const updates = parsed.data.stageIds.map((stageId, index) => ({
    id: stageId,
    order: index + 1
  }));

  for (const update of updates) {
    await (supabase as any)
      .from('stages')
      .update({ order: update.order })
      .eq('id', update.id);
  }

  await audit({
    projectId: parsed.data.projectId,
    actorType: 'provider',
    action: 'stages.reordered',
    details: {
      stageIds: parsed.data.stageIds
    }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}
