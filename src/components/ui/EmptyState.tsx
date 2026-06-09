import { cn } from '../../utils/cn';
import { FileQuestion } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  className,
  title,
  description,
  icon,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-full p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-lg',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-slate-100 text-slate-500">
        {icon || <FileQuestion className="w-6 h-6" />}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mb-4 text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
