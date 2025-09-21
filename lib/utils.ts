import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, locale = 'es-ES', currency = 'USD') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
}

export function formatDate(date: string | Date, locale = 'es-ES', options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options
  }).format(d);
}

export function getStageStatusVariant(status: string) {
  switch (status) {
    case 'waiting_client':
      return 'warning';
    case 'in_review':
      return 'outline';
    case 'approved':
    case 'done':
      return 'success';
    case 'blocked':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}
