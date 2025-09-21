'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit3, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  editClassName?: string;
  disabled?: boolean;
  maxLength?: number;
}

export function EditableText({
  value,
  onSave,
  placeholder = 'Hacer clic para editar...',
  multiline = false,
  className,
  editClassName,
  disabled = false,
  maxLength
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (!multiline) {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing, multiline]);

  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
      setEditValue(value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
    if (e.key === 'Enter' && multiline && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input;
    return (
      <div className="space-y-2">
        <InputComponent
          ref={inputRef as any}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            'font-medium',
            multiline && 'min-h-[100px] resize-y',
            editClassName
          )}
          disabled={isLoading}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            loading={isLoading}
            disabled={!editValue.trim() || editValue.trim() === value.trim()}
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
          {multiline && (
            <span className="text-xs text-muted-foreground">
              Ctrl+Enter para guardar, Esc para cancelar
            </span>
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
      onClick={() => !disabled && setIsEditing(true)}
    >
      <div className={cn(
        'break-words',
        !value && 'text-muted-foreground italic'
      )}>
        {value || placeholder}
      </div>
      {!disabled && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute -right-1 -top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}