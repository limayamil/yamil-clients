'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;

    setSelectedDate(date);

    try {
      setIsLoading(true);
      // Convert to ISO string format (YYYY-MM-DD)
      const isoDate = format(date, 'yyyy-MM-dd');
      await onSave(isoDate);
      setIsOpen(false);
      toast.success(`${getDateTypeLabel(dateType)} actualizada`);
    } catch (error) {
      console.error('Error saving date:', error);
      toast.error('Error al actualizar la fecha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDate = async () => {
    try {
      setIsLoading(true);
      await onSave('');
      setSelectedDate(undefined);
      setIsOpen(false);
      toast.success(`${getDateTypeLabel(dateType)} eliminada`);
    } catch (error) {
      console.error('Error clearing date:', error);
      toast.error('Error al eliminar la fecha');
    } finally {
      setIsLoading(false);
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
      default: return CalendarIcon;
    }
  };

  const DateIcon = getDateTypeIcon();

  return (
    <div className={`group ${className}`}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          {label}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            disabled={disabled || isLoading}
            className={`
              flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-transparent
              transition-colors duration-200 w-full
              ${disabled || isLoading
                ? 'text-muted-foreground cursor-not-allowed opacity-50'
                : 'hover:bg-gray-50 hover:border-gray-200 cursor-pointer'
              }
              ${value ? getDateTypeColor(dateType) : 'text-muted-foreground'}
              group-hover:border-gray-200
            `}
          >
            <DateIcon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left">
              {value ? formatDate(value) : placeholder}
            </span>
            {!disabled && !isLoading && (
              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {value ? 'Cambiar' : 'Seleccionar'}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={es}
              disabled={isLoading}
              initialFocus
            />

            {value && (
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearDate}
                  disabled={isLoading}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Eliminar fecha
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
