'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';
import type { Locale, Messages } from './index';

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  t: (namespace: keyof Messages, key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: ReactNode; }) {
  const value = useMemo(() => ({
    locale,
    messages,
    t: (namespace: string, key: string, fallback?: string) => {
      const dict = (messages as any)[namespace] as Record<string, string> | undefined;
      return dict?.[key] ?? fallback ?? key;
    }
  }), [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(namespace: keyof Messages) {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return {
    t: (key: string, fallback?: string) => ctx.t(namespace, key, fallback),
    locale: ctx.locale
  };
}
