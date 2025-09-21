'use server';

import { createServiceRoleClient } from '@/lib/supabase/service-role-client';
import type { StageStatus } from '@/types/project';

interface AnalyticsEvent {
  name: 'stage.completed' | 'materials.uploaded' | 'approval.submitted';
  projectId?: string;
  payload?: Record<string, unknown>;
}

export async function trackEvent(event: AnalyticsEvent) {
  try {
    const supabase = createServiceRoleClient();
    await (supabase as any).from('activity_log').insert({
      project_id: event.projectId ?? null,
      actor_type: 'system',
      action: event.name,
      details: event.payload ?? {}
    });
  } catch (error) {
    console.error('analytics', error);
  }
}

export async function recordStageStatusChange(projectId: string, stageId: string, status: StageStatus) {
  await trackEvent({
    name: 'stage.completed',
    projectId,
    payload: { stageId, status }
  });
}
