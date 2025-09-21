'use server';

import { createServiceRoleClient } from '@/lib/supabase/service-role-client';

interface WebVitalPayload {
  metric: string;
  value: number;
  label: string;
  navigationType?: string;
}

export async function reportWebVital(payload: WebVitalPayload) {
  try {
    const supabase = createServiceRoleClient();
    await (supabase as any).from('activity_log').insert({
      actor_type: 'system',
      action: 'web-vital',
      details: payload
    });
  } catch (error) {
    console.error('web vital', error);
  }
}
