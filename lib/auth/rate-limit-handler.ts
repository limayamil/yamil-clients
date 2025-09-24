import { AuthError } from '@supabase/supabase-js';

/**
 * Verifica si un error es de rate limiting de autenticación
 */
export function isAuthRateLimitError(error: any): boolean {
  return (
    error &&
    error.status === 429 &&
    (error.code === 'over_request_rate_limit' ||
     error.message?.includes('rate limit') ||
     error.message?.includes('too many requests'))
  );
}

/**
 * Maneja errores de rate limiting con estrategia de retry exponential backoff
 */
export async function handleAuthRateLimit<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 2000
): Promise<T> {
  // In development, use more lenient settings
  if (process.env.NODE_ENV === 'development') {
    maxRetries = Math.min(maxRetries, 1); // Reduce retries in dev
    baseDelay = Math.max(baseDelay * 0.5, 500); // Reduce delay in dev
  }
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isAuthRateLimitError(error)) {
        // Si no es error de rate limit, lanzar inmediatamente
        throw error;
      }

      if (attempt === maxRetries) {
        // Último intento fallido
        console.error(`Auth rate limit: Failed after ${maxRetries + 1} attempts`);
        break;
      }

      // Exponential backoff con jitter más conservador
      const delay = baseDelay * Math.pow(1.5, attempt) + Math.random() * 500;
      console.warn(`Auth rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  throw lastError;
}

/**
 * Wrapper para operaciones de auth que pueden sufrir rate limiting
 */
export async function withAuthRateLimit<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await handleAuthRateLimit(operation);
  } catch (error) {
    if (isAuthRateLimitError(error) && fallback !== undefined) {
      console.warn('Auth rate limit exceeded, using fallback value');
      return fallback;
    }
    throw error;
  }
}