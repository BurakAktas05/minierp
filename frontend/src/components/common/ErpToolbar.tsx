import React from 'react';
import { Search, RefreshCw, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export interface ErpToolbarAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'outline' | 'secondary' | 'destructive';
  disabled?: boolean;
  title?: string;
}

export interface ErpToolbarProps {
  title: string;
  subtitle?: string;
  actions?: ErpToolbarAction[];
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

export const ErpToolbar: React.FC<ErpToolbarProps> = ({
  title,
  subtitle,
  actions = [],
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Hızlı arama yapın...',
  onRefresh,
  children,
}) => {
  return (
    <div className="bg-slate-100 border border-slate-300 rounded-t-md p-2.5 flex flex-col gap-2.5 select-none shadow-xs">
      {/* Üst Satır: Başlık & Fonksiyonel Aksiyon Düğmeleri (DİA ERP Toolbar) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-slate-700"></span>
            {title}
          </h2>
          {subtitle && <span className="text-[11px] text-slate-500">({subtitle})</span>}
        </div>

        {/* Buton Grubu */}
        <div className="flex flex-wrap items-center gap-1.5">
          {actions.map((act, idx) => (
            <Button
              key={idx}
              size="sm"
              variant={act.variant || 'outline'}
              onClick={act.onClick}
              disabled={act.disabled}
              title={act.title}
              className={`h-7 px-2.5 text-xs font-medium gap-1.5 border-slate-300 shadow-2xs ${
                act.variant === 'primary'
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700'
              } ${act.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {act.icon}
              <span>{act.label}</span>
            </Button>
          ))}

          {onRefresh && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              title="Yenile (F5)"
              className="h-7 px-2 text-xs bg-white hover:bg-slate-50 border-slate-300 text-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Alt Satır: Arama & Özel Filtreler */}
      {(onSearchChange !== undefined || children) && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
          {onSearchChange !== undefined ? (
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-7 pl-8 pr-3 text-xs bg-white border border-slate-300 rounded-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
              />
            </div>
          ) : (
            <div />
          )}

          {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
      )}
    </div>
  );
};
