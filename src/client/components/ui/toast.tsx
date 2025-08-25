import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  onDismiss: (id: string) => void;
}

const variantStyles = {
  default: 'bg-white border-gray-200 text-gray-900',
  destructive: 'bg-red-50 border-red-200 text-red-900',
  success: 'bg-green-50 border-green-200 text-green-900'
};

const iconStyles = {
  default: 'text-gray-400 hover:text-gray-600',
  destructive: 'text-red-400 hover:text-red-600',
  success: 'text-green-400 hover:text-green-600'
};

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = 'default',
  onDismiss
}) => {
  return (
    <div
      className={cn(
        'flex w-full max-w-sm items-start space-x-4 rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out',
        variantStyles[variant]
      )}
    >
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-medium leading-none">{title}</h4>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors',
          iconStyles[variant]
        )}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Закрыть</span>
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{
  toasts: Array<{
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
  }>;
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};
