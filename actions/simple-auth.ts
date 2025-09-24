'use server';

import { signInByEmail, signOut as performSignOut } from '@/lib/auth/simple-auth';
import { redirect } from 'next/navigation';
import { audit } from '@/lib/observability/audit';

/**
 * Simple login action - only requires email
 */
export async function loginWithEmail(email: string) {
  try {
    console.log('🚀 Server Action: loginWithEmail called with:', email);
    const result = await signInByEmail(email);
    console.log('🔐 signInByEmail result:', result);

    if (result.success) {
      // Audit the login
      await audit({
        action: 'auth.simple_login',
        actorType: 'system',
        details: { email, system: 'simple_auth' }
      });
      console.log('✅ Login successful, audit logged');
    }

    return result;
  } catch (error) {
    console.error('❌ Login action error:', error);
    return {
      success: false,
      error: 'Error interno del servidor'
    };
  }
}

/**
 * Sign out and redirect to login
 */
export async function signOutAction() {
  try {
    performSignOut();

    // Audit the logout
    await audit({
      action: 'auth.simple_logout',
      actorType: 'system',
      details: { system: 'simple_auth' }
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  redirect('/login');
}