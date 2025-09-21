'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, Check, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Stage } from '@/types/project';

interface EditableStageSelectorProps {
  stages: Stage[];
  currentStageId?: string | null;
  onSave: (newStageId: string | null) => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function EditableStageSelector({
  stages,
  currentStageId,
  onSave,
  className,
  disabled = false
}: EditableStageSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentStageId || 'none');
  const [isLoading, setIsLoading] = useState(false);

  const currentStage = stages.find(stage => stage.id === currentStageId);
  const sortedStages = stages.sort((a, b) => a.order - b.order);

  const handleSave = async () => {
    if (editValue === (currentStageId || 'none')) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editValue === 'none' ? null : editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving stage:', error);
      setEditValue(currentStageId || 'none');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(currentStageId || 'none');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Select value={editValue} onValueChange={setEditValue}>
          <SelectTrigger className="w-auto min-w-[200px]">
            <SelectValue placeholder="Seleccionar etapa" />
          </SelectTrigger>
          <SelectContent>
            {sortedStages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      stage.status === 'done' ? 'secondary' :
                      stage.status === 'in_review' ? 'warning' :
                      stage.status === 'blocked' ? 'destructive' : 'default'
                    }
                    className="text-xs"
                  >
                    {stage.order}
                  </Badge>
                  {stage.title}
                </div>
              </SelectItem>
            ))}
            <SelectItem value="none">
              <span className="text-muted-foreground italic">Sin etapa activa</span>
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            loading={isLoading}
            disabled={editValue === (currentStageId || 'none')}
          >
            <Check className="h-4 w-4" />
            Cambiar etapa
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
        'group relative cursor-pointer inline-flex items-center gap-2 rounded-lg p-2 transition-colors',
        !disabled && 'hover:bg-muted/30',
        className
      )}
      onClick={() => !disabled && setIsEditing(true)}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm text-muted-foreground">Etapa actual:</span>
        {currentStage ? (
          <div className="flex items-center gap-2">
            <Badge
              variant={
                currentStage.status === 'done' ? 'secondary' :
                currentStage.status === 'in_review' ? 'warning' :
                currentStage.status === 'blocked' ? 'destructive' : 'default'
              }
            >
              {currentStage.order}
            </Badge>
            <span className="font-medium">{currentStage.title}</span>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Sin etapa activa</span>
        )}
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      {!disabled && (
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
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