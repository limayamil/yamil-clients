'use client';

import { ReactNode } from 'react';
import { Toaster } from 'sonner';

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="bottom-right" duration={6000} />
    </>
  );
}
