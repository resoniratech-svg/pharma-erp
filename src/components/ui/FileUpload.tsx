import React, { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { UploadCloud, X } from 'lucide-react';

export interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean;
  onFileSelect?: (file: File | null) => void;
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ className, error, onFileSelect, disabled, ...props }, ref) => {
    const [fileName, setFileName] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setFileName(file ? file.name : null);
      if (onFileSelect) {
        onFileSelect(file);
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.preventDefault();
      setFileName(null);
      if (onFileSelect) onFileSelect(null);
    };

    return (
      <div className={cn('w-full', className)}>
        {!fileName ? (
          <label
            className={cn(
              'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 border-slate-300 hover:bg-slate-100 transition-colors',
              error && 'border-red-500 bg-red-50',
              disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
              <UploadCloud className="w-8 h-8 mb-2" />
              <p className="mb-1 text-sm font-semibold">Click to upload or drag and drop</p>
              <p className="text-xs">SVG, PNG, JPG or PDF</p>
            </div>
            <input
              type="file"
              className="hidden"
              disabled={disabled}
              onChange={handleChange}
              ref={ref}
              {...props}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between p-4 border border-slate-300 rounded-lg bg-white shadow-sm">
            <span className="text-sm text-slate-700 truncate mr-2 font-medium">{fileName}</span>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 text-slate-500 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }
);
FileUpload.displayName = 'FileUpload';
