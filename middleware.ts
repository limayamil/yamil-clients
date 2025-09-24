import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import type { User } from '@supabase/supabase-js';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Skip middleware for static files and API routes
  if (req.nextUrl.pathname.startsWith('/_next/') ||
      req.nextUrl.pathname.startsWith('/api/') ||
      req.nextUrl.pathname.includes('.')) {
    return res;
  }

  try {
    let user: User | null = null;

    // Check if mock authentication is enabled in development
    const isMockAuthEnabled = process.env.NODE_ENV === 'development' && process.env.MOCK_AUTH === 'true';

    if (isMockAuthEnabled) {
      // Get mock user from cookies
      const userCookie = req.cookies.get('sb-user');
      if (userCookie?.value) {
        try {
          user = JSON.parse(userCookie.value) as User;
        } catch (error) {
          console.warn('Failed to parse mock user cookie in middleware:', error);
        }
      }
    } else {
      // Use regular Supabase auth
      const supabase = createMiddlewareClient<Database>({ req, res });
      const { data: { session }, error } = await supabase.auth.getSession();
      user = session?.user || null;
    }

    // If no user and trying to access protected routes, redirect to login
    if (!user && isProtectedRoute(req.nextUrl.pathname)) {
      const redirectUrl = new URL('/login', req.url);
      // Add return URL for redirect after login
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If has user but accessing login page, redirect to appropriate dashboard
    // EXCEPT when in mock auth mode - let client-side navigation handle it
    if (user && req.nextUrl.pathname === '/login' && !isMockAuthEnabled) {
      const role = user.user_metadata?.role as 'provider' | 'client' | undefined;
      if (role === 'client' && user.email) {
        const username = user.email.split('@')[0];
        return NextResponse.redirect(new URL(`/c/${username}/projects`, req.url));
      } else if (role === 'provider') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

  } catch (error) {
    // Silently handle errors, but log for debugging
    console.warn('Middleware auth error:', error);
  }

  return res;
}

function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = ['/dashboard', '/projects', '/settings'];
  const clientPaths = ['/c/'];

  return protectedPaths.some(path => pathname.startsWith(path)) ||
         clientPaths.some(path => pathname.startsWith(path));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login page temporarily while debugging
     */
    '/((?!_next/static|_next/image|favicon.ico|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};