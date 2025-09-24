'use server';

import { redirect } from 'next/navigation'; // Only used in signOutDev function
import { z } from 'zod';
import { passwordSignInSchema } from '@/lib/validators/auth';
import { audit } from '@/lib/observability/audit';
import { getUsernameFromEmail } from '@/lib/utils';
import { clearAllAuthCache } from '@/lib/auth/session';
import {
  isMockAuthEnabled,
  getMockUser,
  setMockAuthCookies,
  clearMockAuthCookies
} from '@/lib/auth/mock-auth';

interface FormState {
  error?: Record<string, string[]>;
}

/**
 * Development-only authentication bypass
 * This completely skips Supabase Auth to avoid rate limiting during development
 */
export async function signInWithPasswordDev(_: unknown, formData: FormData): Promise<FormState & { success?: boolean; redirectTo?: string } | never> {
  // Only allow in development with mock auth enabled
  if (!isMockAuthEnabled()) {
    return {
      error: {
        auth: ['Mock authentication not enabled. Set MOCK_AUTH=true in development.']
      }
    };
  }

  const payload = Object.fromEntries(formData.entries());
  const parsed = passwordSignInSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors
    };
  }

  const { email, password } = parsed.data;

  // Get mock user based on email
  const mockUser = getMockUser(email);

  if (!mockUser) {
    return {
      error: {
        auth: ['Usuario de desarrollo no encontrado. Usa emails como: provider@dev.com, client@dev.com, provider@test.com, client@test.com']
      }
    };
  }

  // In development, accept any password for simplicity
  // You could add specific password validation here if needed
  if (password.length < 1) {
    return {
      error: {
        auth: ['Ingresa cualquier contraseña para el modo de desarrollo.']
      }
    };
  }

  try {
    // Clear any existing auth cache
    clearAllAuthCache();
    clearMockAuthCookies();

    // Set mock authentication cookies
    setMockAuthCookies(mockUser);

    // Audit the development login
    await audit({
      action: 'auth.dev_sign_in',
      actorType: 'system',
      details: { email, mode: 'mock_auth' }
    });

    console.log('🔧 Development login successful:', {
      email,
      role: mockUser.user_metadata?.role,
      userId: mockUser.id
    });

    // Small pause to ensure cookies are set
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return success with redirect info instead of using redirect()
    const role = mockUser.user_metadata?.role as 'provider' | 'client' | undefined;

    if (role === 'client') {
      const username = getUsernameFromEmail(email);
      return {
        success: true,
        redirectTo: `/c/${username}/projects`
      };
    } else if (role === 'provider') {
      return {
        success: true,
        redirectTo: '/dashboard'
      };
    } else {
      return {
        error: {
          auth: ['Usuario de desarrollo sin rol válido.']
        }
      };
    }

  } catch (error) {
    console.error('Development auth error:', error);
    return {
      error: {
        auth: ['Error en autenticación de desarrollo: ' + (error as Error).message]
      }
    };
  }
}

/**
 * Development logout - clears mock auth cookies
 */
export async function signOutDev(): Promise<void> {
  if (!isMockAuthEnabled()) return;

  clearMockAuthCookies();
  clearAllAuthCache();

  console.log('🔧 Development logout successful');
  redirect('/login');
}