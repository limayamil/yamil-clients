'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, Check, X, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatDateToDDMMYYYY, parseDDMMYYYY } from '@/lib/utils';
import { CustomDateInput } from '@/components/ui/custom-date-input';

interface EditableDateProps {
  value: string | null | undefined;
  onSave: (newValue: string | null) => Promise<void>;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  allowNull?: boolean;
}

export function EditableDate({
  value,
  onSave,
  placeholder = 'Sin fecha',
  label,
  className,
  disabled = false,
  allowNull = true
}: EditableDateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const displayValue = value ? formatDate(value) : placeholder;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const dateToSave = editValue ? editValue : null;
      await onSave(dateToSave);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving date:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue('');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <CustomDateInput
          value={value}
          onChange={setEditValue}
          onKeyDown={handleKeyDown}
          className="font-medium"
          disabled={isLoading}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            loading={isLoading}
            disabled={!editValue}
          >
            <Check className="h-4 w-4" />
            Guardar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          {allowNull && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                setIsLoading(true);
                try {
                  await onSave(null);
                  setIsEditing(false);
                } catch (error) {
                  console.error('Error clearing date:', error);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-lg transition-colors',
        !disabled && 'hover:bg-muted/30',
        className
      )}
      onClick={() => {
        if (!disabled) {
          setEditValue('');
          setIsEditing(true);
        }
      }}
    >
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <div className={cn(
          'break-words',
          !value && 'text-muted-foreground italic'
        )}>
          {label && <span className="text-xs uppercase text-muted-foreground block">{label}</span>}
          <div className="font-medium">{displayValue}</div>
        </div>
      </div>
      {!disabled && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute -right-1 -top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            setEditValue('');
            setIsEditing(true);
          }}
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}