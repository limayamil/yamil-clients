import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { createClient } from '@supabase/supabase-js';
import type { ProjectSummary } from '@/types/project';
import type { Database } from '@/types/database';

export async function getProviderDashboardProjects(userId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc('provider_dashboard_projects', { provider_id: userId });
  if (error) {
    console.error('provider_dashboard_projects', error);
    return [] satisfies ProjectSummary[];
  }
  return (data ?? []).map((item: any) => ({
    ...item,
    stages: Array.isArray(item.stages) ? (item.stages as any[]) : [],
    members: Array.isArray(item.members) ? (item.members as any[]) : [],
    files: Array.isArray(item.files) ? (item.files as any[]) : [],
    comments: Array.isArray(item.comments) ? (item.comments as any[]) : [],
    approvals: Array.isArray(item.approvals) ? (item.approvals as any[]) : [],
    activity: Array.isArray(item.activity) ? (item.activity as any[]) : []
  })) as ProjectSummary[];
}

export async function getProviderProject(projectId: string) {
  const supabase = createSupabaseServerClient();

  // Intentar usar la RPC function que incluye el nombre del cliente
  const { data, error } = await supabase.rpc('provider_project_detail', { project_id_input: projectId });
  if (!error && data) {
    const parsed = data as Record<string, any>;

    // Obtener links, minutas y miembros del proyecto
    const [linksResult, minutesResult, projectMembersResult] = await Promise.all([
      supabase.from('project_links').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('project_minutes').select('*').eq('project_id', projectId).order('meeting_date', { ascending: false }),
      supabase.from('project_members').select('*').eq('project_id', projectId).order('created_at', { ascending: true })
    ]);

    return {
      ...parsed,
      stages: Array.isArray(parsed.stages) ? parsed.stages.map((stage: any) => ({
        ...stage,
        components: stage.stage_components || []
      })) : [],
      members: Array.isArray(parsed.members) ? parsed.members : [],
      files: Array.isArray(parsed.files) ? parsed.files : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
      approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [],
      activity: Array.isArray(parsed.activity) ? parsed.activity : [],
      links: linksResult.data ?? [],
      minutes: minutesResult.data ?? [],
      project_members: projectMembersResult.data ?? []
    } as ProjectSummary;
  }

  // FALLBACK: Usar consultas directas si la RPC falla
  try {
    // Obtener datos del proyecto con el nombre del cliente
    const results = await Promise.all([
      supabase.from('projects').select(`
        *,
        clients (name)
      `).eq('id', projectId).single(),
      supabase.from('stages').select(`
        *,
        stage_components (id, stage_id, component_type, title, config, status, metadata, created_at)
      `).eq('project_id', projectId).order('order'),
      supabase.from('project_members').select('*').eq('project_id', projectId),
      supabase.from('comments').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('files').select('*').eq('project_id', projectId).order('uploaded_at', { ascending: false }),
      supabase.from('activity_log').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(50),
      supabase.from('project_links').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('project_minutes').select('*').eq('project_id', projectId).order('meeting_date', { ascending: false })
    ]);

    const [projectResult, stagesResult, membersResult, commentsResult, filesResult, activityResult, linksResult, minutesResult] = results;

    if (projectResult.error || !projectResult.data) {
      console.error('Direct query error:', projectResult.error);
      return null;
    }

    const projectData = (projectResult as any).data;
    const rawStages = (stagesResult as any).data ?? [];

    // Transform stage_components to components field for each stage
    const transformedStages = rawStages.map((stage: any) => ({
      ...stage,
      components: stage.stage_components || []
    }));

    return {
      id: projectData.id,
      title: projectData.title,
      description: projectData.description,
      status: projectData.status,
      start_date: projectData.start_date,
      end_date: projectData.end_date,
      deadline: projectData.deadline,
      budget_amount: projectData.budget_amount,
      visibility_settings: projectData.visibility_settings,
      created_at: projectData.created_at,
      updated_at: projectData.updated_at,
      stages: transformedStages,
      members: (membersResult as any).data ?? [],
      files: (filesResult as any).data ?? [],
      comments: (commentsResult as any).data ?? [],
      approvals: [], // Placeholder
      activity: (activityResult as any).data ?? [],
      links: (linksResult as any).data ?? [],
      minutes: (minutesResult as any).data ?? [],
      project_members: (membersResult as any).data ?? [],
      progress: 0, // Placeholder
      client_name: (projectData.clients as any)?.name || 'Cliente',
      overdue: false, // Placeholder
      waiting_on_client: false // Placeholder
    } as ProjectSummary;

  } catch (error) {
    console.error('Error in getProviderProject:', error);
    return null;
  }
}

export async function getActiveClients() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('clients').select('id, name, email').eq('active', true).order('name');
  if (error) {
    console.error('clients list', error);
    return [];
  }
  return data ?? [];
}

export async function getProjectTemplates() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('settings').select('key, value');
  if (error) {
    console.error('templates list', error);
    return [];
  }
  return (data ?? [])
    .filter((item) => item.key.startsWith('template.'))
    .map((item) => ({ key: item.key, value: (item.value as Record<string, unknown>) }));
}

export async function getAllClients() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, company, phone, active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all clients:', error);
    return [];
  }
  return data ?? [];
}

export async function getClientById(clientId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, company, phone, active, created_at')
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    return null;
  }
  return data;
}

export async function getClientProjects(clientId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, status, created_at, deadline')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client projects:', error);
    return [];
  }
  return data ?? [];
}
