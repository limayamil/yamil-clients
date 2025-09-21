'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectStatus } from '@/types/project';

interface EditableStatusProps {
  value: ProjectStatus;
  onSave: (newValue: ProjectStatus) => Promise<void>;
  className?: string;
  disabled?: boolean;
}

const statusLabels: Record<ProjectStatus, string> = {
  planned: 'Planificado',
  in_progress: 'En progreso',
  on_hold: 'En pausa',
  done: 'Completado',
  archived: 'Archivado'
};

const statusVariants: Record<ProjectStatus, 'default' | 'secondary' | 'destructive' | 'warning'> = {
  planned: 'secondary',
  in_progress: 'default',
  on_hold: 'warning',
  done: 'secondary',
  archived: 'secondary'
};

export function EditableStatus({
  value,
  onSave,
  className,
  disabled = false
}: EditableStatusProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<ProjectStatus>(value);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving status:', error);
      setEditValue(value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Select value={editValue} onValueChange={(newValue: ProjectStatus) => setEditValue(newValue)}>
          <SelectTrigger className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            loading={isLoading}
            disabled={editValue === value}
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
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative inline-flex cursor-pointer',
        !disabled && 'hover:opacity-80',
        className
      )}
      onClick={() => !disabled && setIsEditing(true)}
    >
      <Badge variant={statusVariants[value]}>
        {statusLabels[value]}
      </Badge>
      {!disabled && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute -right-6 -top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
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