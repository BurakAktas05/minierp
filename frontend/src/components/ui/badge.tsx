import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'info' | 'purple';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide border';

  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    outline: 'bg-transparent text-slate-700 border-slate-300',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-50 text-amber-800 border-amber-300',
    destructive: 'bg-rose-50 text-rose-800 border-rose-300',
    info: 'bg-blue-50 text-blue-800 border-blue-300',
    purple: 'bg-indigo-50 text-indigo-800 border-indigo-300',
  }[variant];

  return (
    <span className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </span>
  );
};
