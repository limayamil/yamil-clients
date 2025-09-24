import { NextResponse } from 'next/server';
import { clearRateLimitCache } from '@/lib/security/rate-limit';
import { clearAllAuthCache } from '@/lib/auth/session';

// Only allow in development environment
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Only available in development' },
      { status: 403 }
    );
  }

  try {
    // Clear application rate limit cache
    clearRateLimitCache();

    // Clear authentication cache
    clearAllAuthCache();

    return NextResponse.json({
      success: true,
      message: 'Rate limit and auth caches cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing caches:', error);
    return NextResponse.json(
      { error: 'Failed to clear caches' },
      { status: 500 }
    );
  }
}

// Also allow GET for easier testing
export async function GET() {
  return POST();
}