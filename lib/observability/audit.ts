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

    // Ensure actorType is properly typed as actor_type enum
    const validActorType: 'provider' | 'client' | 'system' = actorType;

    await supabase.from('activity_log').insert({
      project_id: projectId,
      actor_type: validActorType,
      action,
      details
    } as any);
  } catch (error) {
    console.error('Failed to write audit log', error);
  }
}
