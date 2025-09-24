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

// Pure JavaScript base64 implementation that works in all environments
const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const base64Lookup = new Array(256);
for (let i = 0; i < base64Chars.length; i++) {
  base64Lookup[base64Chars.charCodeAt(i)] = i;
}

function utf8ToBase64(str: string): string {
  try {
    // Use TextEncoder which is standard Web API and works in Edge Runtime
    const bytes = new TextEncoder().encode(str);
    const binString = String.fromCharCode(...bytes);
    return btoa(binString);
  } catch (error) {
    console.error('utf8ToBase64 error:', error);
    // Pure JS implementation
    return customBase64Encode(str);
  }
}

function customBase64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    const bitmap = (byte1 << 16) | (byte2 << 8) | byte3;

    result += base64Chars[(bitmap >> 18) & 63];
    result += base64Chars[(bitmap >> 12) & 63];
    result += i + 1 < bytes.length ? base64Chars[(bitmap >> 6) & 63] : '=';
    result += i + 2 < bytes.length ? base64Chars[bitmap & 63] : '=';
  }

  return result;
}

function base64ToUtf8(str: string): string {
  try {
    console.log('🔓 Using pure JS base64 decode for:', str.substring(0, 20) + '...');

    // Remove padding
    const cleanStr = str.replace(/[^A-Za-z0-9+/]/g, '');
    const bytes = new Uint8Array((cleanStr.length * 3) / 4);
    let byteIndex = 0;

    for (let i = 0; i < cleanStr.length; i += 4) {
      const char1 = base64Lookup[cleanStr.charCodeAt(i)] || 0;
      const char2 = base64Lookup[cleanStr.charCodeAt(i + 1)] || 0;
      const char3 = base64Lookup[cleanStr.charCodeAt(i + 2)] || 0;
      const char4 = base64Lookup[cleanStr.charCodeAt(i + 3)] || 0;

      const bitmap = (char1 << 18) | (char2 << 12) | (char3 << 6) | char4;

      if (i + 1 < cleanStr.length) bytes[byteIndex++] = (bitmap >> 16) & 255;
      if (i + 2 < cleanStr.length) bytes[byteIndex++] = (bitmap >> 8) & 255;
      if (i + 3 < cleanStr.length) bytes[byteIndex++] = bitmap & 255;
    }

    // Trim the array to actual length
    const trimmedBytes = bytes.slice(0, byteIndex);
    const result = new TextDecoder().decode(trimmedBytes);

    console.log('🔓 Pure JS decode successful, length:', result.length);
    return result;

  } catch (error) {
    console.error('❌ Pure JS base64 decode failed:', error);

    // Final fallback using Node.js Buffer (development only)
    if (typeof Buffer !== 'undefined') {
      try {
        const result = Buffer.from(str, 'base64').toString('utf-8');
        console.log('🔄 Node.js Buffer fallback successful');
        return result;
      } catch (bufferError) {
        console.error('❌ Buffer fallback failed:', bufferError);
      }
    }

    throw new Error(`All base64 decode methods failed: ${error instanceof Error ? error.message : String(error)}`);
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