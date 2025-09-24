import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromCookies, type SimpleUser } from '@/lib/auth/simple-auth';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Skip middleware for static files and API routes
  if (req.nextUrl.pathname.startsWith('/_next/') ||
      req.nextUrl.pathname.startsWith('/api/') ||
      req.nextUrl.pathname.includes('.')) {
    return res;
  }

  try {
    // Get user from JWT cookie
    const cookieHeader = req.headers.get('cookie');
    console.log('🔍 Middleware checking path:', req.nextUrl.pathname);
    console.log('🍪 Raw cookie header:', cookieHeader ? cookieHeader.substring(0, 100) + '...' : 'NO COOKIES');

    const user: SimpleUser | null = getUserFromCookies(cookieHeader);
    console.log('👤 Middleware parsed user:', user ? `${user.email} (${user.role})` : 'NO USER');

    // If no user and trying to access protected routes, redirect to login
    if (!user && isProtectedRoute(req.nextUrl.pathname)) {
      console.log('🚫 No user for protected route, redirecting to login');
      const redirectUrl = new URL('/login', req.url);
      // Add return URL for redirect after login
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If has user but accessing login page, redirect to appropriate dashboard
    if (user && req.nextUrl.pathname === '/login') {
      console.log('✅ User found, redirecting from login page:', {
        userEmail: user.email,
        userRole: user.role,
        isProvider: user.role === 'provider',
        isClient: user.role === 'client'
      });

      if (user.role === 'client') {
        const username = user.email.split('@')[0];
        const clientUrl = `/c/${username}/projects`;
        console.log('🎯 Client redirect to:', clientUrl);
        return NextResponse.redirect(new URL(clientUrl, req.url));
      } else if (user.role === 'provider') {
        console.log('🎯 Provider redirect to: /dashboard');
        const dashboardUrl = new URL('/dashboard', req.url);
        console.log('🔗 Full redirect URL:', dashboardUrl.toString());
        return NextResponse.redirect(dashboardUrl);
      } else {
        console.log('⚠️ Unknown user role:', user.role);
      }
    }

    // Log when accessing protected routes
    if (user && (req.nextUrl.pathname === '/dashboard' || req.nextUrl.pathname.startsWith('/c/'))) {
      console.log('🔐 Accessing protected route:', {
        path: req.nextUrl.pathname,
        userRole: user.role,
        userEmail: user.email
      });
    }

  } catch (error) {
    // Silently handle errors, but log for debugging
    console.warn('❌ Simple middleware auth error:', error);
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