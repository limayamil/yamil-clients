import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { withAuthRateLimit } from './rate-limit-handler';

// Cache para evitar múltiples llamadas en la misma request
let sessionCache: { session: Session | null; timestamp: number } | null = null;
const CACHE_DURATION = 5000; // 5 segundos de cache

export async function getSession(): Promise<Session | null> {
  // Verificar cache
  if (sessionCache && (Date.now() - sessionCache.timestamp) < CACHE_DURATION) {
    return sessionCache.session;
  }

  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

    // Use getUser() instead of getSession() for security
    // getUser() authenticates the data by contacting the Supabase Auth server
    const result = await withAuthRateLimit(
      async () => await supabase.auth.getUser(),
      { data: { user: null }, error: null } as any // fallback en caso de rate limit
    );

    const { data: { user }, error } = result;

    if (error) {
      console.warn('Auth user error:', error.message);
      sessionCache = { session: null, timestamp: Date.now() };
      return null;
    }

    if (!user) {
      sessionCache = { session: null, timestamp: Date.now() };
      return null;
    }

    // Get the session after validating the user
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      sessionCache = { session: null, timestamp: Date.now() };
      return null;
    }

    // Validar que el token no esté expirado
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      sessionCache = { session: null, timestamp: Date.now() };
      return null;
    }

    // Cachear el resultado
    sessionCache = { session, timestamp: Date.now() };
    return session;
  } catch (error) {
    console.error('Unexpected error in getSession:', error);
    sessionCache = { session: null, timestamp: Date.now() };
    return null;
  }
}

// Función para limpiar el cache (útil en tests o logout)
export function clearSessionCache() {
  sessionCache = null;
}
