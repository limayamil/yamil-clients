'use client';

import { EditableDate } from '@/components/ui/editable-date';

interface EditableDateTileProps {
  label: string;
  value: string | null | undefined;
  onSave: (newValue: string | null) => Promise<void>;
  placeholder?: string;
}

export function EditableDateTile({
  label,
  value,
  onSave,
  placeholder = 'Sin fecha'
}: EditableDateTileProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-muted-foreground mb-2">{label}</p>
      <EditableDate
        value={value}
        onSave={onSave}
        placeholder={placeholder}
        className="font-semibold text-foreground"
      />
    </div>
  );
}