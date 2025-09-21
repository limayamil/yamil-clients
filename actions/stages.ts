'use server';

import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import {
  requestMaterialsSchema,
  requestApprovalSchema,
  completeStageSchema,
  addStageComponentSchema,
  updateStageComponentSchema,
  deleteStageComponentSchema,
  updateStageSchema
} from '@/lib/validators/stages';
import { audit } from '@/lib/observability/audit';
import { trackEvent } from '@/lib/observability/events';
import { rateLimitCurrentUser } from '@/lib/security/rate-limit';
import { revalidatePath } from 'next/cache';

export async function requestMaterials(_: unknown, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });
  rateLimitCurrentUser();
  const payload = Object.fromEntries(formData.entries());
  const parsed = requestMaterialsSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await supabase.rpc('request_materials_for_project', { project_id_input: parsed.data.projectId });
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
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });
  rateLimitCurrentUser();
  const payload = Object.fromEntries(formData.entries());
  const parsed = requestApprovalSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await supabase.rpc('request_stage_approval', {
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
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });
  rateLimitCurrentUser();
  const payload = Object.fromEntries(formData.entries());
  const parsed = completeStageSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await supabase.rpc('complete_stage_and_move_next', { stage_id_input: parsed.data.stageId });
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
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });
  rateLimitCurrentUser();

  const payload = Object.fromEntries(formData.entries());
  const parsed = addStageComponentSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: { auth: ['Sin sesión activa'] } };

  // Verificar que el usuario tiene acceso al proyecto
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, organization_id')
    .eq('id', parsed.data.projectId)
    .single();

  if (projectError || !project) {
    return { error: { project: ['Proyecto no encontrado'] } };
  }

  // Insertar el componente
  const { data: component, error } = await supabase
    .from('stage_components')
    .insert({
      stage_id: parsed.data.stageId,
      component_type: parsed.data.componentType,
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
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });
  rateLimitCurrentUser();

  const payload = Object.fromEntries(formData.entries());
  const parsed = updateStageComponentSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: { auth: ['Sin sesión activa'] } };

  // Verificar que el componente existe y el usuario tiene acceso
  const { data: component, error: fetchError } = await supabase
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
  if (parsed.data.config !== undefined) updateData.config = parsed.data.config;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

  const { error } = await supabase
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

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true };
}

export async function deleteStageComponent(_: unknown, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });
  rateLimitCurrentUser();

  const payload = Object.fromEntries(formData.entries());
  const parsed = deleteStageComponentSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: { auth: ['Sin sesión activa'] } };

  // Verificar que el componente existe y el usuario tiene acceso
  const { data: component, error: fetchError } = await supabase
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

  const { error } = await supabase
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
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });
  rateLimitCurrentUser();

  const payload = Object.fromEntries(formData.entries());
  const parsed = updateStageSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: { auth: ['Sin sesión activa'] } };

  // Verificar que la etapa existe y el usuario tiene acceso
  const { data: stage, error: fetchError } = await supabase
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

  const { error } = await supabase
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
