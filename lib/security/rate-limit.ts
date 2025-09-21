import { cookies } from 'next/headers';

const WINDOW = 60 * 1000; // 1 minute window
const LIMIT = 20;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up every 5 minutes
const MAX_KEYS = 10000; // Maximum number of keys to prevent memory exhaustion

const requests = new Map<string, number[]>();
let lastCleanup = Date.now();

/**
 * Cleans up old entries from the rate limit cache to prevent memory leaks
 */
function cleanupOldEntries() {
  const now = Date.now();

  // Only cleanup if enough time has passed
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  const cutoff = now - WINDOW;
  const keysToDelete: string[] = [];

  for (const [key, timestamps] of requests.entries()) {
    // Filter out old timestamps
    const activeTimestamps = timestamps.filter(timestamp => timestamp > cutoff);

    if (activeTimestamps.length === 0) {
      // No active requests, mark for deletion
      keysToDelete.push(key);
    } else {
      // Update with filtered timestamps
      requests.set(key, activeTimestamps);
    }
  }

  // Delete inactive keys
  for (const key of keysToDelete) {
    requests.delete(key);
  }

  // If we still have too many keys, remove the oldest ones
  if (requests.size > MAX_KEYS) {
    const sortedEntries = Array.from(requests.entries()).sort((a, b) => {
      const latestA = Math.max(...a[1]);
      const latestB = Math.max(...b[1]);
      return latestA - latestB;
    });

    const toRemove = requests.size - MAX_KEYS;
    for (let i = 0; i < toRemove; i++) {
      requests.delete(sortedEntries[i][0]);
    }
  }

  lastCleanup = now;
}

export function assertRateLimit(key: string, limit = LIMIT) {
  // Clean up old entries periodically
  cleanupOldEntries();

  const now = Date.now();
  const bucket = requests.get(key) ?? [];
  const filtered = bucket.filter((timestamp) => now - timestamp < WINDOW);

  if (filtered.length >= limit) {
    throw new Error('Too many requests - please try again later');
  }

  filtered.push(now);
  requests.set(key, filtered);
}

export function rateLimitCurrentUser(limit = LIMIT) {
  const cookieStore = cookies();

  // Use a more stable session identifier - fallback to anonymous with timestamp for uniqueness
  const sessionToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  // Create a more reliable key that doesn't depend on specific cookie names
  const sessionId = sessionToken ?
    `session:${sessionToken.slice(-12)}` : // Use last 12 chars for uniqueness without storing full token
    `anon:${cookieStore.get('sb-auth-token')?.value?.slice(-8) ?? 'unknown'}`;

  assertRateLimit(sessionId, limit);
}

/**
 * Manually trigger cleanup (useful for testing or explicit cleanup)
 */
export function clearRateLimitCache() {
  requests.clear();
  lastCleanup = Date.now();
}
