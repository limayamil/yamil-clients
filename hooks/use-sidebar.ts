'use client';

import { useState, useEffect } from 'react';

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true); // Colapsado por defecto
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Cargar estado del localStorage al montar
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved) {
        setIsCollapsed(JSON.parse(saved));
      } else {
        // Si no hay estado guardado, usar colapsado por defecto
        setIsCollapsed(true);
      }
    }
  }, []);

  // Persistir estado en localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    }
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return {
    isCollapsed: mounted ? isCollapsed : true, // Colapsado por defecto también en SSR
    isMobileOpen,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
    mounted,
  };
}