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

// Colores pasteles por tipo de etapa
export function getStageTypeColors(type: string) {
  const colorMap = {
    'intake': {
      bg: 'bg-rose-100/60',
      border: 'border-rose-200',
      text: 'text-rose-700',
      gradient: 'from-rose-50 to-rose-100/30',
      icon: 'text-rose-600',
      solid: 'bg-rose-500'
    },
    'materials': {
      bg: 'bg-sky-100/60',
      border: 'border-sky-200',
      text: 'text-sky-700',
      gradient: 'from-sky-50 to-sky-100/30',
      icon: 'text-sky-600',
      solid: 'bg-sky-500'
    },
    'design': {
      bg: 'bg-violet-100/60',
      border: 'border-violet-200',
      text: 'text-violet-700',
      gradient: 'from-violet-50 to-violet-100/30',
      icon: 'text-violet-600',
      solid: 'bg-violet-500'
    },
    'development': {
      bg: 'bg-emerald-100/60',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      gradient: 'from-emerald-50 to-emerald-100/30',
      icon: 'text-emerald-600',
      solid: 'bg-emerald-500'
    },
    'review': {
      bg: 'bg-orange-100/60',
      border: 'border-orange-200',
      text: 'text-orange-700',
      gradient: 'from-orange-50 to-orange-100/30',
      icon: 'text-orange-600',
      solid: 'bg-orange-500'
    },
    'handoff': {
      bg: 'bg-indigo-100/60',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      gradient: 'from-indigo-50 to-indigo-100/30',
      icon: 'text-indigo-600',
      solid: 'bg-indigo-500'
    },
    'custom': {
      bg: 'bg-gray-100/60',
      border: 'border-gray-200',
      text: 'text-gray-700',
      gradient: 'from-gray-50 to-gray-100/30',
      icon: 'text-gray-600',
      solid: 'bg-gray-500'
    }
  };

  return colorMap[type as keyof typeof colorMap] || colorMap.custom;
}

// Colores por estado de etapa (más vibrantes para estados)
export function getStageStatusColors(status: string) {
  const colorMap = {
    'todo': {
      bg: 'bg-slate-100/60',
      border: 'border-slate-200',
      text: 'text-slate-700',
      solid: 'bg-slate-400'
    },
    'in_progress': {
      bg: 'bg-teal-100/60',
      border: 'border-teal-200',
      text: 'text-teal-700',
      solid: 'bg-teal-500'
    },
    'waiting_client': {
      bg: 'bg-amber-100/60',
      border: 'border-amber-200',
      text: 'text-amber-700',
      solid: 'bg-amber-500'
    },
    'in_review': {
      bg: 'bg-purple-100/60',
      border: 'border-purple-200',
      text: 'text-purple-700',
      solid: 'bg-purple-500'
    },
    'approved': {
      bg: 'bg-blue-100/60',
      border: 'border-blue-200',
      text: 'text-blue-700',
      solid: 'bg-blue-500'
    },
    'done': {
      bg: 'bg-green-100/60',
      border: 'border-green-200',
      text: 'text-green-700',
      solid: 'bg-green-500'
    },
    'blocked': {
      bg: 'bg-red-100/60',
      border: 'border-red-200',
      text: 'text-red-700',
      solid: 'bg-red-500'
    }
  };

  return colorMap[status as keyof typeof colorMap] || colorMap.todo;
}

// Navegación con colores distintivos
export function getNavItemColors(href: string) {
  const colorMap = {
    '/dashboard': {
      gradient: 'from-blue-500 to-emerald-500',
      bg: 'bg-gradient-to-r from-blue-100 to-emerald-100',
      text: 'text-blue-700'
    },
    '/clients': {
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-gradient-to-r from-purple-100 to-pink-100',
      text: 'text-purple-700'
    },
    '/projects': {
      gradient: 'from-orange-500 to-yellow-500',
      bg: 'bg-gradient-to-r from-orange-100 to-yellow-100',
      text: 'text-orange-700'
    },
    '/settings': {
      gradient: 'from-gray-500 to-slate-500',
      bg: 'bg-gradient-to-r from-gray-100 to-slate-100',
      text: 'text-gray-700'
    }
  };

  return colorMap[href as keyof typeof colorMap] || colorMap['/dashboard'];
}
