import { redirect } from 'next/navigation';
import { getSession } from './session';

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

export async function requireRole(roles: Array<'provider' | 'client'>) {
  const session = await requireSession();
  const role = session.user.user_metadata?.role as 'provider' | 'client' | undefined;

  if (!role) {
    redirect('/login');
  }

  if (!roles.includes(role)) {
    redirect(role === 'client' ? `/c/${session.user.email}/projects` : '/dashboard');
  }
  return session;
}
