import { Suspense } from 'react';
import { SimpleLoginForm } from '@/components/auth/simple-login-form';
import { loginWithEmail } from '@/actions/simple-auth';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 px-4 py-12">
      <Suspense fallback={null}>
        <SimpleLoginForm onLogin={loginWithEmail} />
      </Suspense>
    </div>
  );
}
