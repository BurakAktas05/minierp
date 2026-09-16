import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50 disabled:pointer-events-none rounded-md select-none';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    lg: 'h-10 px-5 text-sm gap-2',
  }[size];

  const variantStyles = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-sm active:bg-slate-950',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200 shadow-sm active:bg-slate-300',
    outline: 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-300 shadow-sm active:bg-slate-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700 border border-red-600 shadow-sm active:bg-red-800',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
