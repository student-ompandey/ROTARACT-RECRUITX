import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      primary:
        'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-900/50 active:bg-blue-700',
      secondary:
        'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 active:bg-slate-850',
      outline:
        'border border-slate-700 hover:border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800/60 active:bg-slate-800',
      ghost:
        'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-slate-100',
      danger:
        'bg-red-900/40 border border-red-800/80 text-red-300 hover:bg-red-800/50 hover:text-red-200',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-9 px-4 text-xs font-medium rounded-lg gap-2',
      lg: 'h-11 px-6 text-sm font-medium rounded-lg gap-2.5',
      icon: 'h-9 w-9 rounded-lg p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
