'use server';

import { cookies, headers } from 'next/headers';
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    // Manejo específico para rate limiting
    if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('too many')) {
      return {
        error: {
          auth: ['Has alcanzado el límite de intentos de login. Espera 2 minutos antes de volver a intentar.']
        }
      };
    }

    // Otros errores de autenticación
    let errorMessage = error.message;
    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = 'Por favor confirma tu email antes de iniciar sesión.';
    }

    return { error: { auth: [errorMessage] } };
  }

  if (!data.user) {
    return { error: { auth: ['No se pudo obtener la información del usuario'] } };
  }

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

  // Verificar si hay una URL de redirección
  const headersList = headers();
  const referer = headersList.get('referer');
  const redirectTo = referer ? new URL(referer).searchParams.get('redirectTo') : null;

  if (role === 'client' && user?.email) {
    const username = getUsernameFromEmail(user.email);
    const clientBasePath = `/c/${username}`;

    // Si hay redirectTo y es válido para el cliente, redirigir ahí
    if (redirectTo && redirectTo.startsWith(clientBasePath)) {
      redirect(redirectTo);
    } else {
      redirect(`${clientBasePath}/projects`);
    }
  }

  // Para providers, verificar redirectTo válido
  if (redirectTo && (redirectTo.startsWith('/dashboard') || redirectTo.startsWith('/projects'))) {
    redirect(redirectTo);
  }

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
