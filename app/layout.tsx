import './globals.css';
import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { getDictionary, getLocaleFromCookie } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/provider';
import { inter, sourceSans } from '@/lib/fonts';
import { SupabaseProvider } from '@/components/providers/supabase-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
// import { ThemeProvider } from '@/components/providers/theme-provider';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { getSession } from '@/lib/auth/session';

export const metadata = {
  title: 'FlowSync',
  description:
    'Gestión colaborativa de proyectos Cliente ↔ Proveedor con etapas, aprobaciones y seguimiento en tiempo real.'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join(';'));
  const messages = getDictionary(locale);
  const session = await getSession();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${sourceSans.variable} font-sans`}>
        <ErrorBoundary showDetails>
          <I18nProvider locale={locale} messages={messages}>
            <SupabaseProvider session={session}>
              <ToastProvider>{children}</ToastProvider>
            </SupabaseProvider>
          </I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
