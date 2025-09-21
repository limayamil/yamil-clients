// Supabase Edge Function stub for sending deadline reminders
// Configure via supabase.toml with a scheduled cron trigger (e.g., daily)

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../types/database.ts';

declare const Deno: any;

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRole) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient<Database>(supabaseUrl, serviceRole);

export async function handler(_req: Request): Promise<Response> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, deadline, client:clients(email, name)')
    .not('deadline', 'is', null)
    .lte('deadline', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    .gte('deadline', new Date().toISOString().slice(0, 10));

  if (error) {
    console.error('deadline reminder', error);
    return new Response('error', { status: 500 });
  }

  for (const project of (data ?? []) as any[]) {
    await (supabase as any).from('notifications').insert({
      user_email: project.client?.email ?? '',
      project_id: project.id,
      type: 'deadline',
      payload: { title: project.title, deadline: project.deadline }
    });
  }

  return new Response(JSON.stringify({ processed: data?.length ?? 0 }), { status: 200 });
}

Deno.serve(handler);
