import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown, X, Check } from 'lucide-react';

export interface Option {
  label: string;
  value: string;
}

export interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  className,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeOption = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <div className={cn('relative w-full text-sm', className)} ref={containerRef}>
      <div
        className={cn(
          'flex min-h-[40px] w-full flex-wrap items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-colors cursor-pointer',
          error && 'border-red-500 focus-within:ring-red-500',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? (
          <span className="text-slate-400 py-0.5">{placeholder}</span>
        ) : (
          selected.map((val) => {
            const opt = options.find((o) => o.value === val);
            return opt ? (
              <span
                key={val}
                className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-slate-800"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => removeOption(e, val)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null;
          })
        )}
        <div className="ml-auto text-slate-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-slate-500">No options found.</div>
          ) : (
            options.map((option) => (
              <div
                key={option.value}
                className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-slate-50"
                onClick={() => toggleOption(option.value)}
              >
                <span className={cn(selected.includes(option.value) && 'font-medium')}>
                  {option.label}
                </span>
                {selected.includes(option.value) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
