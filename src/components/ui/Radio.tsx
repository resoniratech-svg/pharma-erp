import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  error?: boolean;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <label className="group flex items-center space-x-2 cursor-pointer">
        <div className="relative flex items-center">
          <input
            type="radio"
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-checked:border-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              error && 'border-red-500',
              className
            )}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-primary opacity-0 transition-opacity peer-checked:opacity-100 peer-disabled:bg-slate-400" />
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
Radio.displayName = 'Radio';
