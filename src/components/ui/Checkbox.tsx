import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  error?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <label className="group flex items-center space-x-2 cursor-pointer">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded border border-slate-300 bg-white transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-checked:border-primary peer-checked:bg-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-disabled:peer-checked:bg-slate-300 peer-disabled:peer-checked:border-slate-300',
              error && 'border-red-500',
              className
            )}
          >
            <Check className="h-full w-full p-0.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
          </div>
        </div>
        {label && (
          <span
            className={cn(
              'text-sm font-medium text-slate-700 select-none peer-disabled:opacity-50',
              error && 'text-red-500'
            )}
          >
            {label}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
