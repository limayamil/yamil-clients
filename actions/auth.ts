'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import type { Database } from '@/types/database';
import { magicLinkSchema, passwordSignInSchema } from '@/lib/validators/auth';
import { audit } from '@/lib/observability/audit';
import { getUsernameFromEmail } from '@/lib/utils';
import { clearAllAuthCache } from '@/lib/auth/session';

export async function signInWithPassword(_: unknown, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
  const payload = Object.fromEntries(formData.entries());
  const parsed = passwordSignInSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors
    };
  }

  const { email, password } = parsed.data;

  console.log('Attempting login for:', email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Login error:', error);
    return { error: { auth: [error.message] } };
  }

  if (!data.user) {
    console.error('No user data returned from login');
    return { error: { auth: ['No se pudo obtener la información del usuario'] } };
  }

  console.log('Login successful for user:', data.user.id);

  // Limpiar cache de autenticación para evitar problemas de sesión
  clearAllAuthCache();

  await audit({
    action: 'auth.sign_in',
    actorType: 'system',
    details: { email }
  });

  // El user viene en la respuesta del signInWithPassword
  const user = data.user;
  const role = user?.user_metadata?.role as 'provider' | 'client' | undefined;

  console.log('User role:', role);

  // Si no hay rol definido, manejar el error
  if (!role) {
    return {
      error: {
        auth: ['Tu cuenta no tiene un rol asignado. Contacta al administrador.']
      }
    };
  }

  // Pequeña pausa para asegurar que las cookies se configuren
  await new Promise(resolve => setTimeout(resolve, 100));

  if (role === 'client' && user?.email) {
    const username = getUsernameFromEmail(user.email);
    console.log('Redirecting client to:', `/c/${username}/projects`);
    redirect(`/c/${username}/projects`);
  }

  console.log('Redirecting provider to dashboard');
  redirect('/dashboard');
}

export async function sendMagicLink(_: unknown, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
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
