import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  const role = session.user.user_metadata?.role as 'provider' | 'client' | undefined;
  if (role === 'client') {
    redirect(`/c/${session.user.email}/projects`);
  }
  if (role === 'provider') {
    redirect('/dashboard');
  }
  redirect('/login');
}
