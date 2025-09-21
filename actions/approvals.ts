'use server';

import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { respondApprovalSchema } from '@/lib/validators/approvals';
import { audit } from '@/lib/observability/audit';
import { revalidatePath } from 'next/cache';

export async function respondApproval(_: unknown, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });
  const payload = Object.fromEntries(formData.entries());
  const parsed = respondApprovalSchema.safeParse({
    approvalId: payload.approvalId,
    status: payload.status,
    feedback: payload.feedback
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { data, error } = await supabase
    .from('approvals')
    .update({ status: parsed.data.status, approved_at: parsed.data.status === 'approved' ? new Date().toISOString() : null })
    .eq('id', parsed.data.approvalId)
    .select('project_id')
    .single();

  if (error) return { error: { db: [error.message] } };

  await audit({
    projectId: data.project_id,
    actorType: 'client',
    action: 'approval.responded',
    details: { approval_id: parsed.data.approvalId, status: parsed.data.status }
  });

  if (data.project_id) {
    revalidatePath(`/projects/${data.project_id}`);
  }

  return { success: true };
}
