'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PasswordSignInInput, passwordSignInSchema } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithPassword, sendMagicLink } from '@/actions/auth';
import { useI18n } from '@/lib/i18n/provider';
import { toast } from 'sonner';
import { useFormState, useFormStatus } from 'react-dom';

interface FormState {
  error?: Record<string, string[]>;
}

const initialState: FormState | undefined = undefined;

export function LoginForm() {
  const { t } = useI18n('auth');
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PasswordSignInInput>({ resolver: zodResolver(passwordSignInSchema) });

  const [state, formAction] = useFormState<FormState | undefined, FormData>(signInWithPassword, initialState);
  const [isMagicLinkMode, setMagicLinkMode] = useState(false);
  const [isSending, startTransition] = useTransition();

  const onSubmit = handleSubmit((values) => {
    const fd = new FormData();
    fd.append('email', values.email);
    fd.append('password', values.password);
    formAction(fd);
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
        {state?.error?.auth && <p className="text-sm text-error">{state.error.auth[0]}</p>}
        <SubmitButton disabled={isMagicLinkMode} label={t('cta')} />
      </form>
      <div className="space-y-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={isSending}
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
  return (
    <Button type="submit" className="w-full" disabled={disabled || status.pending}>
      {status.pending ? '...' : label}
    </Button>
  );
}
