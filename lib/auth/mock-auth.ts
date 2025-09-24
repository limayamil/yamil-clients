/**
 * Mock authentication utilities for development environment
 * This bypasses Supabase authentication to avoid rate limiting during development
 */

import { cookies } from 'next/headers';
import type { User, Session } from '@supabase/supabase-js';

// Mock users for development testing
export const mockUsers = {
  provider: {
    id: 'dev-provider-uuid',
    email: 'provider@dev.com',
    user_metadata: {
      role: 'provider'
    },
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    email_confirmed_at: '2024-01-01T00:00:00.000Z',
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    identities: [],
    factors: [],
    phone: undefined,
    phone_confirmed_at: undefined,
    confirmation_sent_at: undefined,
    confirmed_at: '2024-01-01T00:00:00.000Z',
    email_change_sent_at: undefined,
    new_email: undefined,
    invited_at: undefined,
    action_link: undefined,
    email_change: undefined,
    email_change_confirm_status: 0,
    banned_until: undefined,
    new_phone: undefined,
    phone_change: undefined,
    phone_change_token: undefined,
    phone_change_sent_at: undefined,
    recovery_sent_at: undefined,
    new_email_change_sent_at: undefined,
    email_change_token_current: undefined,
    email_change_token_new: undefined,
    generatedPassword: undefined,
    is_sso_user: false,
    deleted_at: undefined,
    is_super_admin: null
  } as User,
  client: {
    id: 'dev-client-uuid',
    email: 'cliente@dev.com',
    user_metadata: {
      role: 'client'
    },
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    email_confirmed_at: '2024-01-01T00:00:00.000Z',
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    identities: [],
    factors: [],
    phone: undefined,
    phone_confirmed_at: undefined,
    confirmation_sent_at: undefined,
    confirmed_at: '2024-01-01T00:00:00.000Z',
    email_change_sent_at: undefined,
    new_email: undefined,
    invited_at: undefined,
    action_link: undefined,
    email_change: undefined,
    email_change_confirm_status: 0,
    banned_until: undefined,
    new_phone: undefined,
    phone_change: undefined,
    phone_change_token: undefined,
    phone_change_sent_at: undefined,
    recovery_sent_at: undefined,
    new_email_change_sent_at: undefined,
    email_change_token_current: undefined,
    email_change_token_new: undefined,
    generatedPassword: undefined,
    is_sso_user: false,
    deleted_at: undefined,
    is_super_admin: null
  } as User
};

/**
 * Check if mock authentication is enabled
 */
export function isMockAuthEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.MOCK_AUTH === 'true';
}

/**
 * Get mock user based on email
 */
export function getMockUser(email: string): User | null {
  if (!isMockAuthEnabled()) return null;

  // Allow any email with @dev.com domain or specific test emails
  if (email.endsWith('@dev.com')) {
    return email.startsWith('provider') ? mockUsers.provider : mockUsers.client;
  }

  // Map common test emails to roles
  if (email === 'provider@test.com' || email === 'admin@test.com') {
    return { ...mockUsers.provider, email };
  }

  if (email === 'client@test.com' || email === 'cliente@test.com') {
    return { ...mockUsers.client, email };
  }

  return null;
}

/**
 * Create a mock session for development
 */
export function createMockSession(user: User): Session {
  return {
    access_token: 'dev-mock-access-token',
    refresh_token: 'dev-mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user
  };
}

/**
 * Set mock authentication cookies
 */
export function setMockAuthCookies(user: User) {
  if (!isMockAuthEnabled()) return;

  const cookieStore = cookies();
  const session = createMockSession(user);

  // Set session cookies that mimic Supabase auth structure
  cookieStore.set('sb-access-token', session.access_token, {
    httpOnly: true,
    secure: false, // false for development
    sameSite: 'lax',
    maxAge: 3600,
    path: '/'
  });

  cookieStore.set('sb-refresh-token', session.refresh_token, {
    httpOnly: true,
    secure: false, // false for development
    sameSite: 'lax',
    maxAge: 3600 * 24 * 7, // 7 days
    path: '/'
  });

  // Set user data cookie
  cookieStore.set('sb-user', JSON.stringify(user), {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 3600,
    path: '/'
  });
}

/**
 * Get mock user from cookies
 */
export function getMockUserFromCookies(): User | null {
  if (!isMockAuthEnabled()) return null;

  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('sb-user');

    if (userCookie?.value) {
      return JSON.parse(userCookie.value) as User;
    }
  } catch (error) {
    console.warn('Failed to parse mock user cookie:', error);
  }

  return null;
}

/**
 * Clear mock authentication cookies
 */
export function clearMockAuthCookies() {
  if (!isMockAuthEnabled()) return;

  const cookieStore = cookies();
  cookieStore.delete('sb-access-token');
  cookieStore.delete('sb-refresh-token');
  cookieStore.delete('sb-user');
}