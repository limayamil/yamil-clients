import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { createClient } from '@supabase/supabase-js';
import type { ClientProjectCard, ProjectSummary } from '@/types/project';
import type { Database } from '@/types/database';

export async function getClientProjects(clientEmail: string) {
  if (!clientEmail) {
    return [] satisfies ClientProjectCard[];
  }

  const supabase = createSupabaseServerClient();

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('client_projects_overview', { client_email: clientEmail });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData.map((item: any) => ({
        ...item,
        progress: Number(item.progress ?? 0),
        pending_items: Number(item.pending_items ?? 0)
      })) as ClientProjectCard[];
    }

    // Crear cliente con service role para bypasear RLS
    const serviceSupabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Consulta directa como fallback, bypassing RLS usando service role
    const { data: directData, error: directError } = await serviceSupabase
      .from('projects')
      .select(`
        id,
        title,
        status,
        deadline,
        project_members!inner(email, role)
      `)
      .eq('project_members.email', clientEmail.toLowerCase())
      .eq('project_members.role', 'client_viewer');

    if (directError) {
      console.error('Direct query error:', directError);
      return [] satisfies ClientProjectCard[];
    }

    // Convertir al formato esperado
    const projects = (directData ?? []).map((project: any) => ({
      id: project.id,
      title: project.title,
      status: project.status,
      deadline: project.deadline,
      next_action: '', // Placeholder
      pending_items: 0, // Placeholder
      progress: 0 // Placeholder
    })) as ClientProjectCard[];

    return projects;

  } catch (error) {
    console.error('Error in getClientProjects:', error);
    return [] satisfies ClientProjectCard[];
  }
}

export async function getClientProject(projectId: string, clientEmail: string) {
  if (!projectId || !clientEmail) {
    return null;
  }

  const supabase = createSupabaseServerClient();

  try {
    // Try the RPC function first (now fixed to include title field)
    const { data: rpcData, error: rpcError } = await supabase.rpc('client_project_detail', {
      project_id_input: projectId,
      client_email: clientEmail
    });

    if (!rpcError && rpcData) {
      const parsed = rpcData as Record<string, any>;

      // Obtener links y minutas del proyecto
      const [linksResult, minutesResult] = await Promise.all([
        supabase.from('project_links').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('project_minutes').select('*').eq('project_id', projectId).order('meeting_date', { ascending: false })
      ]);

      // Transform stages to ensure components field exists
      const transformedStages = Array.isArray(parsed.stages) ? parsed.stages.map((stage: any) => ({
        ...stage,
        components: stage.components || []
      })) : [];

      return {
        ...parsed,
        stages: transformedStages,
        members: Array.isArray(parsed.members) ? parsed.members : [],
        files: Array.isArray(parsed.files) ? parsed.files : [],
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [],
        activity: Array.isArray(parsed.activity) ? parsed.activity : [],
        links: linksResult.data ?? [],
        minutes: minutesResult.data ?? [],
        progress: Number(parsed.progress ?? 0),
        client_name: parsed.client_name || clientEmail,
        overdue: false, // Placeholder
        waiting_on_client: false // Placeholder
      } as ProjectSummary;
    }

    // Crear cliente con service role para bypasear RLS
    const serviceSupabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar que el usuario tiene acceso al proyecto
    const { data: memberCheck } = await serviceSupabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('email', clientEmail.toLowerCase())
      .single();

    if (!memberCheck) {
      return null;
    }

    // Obtener datos del proyecto directamente
    const results = await Promise.all([
      serviceSupabase.from('projects').select('*').eq('id', projectId).single(),
      serviceSupabase.from('stages').select(`
        *,
        stage_components (id, stage_id, component_type, title, config, status, metadata, created_at)
      `).eq('project_id', projectId).order('order'),
      serviceSupabase.from('project_members').select('*').eq('project_id', projectId),
      serviceSupabase.from('comments').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      serviceSupabase.from('files').select('*').eq('project_id', projectId).order('uploaded_at', { ascending: false }),
      serviceSupabase.from('activity_log').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(50),
      serviceSupabase.from('project_links').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      serviceSupabase.from('project_minutes').select('*').eq('project_id', projectId).order('meeting_date', { ascending: false })
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
      progress: 0, // Placeholder
      client_name: (membersResult as any).data?.find((m: any) => m.email === clientEmail)?.email || clientEmail,
      overdue: false, // Placeholder
      waiting_on_client: false // Placeholder
    } as ProjectSummary;

  } catch (error) {
    console.error('Error in getClientProject:', error);
    return null;
  }
}
