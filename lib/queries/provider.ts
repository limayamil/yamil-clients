import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import type { ProjectSummary } from '@/types/project';

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
  const { data, error } = await supabase.rpc('provider_project_detail', { project_id_input: projectId });
  if (error) {
    console.error('provider_project_detail', error);
    return null;
  }
  if (!data) return null;
  const parsed = data as Record<string, any>;
  return {
    ...parsed,
    stages: Array.isArray(parsed.stages) ? parsed.stages : [],
    members: Array.isArray(parsed.members) ? parsed.members : [],
    files: Array.isArray(parsed.files) ? parsed.files : [],
    comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [],
    activity: Array.isArray(parsed.activity) ? parsed.activity : []
  } as ProjectSummary;
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
