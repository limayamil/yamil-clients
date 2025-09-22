import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Skip middleware for static files, API routes, and auth pages
  if (req.nextUrl.pathname.startsWith('/_next/') ||
      req.nextUrl.pathname.startsWith('/api/') ||
      req.nextUrl.pathname.startsWith('/login') ||
      req.nextUrl.pathname.includes('.')) {
    return res;
  }

  try {
    const supabase = createMiddlewareClient<Database>({ req, res });

    // Just refresh session, don't access user data to avoid context issues
    await supabase.auth.getSession();

  } catch (error) {
    // Silently handle errors
    console.warn('Middleware auth error:', error);
  }

  return res;
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