import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import type { ClientProjectCard, ProjectSummary } from '@/types/project';

export async function getClientProjects(clientEmail: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc('client_projects_overview', { client_email: clientEmail });
  if (error) {
    console.error('client_projects_overview', error);
    return [] satisfies ClientProjectCard[];
  }
  return (data ?? []).map((item: any) => ({
    ...item,
    progress: Number(item.progress ?? 0),
    pending_items: Number(item.pending_items ?? 0)
  })) as ClientProjectCard[];
}

export async function getClientProject(projectId: string, clientEmail: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc('client_project_detail', {
    project_id_input: projectId,
    client_email: clientEmail
  });
  if (error) {
    console.error('client_project_detail', error);
    return null;
  }
  if (!data) return null;
  const parsed = data as Record<string, any>;

  // Obtener links y minutas del proyecto
  const [linksResult, minutesResult] = await Promise.all([
    supabase.from('project_links').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('project_minutes').select('*').eq('project_id', projectId).order('meeting_date', { ascending: false })
  ]);

  return {
    ...parsed,
    stages: Array.isArray(parsed.stages) ? parsed.stages : [],
    members: Array.isArray(parsed.members) ? parsed.members : [],
    files: Array.isArray(parsed.files) ? parsed.files : [],
    comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [],
    activity: Array.isArray(parsed.activity) ? parsed.activity : [],
    links: linksResult.data ?? [],
    minutes: minutesResult.data ?? []
  } as ProjectSummary;
}
