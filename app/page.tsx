import { getCurrentUser } from '@/lib/auth/simple-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  const role = user.role as 'provider' | 'client' | undefined;
  if (role === 'client') {
    redirect(`/c/${user.email}/projects`);
  }
  if (role === 'provider') {
    redirect('/dashboard');
  }
  redirect('/login');
}
