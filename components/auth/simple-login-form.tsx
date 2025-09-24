'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';

// Simple validation schema - only email required
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido')
});

type LoginInput = z.infer<typeof loginSchema>;

interface SimpleLoginFormProps {
  onLogin: (email: string) => Promise<{ success: boolean; redirectTo?: string; error?: string }>;
}

export function SimpleLoginForm({ onLogin }: SimpleLoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      try {
        console.log('🔄 Attempting login with:', data.email);
        const result = await onLogin(data.email);
        console.log('📋 Login result:', result);

        if (result.success && result.redirectTo) {
          toast.success('¡Acceso concedido! Redirigiendo...', { duration: 2000 });

          // Small delay for user feedback, then redirect
          setTimeout(() => {
            console.log('🔗 Redirecting to:', result.redirectTo);
            // Use window.location for guaranteed redirect
            if (typeof window !== 'undefined') {
              window.location.href = result.redirectTo!;
            }
          }, 500);
        } else if (result.error) {
          setError('email', { message: result.error });
          toast.error(result.error, { duration: 4000 });
        }
      } catch (error) {
        console.error('❌ Login error:', error);
        const errorMessage = 'Error de conexión. Intenta de nuevo.';
        setError('email', { message: errorMessage });
        toast.error(errorMessage, { duration: 4000 });
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-white p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Acceder</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tu email para acceder a tu cuenta
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            autoFocus
            disabled={isPending}
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verificando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Ingresar
            </div>
          )}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          Sistema simplificado sin contraseñas
        </p>
        <p className="text-xs text-muted-foreground">
          Solo usuarios registrados pueden acceder
        </p>
      </div>
    </div>
  );
}