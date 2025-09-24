'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { audit } from '@/lib/observability/audit';
import { getCurrentUser, clearUserSession } from '@/lib/auth/simple-auth';

export async function logout() {
  // Get current user before clearing session
  const user = await getCurrentUser();

  // Clear the JWT session cookie
  clearUserSession();

  await audit({
    action: 'auth.simple_logout',
    actorType: user ? 'provider' : 'system',
    details: { user_id: user?.id, system: 'simple_auth' }
  });

  redirect('/login');
}
