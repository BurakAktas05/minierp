import React from 'react';

export interface ErpMetric {
  label: string;
  value: string | number;
  highlight?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export interface ErpSummaryBarProps {
  totalCount: number;
  selectedText?: string;
  metrics?: ErpMetric[];
  className?: string;
}

export const ErpSummaryBar: React.FC<ErpSummaryBarProps> = ({
  totalCount,
  selectedText,
  metrics = [],
  className = '',
}) => {
  return (
    <div
      className={`bg-slate-100 border-x border-b border-slate-300 rounded-b-md px-3 py-1.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3 select-none ${className}`}
    >
      {/* Sol: Kayıt Sayısı & Seçim Durumu */}
      <div className="flex items-center gap-3 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          Kayıt Sayısı: <strong className="font-mono text-slate-900">{totalCount}</strong>
        </span>
        {selectedText && (
          <>
            <span className="text-slate-300">|</span>
            <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {selectedText}
            </span>
          </>
        )}
      </div>

      {/* Sağ: Kurumsal Dip Toplamlar (Tutar, Bakiye vb.) */}
      {metrics.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 font-mono">
          {metrics.map((m, idx) => {
            const colorClass =
              m.highlight === 'success'
                ? 'text-emerald-700'
                : m.highlight === 'warning'
                ? 'text-amber-700'
                : m.highlight === 'danger'
                ? 'text-rose-700'
                : m.highlight === 'info'
                ? 'text-blue-700'
                : 'text-slate-900';

            return (
              <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-500 font-sans">{m.label}:</span>
                <strong className={`font-bold ${colorClass}`}>{m.value}</strong>
                {idx < metrics.length - 1 && <span className="text-slate-300 ml-2">|</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
