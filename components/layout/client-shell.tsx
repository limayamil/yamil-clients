'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, FolderKanban, Settings, LogOut, User } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { logout } from '@/actions/user';

const clientNav = [
  { href: '/projects', icon: FolderKanban, label: 'Mis proyectos' },
  { href: '/settings', icon: Settings, label: 'Preferencias' }
];

export function ClientShell({ children, clientId, userEmail }: { children: ReactNode; clientId: string; userEmail?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = userEmail?.slice(0, 2).toUpperCase() || 'CL';

  return (
    <div className="flex min-h-screen bg-brand-50/70">
      <aside
        className={cn(
          'fixed z-40 flex h-full w-72 flex-col border-r border-border bg-white px-6 py-8 shadow-xl transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="mb-10 flex items-center justify-between">
          <Link href={`/c/${clientId}/projects`} className="text-lg font-semibold text-brand-700">
            FlowSync
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-2">
          {clientNav.map((item) => {
            const fullHref = `/c/${clientId}${item.href}`;
            const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={fullHref as any}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition',
                  isActive && 'bg-brand-100 text-brand-800'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Separator className="my-4" />
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="truncate">{userEmail || 'Cliente'}</span>
          </div>
          <form action={logout}>
            <Button type="submit" variant="ghost" className="w-full justify-start gap-2 text-sm text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 lg:hidden touch-manipulation"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú de navegación"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">Proyectos</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 touch-manipulation"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 pb-10 pt-8">{children}</main>
      </div>
    </div>
  );
}
