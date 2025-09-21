import { createServiceRoleClient } from '@/lib/supabase/service-role-client';

interface AuditParams {
  projectId?: string | null;
  actorType: 'provider' | 'client' | 'system';
  action: string;
  details?: Record<string, unknown>;
}

export async function audit({ projectId, actorType, action, details }: AuditParams) {
  try {
    const supabase = createServiceRoleClient();
    await (supabase as any).from('activity_log').insert({
      project_id: projectId,
      actor_type: actorType,
      action,
      details
    });
  } catch (error) {
    console.error('Failed to write audit log', error);
  }
}
