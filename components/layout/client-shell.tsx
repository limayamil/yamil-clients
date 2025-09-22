'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, FolderKanban, Settings, LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn, getNavItemColors } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
// import { ThemeToggle } from '@/components/ui/theme-toggle';
import { logout } from '@/actions/user';
import { useSidebar } from '@/hooks/use-sidebar';

const clientNav = [
  { href: '/projects', icon: FolderKanban, label: 'Mis proyectos' },
  { href: '/settings', icon: Settings, label: 'Preferencias' }
];

export function ClientShell({ children, clientId, userEmail }: { children: ReactNode; clientId: string; userEmail?: string }) {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleCollapsed, toggleMobile, closeMobile } = useSidebar();
  const initials = userEmail?.slice(0, 2).toUpperCase() || 'CL';

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-brand-50/70 to-brand-100/50">
      <aside
        className={cn(
          'fixed z-40 flex h-full flex-col border-r border-border bg-background shadow-xl transition-all duration-300 ease-out',
          // Mobile behavior
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Desktop width
          isCollapsed ? 'lg:w-16' : 'lg:w-72',
          // Base width for mobile
          'w-72'
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-6 bg-gradient-to-r from-brand-500 to-brand-600",
          isCollapsed && "lg:justify-center lg:p-4"
        )}>
          <Link
            href={`/c/${clientId}/projects`}
            className={cn(
              "text-lg font-semibold text-white transition-opacity",
              isCollapsed && "lg:hidden"
            )}
          >
            FlowSync
          </Link>

          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8 text-white hover:bg-white/20"
            onClick={toggleCollapsed}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-white hover:bg-white/20"
            onClick={closeMobile}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {clientNav.map((item) => {
            const fullHref = `/c/${clientId}${item.href}`;
            const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);
            const Icon = item.icon;
            const colors = getNavItemColors(item.href);

            return (
              <div key={item.href} className="relative group">
                <Link
                  href={fullHref as any}
                  onClick={closeMobile}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 hover:scale-105',
                    isActive
                      ? `${colors.bg} ${colors.text} shadow-md`
                      : 'text-muted-foreground hover:bg-gray-100/80 hover:text-gray-700',
                    isCollapsed && 'lg:justify-center lg:px-2'
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isActive
                      ? `bg-gradient-to-r ${colors.gradient} text-white shadow-sm`
                      : "text-muted-foreground group-hover:text-gray-600"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <span className={cn(
                    "transition-opacity",
                    isCollapsed && "lg:hidden"
                  )}>
                    {item.label}
                  </span>
                </Link>

                {/* Tooltip para modo colapsado */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 hidden lg:block">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        {/* Footer */}
        <div className="p-4 border-t border-border/30">
          <div className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground mb-2",
            isCollapsed && "lg:justify-center lg:px-2"
          )}>
            <User className="h-4 w-4" />
            <span className={cn(
              "truncate transition-opacity",
              isCollapsed && "lg:hidden"
            )}>
              {userEmail || 'Cliente'}
            </span>
          </div>
          <Separator className={cn("my-2", isCollapsed && "lg:hidden")} />
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors",
                isCollapsed && "lg:justify-center lg:px-2"
              )}
            >
              <LogOut className="h-4 w-4" />
              <span className={cn(isCollapsed && "lg:hidden")}>Cerrar sesión</span>
            </Button>
          </form>
        </div>
      </aside>
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300",
        isCollapsed ? "lg:pl-16" : "lg:pl-72"
      )}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 lg:hidden touch-manipulation"
              onClick={toggleMobile}
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
        <main className="flex-1 px-4 sm:px-6 pb-10 pt-8">
          <div className="mx-auto max-w-[1366px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
