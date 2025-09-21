'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { audit } from '@/lib/observability/audit';
import { getUser, clearAllAuthCache } from '@/lib/auth/session';

export async function logout() {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });

  // Usar nuestra función optimizada para obtener el usuario
  const user = await getUser();

  await supabase.auth.signOut();

  // Limpiar el cache después del logout
  clearAllAuthCache();

  await audit({
    action: 'auth.sign_out',
    actorType: user ? 'provider' : 'system',
    details: { user_id: user?.id }
  });

  redirect('/login');
}
