'use client';

import { FC, ReactNode } from 'react';
import { cn } from '../lib/utils';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  description?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export const FormField: FC<FormFieldProps> = ({
  label,
  htmlFor,
  description,
  error,
  className,
  children,
}) => {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-start">
        <label 
          htmlFor={htmlFor} 
          className="block text-sm font-medium text-white mb-1 sm:mb-0 sm:w-1/3 sm:pt-2"
        >
          {label}
        </label>
        <div className="sm:w-2/3">
          {children}
          {description && (
            <p className="mt-1 text-xs text-gray-400">{description}</p>
          )}
          {error && (
            <p className="mt-1 text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormField; 