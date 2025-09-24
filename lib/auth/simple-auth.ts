/**
 * Simple JWT-based authentication system
 * Replaces Supabase Auth with email-only login using cookies
 */

import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

// JWT Secret - in production this should be in environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Simple user type for our auth system
export interface SimpleUser {
  id: string;
  email: string;
  role: 'provider' | 'client';
  name?: string;
  active: boolean;
}

// JWT payload type
interface JWTPayload {
  userId: string;
  email: string;
  role: 'provider' | 'client';
  iat: number;
  exp: number;
}

// Edge-compatible base64 functions
function utf8ToBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

// Simple JWT functions using Edge-compatible encoding
function createSimpleToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (30 * 24 * 60 * 60) // 30 days
  };

  const header = { alg: 'simple', typ: 'JWT' };
  const encodedHeader = utf8ToBase64(JSON.stringify(header));
  const encodedPayload = utf8ToBase64(JSON.stringify(fullPayload));
  const signature = utf8ToBase64(JWT_SECRET + encodedHeader + encodedPayload).substring(0, 32);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifySimpleToken(token: string): JWTPayload | null {
  try {
    console.log('🔍 verifySimpleToken: Starting verification');
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    console.log('🔍 Token parts:', {
      hasHeader: !!encodedHeader,
      hasPayload: !!encodedPayload,
      hasSignature: !!signature
    });

    if (!encodedHeader || !encodedPayload || !signature) {
      console.log('❌ Missing token parts');
      return null;
    }

    // Verify signature
    const expectedSignature = utf8ToBase64(JWT_SECRET + encodedHeader + encodedPayload).substring(0, 32);
    console.log('🔑 Signature check:', {
      provided: signature,
      expected: expectedSignature,
      match: signature === expectedSignature
    });

    if (signature !== expectedSignature) {
      console.log('❌ Signature mismatch');
      return null;
    }

    const decodedPayload = base64ToUtf8(encodedPayload);
    console.log('🔍 Raw payload string:', decodedPayload);

    // Clean up the payload string - remove any trailing characters after the last }
    const cleanPayload = decodedPayload.substring(0, decodedPayload.lastIndexOf('}') + 1);
    console.log('🧹 Cleaned payload string:', cleanPayload);

    const payload: JWTPayload = JSON.parse(cleanPayload);
    console.log('📦 Decoded payload:', payload);

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.log('❌ Token expired:', { now, exp: payload.exp });
      return null;
    }

    console.log('✅ Token verification successful');
    return payload;
  } catch (error) {
    console.log('❌ verifySimpleToken error:', error);
    return null;
  }
}

/**
 * Get user from JWT token in cookies
 */
export async function getCurrentUser(): Promise<SimpleUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('user_session')?.value;

    if (!token) {
      return null;
    }

    // Verify and decode JWT
    const decoded = verifySimpleToken(token);
    if (!decoded) return null;

    // Get fresh user data from database
    const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });

    const { data: user, error } = await supabase
      .from('simple_users')
      .select('*')
      .eq('id', decoded.userId)
      .eq('active', true)
      .single();

    if (error || !user) {
      // Invalid token or user deactivated, clear cookie
      clearUserSession();
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as 'provider' | 'client',
      name: user.name || undefined,
      active: user.active
    };

  } catch (error) {
    // Invalid token, clear cookie
    clearUserSession();
    return null;
  }
}

/**
 * Sign in user by email - creates JWT session
 */
export async function signInByEmail(email: string): Promise<{ success: boolean; redirectTo?: string; error?: string }> {
  try {
    console.log('🔍 signInByEmail: Starting for email:', email);
    const cookieStore = cookies();
    const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });

    // Find user by email
    console.log('🔎 Querying simple_users table for email:', email.toLowerCase().trim());
    const { data: user, error } = await supabase
      .from('simple_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('active', true)
      .single();

    console.log('📊 Database query result:', { user, error });

    if (error || !user) {
      console.log('❌ User not found or error occurred');
      return {
        success: false,
        error: 'Usuario no encontrado o inactivo. Verifica tu email.'
      };
    }

    // Create JWT token
    const token = createSimpleToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'provider' | 'client'
    });

    // Set HTTP-only cookie
    cookieStore.set('user_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    // Determine redirect based on role
    const redirectTo = user.role === 'provider'
      ? '/dashboard'
      : `/c/${user.email.split('@')[0]}/projects`;

    return {
      success: true,
      redirectTo
    };

  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: 'Error de servidor. Intenta de nuevo.'
    };
  }
}

/**
 * Sign out - clear session cookie
 */
export function signOut(): void {
  clearUserSession();
}

/**
 * Clear user session cookie
 */
export function clearUserSession(): void {
  const cookieStore = cookies();
  cookieStore.delete('user_session');
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: 'provider' | 'client'): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Get username from email (for client URLs)
 */
export function getUsernameFromEmail(email: string): string {
  return email.split('@')[0];
}

/**
 * Middleware helper - get user from request cookies
 */
export function getUserFromCookies(cookieHeader: string | null): SimpleUser | null {
  console.log('🔧 getUserFromCookies called with:', cookieHeader ? 'COOKIES_PRESENT' : 'NO_COOKIES');

  if (!cookieHeader) {
    console.log('❌ No cookie header provided');
    return null;
  }

  try {
    // Parse cookie header to find user_session
    const cookies = cookieHeader
      .split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith('user_session='));

    console.log('🔍 Found user_session cookie:', cookies ? 'YES' : 'NO');

    if (!cookies) {
      console.log('❌ No user_session cookie found in:', cookieHeader);
      return null;
    }

    const token = cookies.split('=')[1];
    console.log('🔑 Attempting to verify JWT token:', token ? `${token.substring(0, 20)}...` : 'NO_TOKEN');

    const decoded = verifySimpleToken(token);
    if (!decoded) {
      console.log('❌ JWT verification failed');
      return null;
    }

    console.log('✅ JWT decoded successfully:', { userId: decoded.userId, email: decoded.email, role: decoded.role });

    const user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: undefined, // We don't store name in JWT
      active: true
    };

    console.log('👤 Returning user:', user);
    return user;

  } catch (error) {
    console.log('❌ JWT verification failed:', error);
    return null;
  }
}