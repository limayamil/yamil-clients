import { getUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  const role = user.user_metadata?.role as 'provider' | 'client' | undefined;
  if (role === 'client') {
    redirect(`/c/${user.email}/projects`);
  }
  if (role === 'provider') {
    redirect('/dashboard');
  }
  redirect('/login');
}
