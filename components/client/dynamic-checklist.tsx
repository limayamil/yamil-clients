'use client';

import { useState } from 'react';
import { Check, Plus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface DynamicChecklistProps {
  initialItems?: string[] | ChecklistItem[];
  onUpdate?: (items: ChecklistItem[]) => void;
  readonly?: boolean;
  className?: string;
}

export function DynamicChecklist({
  initialItems = [],
  onUpdate,
  readonly = false,
  className
}: DynamicChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    if (!initialItems || initialItems.length === 0) return [];

    // Si es un array de ChecklistItem, usarlo directamente
    if (typeof initialItems[0] === 'object' && 'id' in initialItems[0]) {
      return initialItems as ChecklistItem[];
    }

    // Si es un array de strings, convertir manteniendo el formato antiguo
    return (initialItems as string[]).map((text, index) => ({
      id: `item-${index}`,
      text,
      completed: false
    }));
  });
  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const updateItems = (newItems: ChecklistItem[]) => {
    setItems(newItems);
    onUpdate?.(newItems);
  };

  const toggleItem = (id: string) => {
    if (readonly) return;

    const updatedItems = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    updateItems(updatedItems);
  };

  const addItem = () => {
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: newItemText.trim(),
      completed: false
    };

    updateItems([...items, newItem]);
    setNewItemText('');
    setIsAddingItem(false);
  };

  const removeItem = (id: string) => {
    if (readonly) return;

    const updatedItems = items.filter(item => item.id !== id);
    updateItems(updatedItems);
  };

  const updateItemText = (id: string, newText: string) => {
    if (readonly) return;

    const updatedItems = items.map(item =>
      item.id === id ? { ...item, text: newText } : item
    );
    updateItems(updatedItems);
  };

  const completedCount = items.filter(item => item.completed).length;
  const progressPercentage = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header con progreso */}
      {items.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {completedCount} de {items.length} completados
          </span>
          <span className="font-medium text-foreground">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      )}

      {/* Barra de progreso */}
      {items.length > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Lista de items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            readonly={readonly}
            onToggle={() => toggleItem(item.id)}
            onRemove={() => removeItem(item.id)}
            onUpdateText={(text) => updateItemText(item.id, text)}
          />
        ))}

        {/* Formulario para agregar nuevo item */}
        {!readonly && (
          <div className="pt-2">
            {isAddingItem ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Nuevo elemento de la lista..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem();
                    } else if (e.key === 'Escape') {
                      setIsAddingItem(false);
                      setNewItemText('');
                    }
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={addItem}
                  disabled={!newItemText.trim()}
                  className="h-8 px-2"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddingItem(false);
                    setNewItemText('');
                  }}
                  className="h-8 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingItem(true)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Agregar elemento
              </Button>
            )}
          </div>
        )}

        {/* Estado vacío */}
        {items.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {readonly ? 'No hay elementos en esta lista' : 'Lista vacía. Agrega un elemento para empezar.'}
          </div>
        )}
      </div>
    </div>
  );
}

interface ChecklistItemRowProps {
  item: ChecklistItem;
  readonly: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdateText: (text: string) => void;
}

function ChecklistItemRow({
  item,
  readonly,
  onToggle,
  onRemove,
  onUpdateText
}: ChecklistItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleSave = () => {
    if (editText.trim() && editText !== item.text) {
      onUpdateText(editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(item.text);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2 group">
      {/* Checkbox */}
      <Checkbox
        checked={item.completed}
        onCheckedChange={onToggle}
        disabled={readonly}
        className="flex-shrink-0"
      />

      {/* Texto del item */}
      <div className="flex-1 min-w-0">
        {isEditing && !readonly ? (
          <div className="flex items-center gap-1">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="h-7 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              onBlur={handleSave}
              autoFocus
            />
          </div>
        ) : (
          <span
            className={`text-sm cursor-pointer transition-colors ${
              item.completed
                ? 'line-through text-muted-foreground'
                : 'text-foreground hover:text-muted-foreground'
            }`}
            onClick={() => !readonly && setIsEditing(true)}
          >
            {item.text}
          </span>
        )}
      </div>

      {/* Acciones */}
      {!readonly && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}