import { redirect } from 'next/navigation';
import { getUser } from './session';
import type { User } from '@supabase/supabase-js';
import { getUsernameFromEmail } from '@/lib/utils';

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(roles: Array<'provider' | 'client'>): Promise<User> {
  const user = await requireUser();
  const role = user.user_metadata?.role as 'provider' | 'client' | undefined;

  if (!role) {
    redirect('/login');
  }

  if (!roles.includes(role)) {
    if (role === 'client' && user.email) {
      const username = getUsernameFromEmail(user.email);
      redirect(`/c/${username}/projects`);
    } else {
      redirect('/dashboard');
    }
  }
  return user;
}

// Legacy function for backward compatibility - will be deprecated
export async function requireSession() {
  const user = await requireUser();
  // Return a session-like object for backward compatibility
  return { user };
}
