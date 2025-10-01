'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn, formatDateToDDMMYYYY, parseDDMMYYYY, isValidPartialDate } from '@/lib/utils';

interface CustomDateInputProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Input de fecha personalizado que acepta formato DD/MM/YYYY
 * Valida mientras el usuario escribe y formatea automáticamente
 */
export function CustomDateInput({
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  className,
  disabled = false,
  autoFocus = false,
  onBlur,
  onKeyDown
}: CustomDateInputProps) {
  const [internalValue, setInternalValue] = useState(() => formatDateToDDMMYYYY(value));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Actualizar valor interno cuando cambia el valor externo
  useEffect(() => {
    setInternalValue(formatDateToDDMMYYYY(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Permitir solo números y barras
    newValue = newValue.replace(/[^\d/]/g, '');

    // Auto-insertar barras al escribir
    if (newValue.length === 2 && internalValue.length === 1) {
      newValue += '/';
    } else if (newValue.length === 5 && internalValue.length === 4) {
      newValue += '/';
    }

    // Limitar longitud máxima (DD/MM/YYYY = 10 caracteres)
    if (newValue.length > 10) {
      return;
    }

    // Validar formato parcial
    if (!isValidPartialDate(newValue)) {
      return;
    }

    setInternalValue(newValue);
    setError(null);

    // Si está completo y es válido, emitir cambio
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(newValue)) {
      try {
        const isoDate = parseDDMMYYYY(newValue);
        onChange(isoDate);
        setError(null);
      } catch (err) {
        setError('Fecha inválida');
      }
    }
  };

  const handleBlur = () => {
    // Validar fecha completa al salir del input
    if (internalValue && !/^\d{2}\/\d{2}\/\d{4}$/.test(internalValue)) {
      setError('Formato incompleto. Use DD/MM/YYYY');
    } else if (internalValue) {
      try {
        parseDDMMYYYY(internalValue);
        setError(null);
      } catch (err) {
        setError('Fecha inválida');
      }
    } else {
      setError(null);
    }

    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir teclas especiales
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Enter',
      'Escape'
    ];

    if (allowedKeys.includes(e.key)) {
      onKeyDown?.(e);
      return;
    }

    // Solo permitir números y barra
    if (!/[\d/]/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            'pr-10',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          inputMode="numeric"
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
