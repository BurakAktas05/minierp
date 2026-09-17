import React from 'react';

/**
 * ============================================================================
 * MiniERP - Badge (Rozet / Durum Etiketi) Bileşeni
 * ============================================================================
 * Kullanım Örneği:
 * 
 * <Badge variant="success">Aktif</Badge>
 * <Badge variant="destructive">İptal</Badge>
 * <Badge variant="info">Gönderildi</Badge>
 * <Badge variant="warning">Beklemede</Badge>
 */

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'purple' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide';

  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    destructive: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    outline: 'bg-transparent text-slate-700 border border-slate-300',
  }[variant];

  return (
    <span className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </span>
  );
};
