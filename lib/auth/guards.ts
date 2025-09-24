import { redirect } from 'next/navigation';
import { getCurrentUser, getUsernameFromEmail, type SimpleUser } from './simple-auth';

export async function requireUser(): Promise<SimpleUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(roles: Array<'provider' | 'client'>): Promise<SimpleUser> {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    if (user.role === 'client') {
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
  return {
    user: {
      ...user,
      user_metadata: { role: user.role }
    }
  };
}
