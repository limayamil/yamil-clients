import { ReactNode } from 'react';
import { requireRole } from '@/lib/auth/guards';
import { ProviderShell } from '@/components/layout/provider-shell';

export default async function ProviderLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(['provider']);
  return <ProviderShell userEmail={session.user.email ?? 'user@flowsync.app'}>{children}</ProviderShell>;
}
