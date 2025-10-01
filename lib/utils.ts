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
  let d: Date;

  if (typeof date === 'string') {
    // Si la fecha es solo YYYY-MM-DD (sin hora), interpretarla como hora local para evitar problemas de zona horaria
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      d = new Date(year, month - 1, day); // Crear como fecha local
    } else {
      d = new Date(date);
    }
  } else {
    d = date;
  }


  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  }).format(d);
}

// Zona horaria de Argentina (GMT-3)
const ARGENTINA_TIMEZONE = 'America/Buenos_Aires';

/**
 * Crea una fecha en la zona horaria de Argentina (GMT-3) a partir de un string YYYY-MM-DD
 */
export function createDateInArgentinaTimezone(dateString: string): Date {
  // Crear fecha en la zona horaria de Argentina a las 00:00:00
  const date = new Date(`${dateString}T00:00:00`);

  // Convertir a UTC considerando el offset de Argentina (-3 horas)
  const offsetMinutes = 3 * 60; // GMT-3 = -180 minutos
  const utcDate = new Date(date.getTime() + (offsetMinutes * 60 * 1000));

  return utcDate;
}

/**
 * Convierte una fecha a formato YYYY-MM-DD para inputs, considerando la zona horaria de Argentina
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';

  try {
    let d: Date;

    if (typeof date === 'string') {
      // Si la fecha es solo YYYY-MM-DD (sin hora), interpretarla como fecha local
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        d = new Date(year, month - 1, day); // Crear como fecha local
      } else {
        // Para fechas con timezone, convertir a zona horaria de Argentina
        d = new Date(date);
        const argentinaDate = new Intl.DateTimeFormat('sv-SE', {
          timeZone: ARGENTINA_TIMEZONE,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(d);
        return argentinaDate;
      }
    } else {
      d = date;
    }

    // Para fechas locales, usar el formato directo
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

/**
 * Parsea una fecha desde un input (YYYY-MM-DD) y la devuelve como string de fecha simple
 * para evitar problemas de zona horaria
 */
export function parseDateFromInput(inputValue: string): string {
  if (!inputValue.trim()) {
    throw new Error('Fecha inválida');
  }

  try {
    // Validar formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
      throw new Error('Formato de fecha inválido');
    }

    const [year, month, day] = inputValue.split('-').map(Number);

    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error('Fecha inválida');
    }

    // Devolver como datetime a medianoche UTC para evitar problemas de zona horaria
    // pero manteniendo la fecha correcta
    return `${inputValue}T00:00:00.000Z`;
  } catch (error) {
    console.error('Error parsing date:', error);
    throw new Error('Fecha inválida');
  }
}

/**
 * Convierte una fecha a formato DD/MM/YYYY para mostrar en inputs personalizados
 */
export function formatDateToDDMMYYYY(date: string | Date | null | undefined): string {
  if (!date) return '';

  try {
    let d: Date;

    if (typeof date === 'string') {
      // Si la fecha es solo YYYY-MM-DD (sin hora), interpretarla como fecha local
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        d = new Date(year, month - 1, day); // Crear como fecha local
      } else {
        // Para fechas con timezone, convertir a zona horaria de Argentina
        d = new Date(date);
      }
    } else {
      d = date;
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

/**
 * Parsea una fecha en formato DD/MM/YYYY y la convierte a ISO string para la base de datos
 * @param inputValue - Fecha en formato DD/MM/YYYY (ejemplo: "25/12/2024")
 * @returns ISO string (ejemplo: "2024-12-25T00:00:00.000Z")
 */
export function parseDDMMYYYY(inputValue: string): string {
  if (!inputValue.trim()) {
    throw new Error('Fecha inválida');
  }

  try {
    // Validar formato DD/MM/YYYY
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(inputValue)) {
      throw new Error('Formato de fecha inválido. Use DD/MM/YYYY');
    }

    const [day, month, year] = inputValue.split('/').map(Number);

    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error('Fecha inválida');
    }

    // Validar que la fecha sea válida (no 31/02/2024 por ejemplo)
    const testDate = new Date(year, month - 1, day);
    if (testDate.getDate() !== day || testDate.getMonth() !== month - 1 || testDate.getFullYear() !== year) {
      throw new Error('Fecha inválida');
    }

    // Convertir a formato YYYY-MM-DD y luego a ISO string
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return `${isoDate}T00:00:00.000Z`;
  } catch (error) {
    console.error('Error parsing DD/MM/YYYY date:', error);
    throw new Error('Fecha inválida. Use el formato DD/MM/YYYY');
  }
}

/**
 * Valida si un string parcial puede ser una fecha válida en formato DD/MM/YYYY
 * Útil para validación mientras el usuario escribe
 */
export function isValidPartialDate(inputValue: string): boolean {
  // Permitir vacío
  if (!inputValue) return true;

  // Permitir solo números y barras
  if (!/^[\d/]*$/.test(inputValue)) return false;

  // Si tiene formato completo, validar
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(inputValue)) {
    try {
      parseDDMMYYYY(inputValue);
      return true;
    } catch {
      return false;
    }
  }

  // Validar formato parcial (mientras escribe)
  const parts = inputValue.split('/');

  // Día: máximo 2 dígitos, entre 01-31
  if (parts[0]) {
    const day = parseInt(parts[0]);
    if (parts[0].length > 2 || day < 1 || day > 31) return false;
  }

  // Mes: máximo 2 dígitos, entre 01-12
  if (parts[1]) {
    const month = parseInt(parts[1]);
    if (parts[1].length > 2 || month < 1 || month > 12) return false;
  }

  // Año: máximo 4 dígitos
  if (parts[2]) {
    if (parts[2].length > 4) return false;
  }

  // No más de 3 partes
  if (parts.length > 3) return false;

  return true;
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

/**
 * Parsea una fecha de string en formato YYYY-MM-DD y la convierte a objeto Date
 * manteniendo la zona horaria de Argentina (GMT-3) para evitar desfasajes
 */
export function parseStageDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  try {
    // Si es solo YYYY-MM-DD, crear fecha en zona horaria Argentina a las 12:00 PM
    // para evitar problemas de cambio de día por timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      // Crear fecha local a las 12:00 PM para evitar problemas de timezone
      return new Date(year, month - 1, day, 12, 0, 0);
    }

    // Para fechas con timestamp completo, parsear directamente
    return new Date(dateString);
  } catch (error) {
    console.error('Error parsing stage date:', error);
    return null;
  }
}

/**
 * Extrae el username de un email (la parte antes del @)
 * para usar como clientId en las URLs
 */
export function getUsernameFromEmail(email: string): string {
  if (!email || !email.includes('@')) {
    throw new Error('Email inválido');
  }

  const username = email.split('@')[0];

  if (!username) {
    throw new Error('Username extraído está vacío');
  }

  return username;
}
