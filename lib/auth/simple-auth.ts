/**
 * Simple JWT-based authentication system
 * Replaces Supabase Auth with email-only login using cookies
 */

import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
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

// Edge Runtime compatible base64 functions using Web APIs
function utf8ToBase64(str: string): string {
  try {
    // Use TextEncoder which is standard Web API and works in Edge Runtime
    const bytes = new TextEncoder().encode(str);
    const binString = String.fromCharCode(...bytes);
    return btoa(binString);
  } catch (error) {
    console.error('utf8ToBase64 error:', error);
    // Fallback for development/node environments
    return typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(str)))
      : Buffer.from(str, 'utf-8').toString('base64');
  }
}

function base64ToUtf8(str: string): string {
  try {
    // Use atob first, then TextDecoder for proper UTF-8 handling
    const binString = atob(str);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (error) {
    console.error('base64ToUtf8 error with input:', str.substring(0, 20) + '...', error);

    // Fallback for development/node environments
    try {
      return typeof atob !== 'undefined'
        ? decodeURIComponent(escape(atob(str)))
        : Buffer.from(str, 'base64').toString('utf-8');
    } catch (fallbackError) {
      console.error('base64ToUtf8 fallback also failed:', fallbackError);
      const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(`Failed to decode base64 string: ${errorMessage}`);
    }
  }
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
      hasSignature: !!signature,
      headerLength: encodedHeader?.length,
      payloadLength: encodedPayload?.length,
      signatureLength: signature?.length
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

    console.log('🔓 Attempting to decode payload...');
    const decodedPayload = base64ToUtf8(encodedPayload);
    console.log('🔍 Raw payload string length:', decodedPayload.length);
    console.log('🔍 Raw payload preview:', decodedPayload.substring(0, 100) + (decodedPayload.length > 100 ? '...' : ''));

    // Clean up the payload string - remove any trailing characters after the last }
    const lastBraceIndex = decodedPayload.lastIndexOf('}');
    if (lastBraceIndex === -1) {
      console.log('❌ No closing brace found in payload');
      return null;
    }

    const cleanPayload = decodedPayload.substring(0, lastBraceIndex + 1);
    console.log('🧹 Cleaned payload:', cleanPayload);

    const payload: JWTPayload = JSON.parse(cleanPayload);
    console.log('📦 Decoded payload successfully:', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      exp: payload.exp
    });

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
    console.log('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n')[0] : undefined
    });
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
    const supabase = createSupabaseServerClient();

    const { data: user, error } = await (supabase as any)
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
    console.log('🌍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
    });

    const cookieStore = cookies();
    const supabase = createSupabaseServerClient();

    // Find user by email
    console.log('🔎 Querying simple_users table for email:', email.toLowerCase().trim());
    const { data: user, error } = await (supabase as any)
      .from('simple_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('active', true)
      .single();

    console.log('📊 Database query result:', {
      hasUser: !!user,
      userRole: user?.role,
      userEmail: user?.email,
      error: error?.message || 'none'
    });

    if (error || !user) {
      console.log('❌ User not found or error occurred');
      return {
        success: false,
        error: 'Usuario no encontrado o inactivo. Verifica tu email.'
      };
    }

    // Create JWT token
    console.log('🎫 Creating JWT token for user:', {
      userId: user.id,
      userRole: user.role,
      isProvider: user.role === 'provider'
    });

    const token = createSimpleToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'provider' | 'client'
    });

    console.log('🎫 JWT token created:', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...'
    });

    // Set HTTP-only cookie
    const cookieConfig = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    };

    console.log('🍪 Setting cookie with config:', cookieConfig);

    cookieStore.set('user_session', token, cookieConfig);

    // Determine redirect based on role
    const redirectTo = user.role === 'provider'
      ? '/dashboard'
      : `/c/${user.email.split('@')[0]}/projects`;

    console.log('🎯 Redirect determined:', {
      userRole: user.role,
      redirectTo,
      isProvider: user.role === 'provider'
    });

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