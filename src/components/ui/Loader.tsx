import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
}

export function Loader({ className, size = 'md', fullScreen = false, ...props }: LoaderProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const loaderContent = (
    <div
      className={cn('flex flex-col items-center justify-center space-y-2 text-primary', className)}
      {...props}
    >
      <Loader2 className={cn('animate-spin', sizes[size])} />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
}
