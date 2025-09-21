import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/guards';
import { ClientShell } from '@/components/layout/client-shell';

export default async function ClientLayout({ children, params }: { children: ReactNode; params: { clientId: string } }) {
  const user = await requireRole(['client']);

  // Critical security check: ensure client can only access their own data
  if (!user.email || user.email !== params.clientId) {
    // Redirect to the correct client URL instead of allowing unauthorized access
    redirect(`/c/${user.email}/projects`);
  }

  return <ClientShell clientId={params.clientId} userEmail={user.email}>{children}</ClientShell>;
}
