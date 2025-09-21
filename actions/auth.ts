'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import type { Database } from '@/types/database';
import { magicLinkSchema, passwordSignInSchema } from '@/lib/validators/auth';
import { audit } from '@/lib/observability/audit';

export async function signInWithPassword(_: unknown, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });
  const payload = Object.fromEntries(formData.entries());
  const parsed = passwordSignInSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors
    };
  }

  const { email, password } = parsed.data;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: { auth: [error.message] } };
  }

  await audit({
    action: 'auth.sign_in',
    actorType: 'system',
    details: { email }
  });

  // El user viene en la respuesta del signInWithPassword, no necesitamos hacer otra llamada
  const user = data.user;
  const role = user?.user_metadata?.role as 'provider' | 'client' | undefined;

  if (role === 'client') {
    redirect(`/c/${user?.email}/projects`);
  }

  redirect('/dashboard');
}

export async function sendMagicLink(_: unknown, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });
  const payload = Object.fromEntries(formData.entries());
  const parsed = magicLinkSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors
    };
  }

  const { email } = parsed.data;
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    return { error: { auth: [error.message] } };
  }

  await audit({
    action: 'auth.magic_link',
    actorType: 'system',
    details: { email }
  });

  return { success: true };
}
