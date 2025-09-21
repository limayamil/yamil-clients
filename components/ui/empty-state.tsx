'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white p-12 text-center',
      className
    )}>
      {icon && (
        <div className="mb-4 rounded-full bg-brand-50 p-3 text-brand-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          loading={action.loading}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}