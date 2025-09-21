'use server';

import { cookies } from 'next/headers';
import { Locale } from '@/lib/i18n';

export async function setLocale(_: unknown, formData: FormData) {
  const locale = (formData.get('locale') as Locale | null) ?? 'es';
  const cookieStore = cookies();
  cookieStore.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  return { success: true };
}
