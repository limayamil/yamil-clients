import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { withAuthRateLimit } from './rate-limit-handler';
import { isMockAuthEnabled, getMockUserFromCookies, createMockSession } from './mock-auth';

// Cache para evitar múltiples llamadas en la misma request
let sessionCache: { session: Session | null; timestamp: number } | null = null;
let userCache: { user: User | null; timestamp: number } | null = null;
const CACHE_DURATION = 60000; // 60 segundos de cache para mejor persistencia

export async function getUser(): Promise<User | null> {
  // Check for mock authentication first
  if (isMockAuthEnabled()) {
    const mockUser = getMockUserFromCookies();
    if (mockUser) {
      userCache = { user: mockUser, timestamp: Date.now() };
      return mockUser;
    }
  }

  // Verificar cache
  if (userCache && (Date.now() - userCache.timestamp) < CACHE_DURATION) {
    return userCache.user;
  }

  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

    // Use getUser() for security - authenticates by contacting Supabase Auth server
    const result = await withAuthRateLimit(
      async () => await supabase.auth.getUser(),
      { data: { user: null }, error: null } as any // fallback en caso de rate limit
    );

    const { data: { user }, error } = result;

    if (error) {
      userCache = { user: null, timestamp: Date.now() };
      return null;
    }

    if (!user) {
      userCache = { user: null, timestamp: Date.now() };
      return null;
    }

    // Cachear el resultado
    userCache = { user, timestamp: Date.now() };
    return user;
  } catch (error) {
    console.error('Unexpected error in getUser:', error);
    userCache = { user: null, timestamp: Date.now() };
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  // Check for mock authentication first
  if (isMockAuthEnabled()) {
    const mockUser = getMockUserFromCookies();
    if (mockUser) {
      const mockSession = createMockSession(mockUser);
      sessionCache = { session: mockSession, timestamp: Date.now() };
      return mockSession;
    }
  }

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
      sessionCache = { session: null, timestamp: Date.now() };
      return null;
    }

    if (!user) {
      sessionCache = { session: null, timestamp: Date.now() };
      return null;
    }

    // Create a session-like object from the user data
    // This avoids the security warning from calling supabase.auth.getSession()
    const sessionFromUser: Session = {
      access_token: '', // Not needed for server-side usage
      refresh_token: '', // Not needed for server-side usage
      expires_in: 0, // Not needed for server-side usage
      expires_at: 0, // Not needed for server-side usage
      token_type: 'bearer',
      user: user,
    };

    // Cachear el resultado
    sessionCache = { session: sessionFromUser, timestamp: Date.now() };
    return sessionFromUser;
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

export function clearUserCache() {
  userCache = null;
}

export function clearAllAuthCache() {
  sessionCache = null;
  userCache = null;
}
