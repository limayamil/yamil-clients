import es from './locales/es.json';
import en from './locales/en.json';

export type Locale = 'es' | 'en';
export type Namespace = keyof typeof es;
export type Messages = typeof es;

const dictionaries: Record<Locale, Messages> = {
  es,
  en
};

export function getLocaleFromCookie(cookieHeader?: string | null): Locale {
  if (!cookieHeader) return 'es';
  const cookie = Object.fromEntries(
    cookieHeader.split(';').map((entry) => {
      const [key, ...rest] = entry.trim().split('=');
      return [key, decodeURIComponent(rest.join('='))];
    })
  );
  const locale = cookie['locale'] as Locale | undefined;
  return locale && ['es', 'en'].includes(locale) ? locale : 'es';
}

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale] ?? dictionaries.es;
}

export function translate(
  locale: Locale,
  namespace: Namespace,
  key: string,
  fallback?: string
) {
  const dict = getDictionary(locale);
  const ns = dict[namespace] as Record<string, string> | undefined;
  if (!ns) return fallback ?? key;
  return ns[key] ?? fallback ?? key;
}
