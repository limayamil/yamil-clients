import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Skip middleware for static files and API routes
  if (req.nextUrl.pathname.startsWith('/_next/') ||
      req.nextUrl.pathname.startsWith('/api/') ||
      req.nextUrl.pathname.includes('.')) {
    return res;
  }

  try {
    const supabase = createMiddlewareClient<Database>({ req, res });

    // Refresh session to maintain auth state
    const { data: { session }, error } = await supabase.auth.getSession();

    // If no session and trying to access protected routes, redirect to login
    if (!session && !error && isProtectedRoute(req.nextUrl.pathname)) {
      const redirectUrl = new URL('/login', req.url);
      // Add return URL for redirect after login
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If has session but accessing login page, redirect to appropriate dashboard
    if (session?.user && req.nextUrl.pathname === '/login') {
      const role = session.user.user_metadata?.role as 'provider' | 'client' | undefined;
      if (role === 'client' && session.user.email) {
        const username = session.user.email.split('@')[0];
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