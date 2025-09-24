'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PasswordSignInInput, passwordSignInSchema } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { signInWithPassword, sendMagicLink } from '@/actions/auth';
import { signInWithPasswordDev } from '@/actions/auth-dev';
import { useI18n } from '@/lib/i18n/provider';
import { toast } from 'sonner';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { RefreshCw, Zap } from 'lucide-react';

interface FormState {
  error?: Record<string, string[]>;
  success?: boolean;
  redirectTo?: string;
}

const initialState: FormState | undefined = undefined;

export function LoginForm() {
  const { t } = useI18n('auth');
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PasswordSignInInput>({ resolver: zodResolver(passwordSignInSchema) });

  const [state, formAction] = useFormState<FormState | undefined, FormData>(signInWithPassword, initialState);
  const [devState, devFormAction] = useFormState<FormState | undefined, FormData>(signInWithPasswordDev as any, initialState);
  const [isMagicLinkMode, setMagicLinkMode] = useState(false);
  const [isSending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);

  // Countdown timer for rate limit cooldown
  useEffect(() => {
    if (rateLimitCooldown > 0) {
      const timer = setInterval(() => {
        setRateLimitCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [rateLimitCooldown]);

  // Manejar estados de autenticación (errores y éxito)
  useEffect(() => {
    const currentState = isDevMode ? devState : state;

    // Manejar éxito de desarrollo
    if (isDevMode && devState && 'success' in devState && devState.success && 'redirectTo' in devState && devState.redirectTo) {
      toast.success('¡Login exitoso! Redirigiendo...', { duration: 2000 });
      // Pequeña pausa para que se vean las cookies y luego redirect
      setTimeout(() => {
        router.push(devState.redirectTo! as any);
      }, 500);
      return;
    }

    // Manejar errores
    if (currentState?.error?.auth) {
      const errorMessage = currentState.error.auth[0];
      // Mejores mensajes de error específicos
      if (errorMessage.includes('rate limit') || errorMessage.includes('intentos')) {
        setRateLimitCooldown(120); // 2 minutes countdown
        toast.error('Demasiados intentos de login. Intenta de nuevo en 2 minutos, o usa el modo de desarrollo.', {
          duration: 8000
        });
      } else {
        toast.error(errorMessage, { duration: 4000 });
      }
    }
  }, [state, devState, isDevMode, router]);

  // Function to clear rate limit cache in development
  const clearRateLimit = useCallback(async () => {
    if (process.env.NODE_ENV !== 'development') return;

    setIsClearing(true);
    try {
      const response = await fetch('/api/dev/clear-rate-limit', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        setRateLimitCooldown(0);
        toast.success('Cache limpiado. Ya puedes intentar hacer login de nuevo.', {
          duration: 3000
        });

        // Clear browser storage as well
        if (typeof window !== 'undefined') {
          localStorage.clear();
          // Clear Supabase related cookies
          document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            if (name.trim().startsWith('sb-')) {
              document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            }
          });
        }
      } else {
        throw new Error(result.error || 'Failed to clear cache');
      }
    } catch (error) {
      toast.error('Error al limpiar cache: ' + (error as Error).message);
    } finally {
      setIsClearing(false);
    }
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting) return; // Prevenir envíos múltiples

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('email', values.email);
      fd.append('password', values.password);

      // Use development auth if dev mode is enabled
      if (isDevMode) {
        devFormAction(fd);
      } else {
        formAction(fd);
      }
    } finally {
      // Reset después de un delay para permitir que la redirección suceda
      setTimeout(() => setIsSubmitting(false), 2000);
    }
  });

  const onSendMagicLink = (data: PasswordSignInInput) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.append('email', data.email);
      const result = await sendMagicLink(undefined, fd);
      if ('error' in result) {
        toast.error((result.error as any)?.auth?.[0] ?? (result.error as any)?.email?.[0] ?? 'Error');
      } else {
        toast.success(t('emailSent'));
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-white p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Development Mode Toggle */}
      {process.env.NODE_ENV === 'development' && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dev-mode"
              checked={isDevMode}
              onChange={(e) => setIsDevMode(e.target.checked)}
              className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
            />
            <Label htmlFor="dev-mode" className="text-sm text-orange-800 font-medium">
              🔧 Modo Desarrollo (Sin Rate Limit)
            </Label>
          </div>
          {isDevMode && (
            <div className="mt-2 space-y-1 text-xs text-orange-700">
              <p>• Usa cualquier email: provider@dev.com, client@dev.com</p>
              <p>• Cualquier contraseña funciona</p>
              <p>• Evita completamente Supabase Auth</p>
            </div>
          )}
        </div>
      )}
      <form className="space-y-4" action={formAction} onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" type="email" placeholder="tu@email.com" aria-invalid={Boolean(errors.email)} {...register('email')} />
          {(errors.email?.message || state?.error?.email) && (
            <p className="text-sm text-error">{errors.email?.message ?? state?.error?.email?.[0]}</p>
          )}
        </div>
        {!isMagicLinkMode && (
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input id="password" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
            {(errors.password?.message || state?.error?.password) && (
              <p className="text-sm text-error">{errors.password?.message ?? state?.error?.password?.[0]}</p>
            )}
          </div>
        )}
{(() => {
          const currentState = isDevMode ? devState : state;
          return currentState?.error?.auth && (
            <div className="space-y-2">
              <p className="text-sm text-error">{currentState.error.auth[0]}</p>
              {rateLimitCooldown > 0 && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Tiempo restante: {Math.floor(rateLimitCooldown / 60)}:{(rateLimitCooldown % 60).toString().padStart(2, '0')}
                  </p>
                  {process.env.NODE_ENV === 'development' && !isDevMode && (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearRateLimit}
                        disabled={isClearing}
                        className="text-xs"
                      >
                        {isClearing ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Limpiando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Limpiar Cache (Dev)
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        O activa el &quot;Modo Desarrollo&quot; arriba para evitar rate limits
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
        <SubmitButton
          disabled={isMagicLinkMode || isSubmitting || rateLimitCooldown > 0}
          label={rateLimitCooldown > 0 ? `Espera ${Math.floor(rateLimitCooldown / 60)}:${(rateLimitCooldown % 60).toString().padStart(2, '0')}` : t('cta')}
        />
      </form>
      <div className="space-y-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={isSending || isSubmitting}
          onClick={handleSubmit((values) => {
            setMagicLinkMode(true);
            onSendMagicLink(values);
          })}
        >
          {isSending ? '...' : t('magicLink')}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t('sendLink')}</p>
      </div>
    </div>
  );
}

function SubmitButton({ disabled, label }: { disabled: boolean; label: string }) {
  const status = useFormStatus();
  const isLoading = disabled || status.pending;

  return (
    <Button type="submit" className="w-full" disabled={isLoading}>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Iniciando sesión...
        </div>
      ) : (
        label
      )}
    </Button>
  );
}
