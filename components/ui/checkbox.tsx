import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'h-4 w-4 shrink-0 rounded-sm border border-gray-300 bg-white transition-colors',
        'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked && 'bg-brand-600 border-brand-600 text-white',
        className
      )}
      {...props}
    >
      {checked && (
        <div className="flex items-center justify-center w-full h-full">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  )
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };