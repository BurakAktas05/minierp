import React from 'react';

interface JsonViewerProps {
  data?: Record<string, any> | null;
  className?: string;
  emptyText?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  className = '',
  emptyText = 'Özel nitelik tanımlanmamış',
}) => {
  if (!data || Object.keys(data).length === 0) {
    return <span className="text-xs text-slate-400 italic">{emptyText}</span>;
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {Object.entries(data).map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
        >
          <span className="font-medium text-slate-500">{key}:</span>
          <span className="font-semibold text-slate-900">
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </span>
      ))}
    </div>
  );
};
