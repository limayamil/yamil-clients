'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatDateForInput, parseDateFromInput } from '@/lib/utils';
import { toast } from 'sonner';

interface EditableStageDateProps {
  value?: string | null;
  onSave: (newDate: string) => Promise<void>;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  dateType?: 'start' | 'end' | 'deadline';
  className?: string;
}

export function EditableStageDate({
  value,
  onSave,
  placeholder = 'Seleccionar fecha',
  label,
  disabled = false,
  dateType = 'start',
  className = ''
}: EditableStageDateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Usar la utilidad para formatear fechas para inputs

  // Inicializar valor del input cuando se entra en modo edición
  useEffect(() => {
    if (isEditing) {
      setInputValue(formatDateForInput(value));
      // Focus después de que el input se renderice
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isEditing, value]);

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue('');
  };

  const handleSave = async () => {
    if (!inputValue.trim()) {
      toast.error('Por favor selecciona una fecha válida');
      return;
    }

    try {
      setIsLoading(true);
      // Usar la utilidad para parsear la fecha en GMT-3
      const dateToSave = parseDateFromInput(inputValue);
      await onSave(dateToSave);
      setIsEditing(false);
      toast.success(`${getDateTypeLabel(dateType)} actualizada`);
    } catch (error) {
      console.error('Error saving date:', error);
      toast.error('Error al actualizar la fecha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const getDateTypeLabel = (type: string): string => {
    switch (type) {
      case 'start': return 'Fecha de inicio';
      case 'end': return 'Fecha de fin';
      case 'deadline': return 'Fecha límite';
      default: return 'Fecha';
    }
  };

  const getDateTypeColor = (type: string): string => {
    switch (type) {
      case 'start': return 'text-green-600';
      case 'end': return 'text-blue-600';
      case 'deadline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDateTypeIcon = () => {
    switch (dateType) {
      case 'deadline': return Clock;
      default: return Calendar;
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1">
          <Input
            ref={inputRef}
            type="date"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
            disabled={isLoading}
            placeholder={placeholder}
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  const DateIcon = getDateTypeIcon();

  return (
    <div className={`group ${className}`}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          {label}
        </label>
      )}
      <button
        onClick={handleEdit}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-transparent
          transition-colors duration-200
          ${disabled
            ? 'text-muted-foreground cursor-not-allowed'
            : 'hover:bg-gray-50 hover:border-gray-200 cursor-pointer'
          }
          ${value ? getDateTypeColor(dateType) : 'text-muted-foreground'}
          group-hover:border-gray-200
        `}
      >
        <DateIcon className="h-4 w-4" />
        <span className="flex-1 text-left">
          {value ? formatDate(value) : placeholder}
        </span>
        {!disabled && (
          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Editar
          </span>
        )}
      </button>
    </div>
  );
}