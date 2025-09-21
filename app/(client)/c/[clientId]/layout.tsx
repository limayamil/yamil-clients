import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/guards';
import { ClientShell } from '@/components/layout/client-shell';

export default async function ClientLayout({ children, params }: { children: ReactNode; params: { clientId: string } }) {
  const session = await requireRole(['client']);

  // Critical security check: ensure client can only access their own data
  if (!session.user.email || session.user.email !== params.clientId) {
    // Redirect to the correct client URL instead of allowing unauthorized access
    redirect(`/c/${session.user.email}/projects`);
  }

  return <ClientShell clientId={params.clientId} userEmail={session.user.email}>{children}</ClientShell>;
}
