import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, ToastType } from '../../context/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          containerClass: 'bg-white border-l-4 border-l-emerald-500 border-slate-200 text-slate-900 shadow-lg',
          titleClass: 'text-emerald-900 font-bold',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          containerClass: 'bg-white border-l-4 border-l-rose-500 border-slate-200 text-slate-900 shadow-lg',
          titleClass: 'text-rose-900 font-bold',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          containerClass: 'bg-white border-l-4 border-l-amber-500 border-slate-200 text-slate-900 shadow-lg',
          titleClass: 'text-amber-900 font-bold',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
          containerClass: 'bg-white border-l-4 border-l-blue-500 border-slate-200 text-slate-900 shadow-lg',
          titleClass: 'text-blue-900 font-bold',
        };
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3"
    >
      {toasts.map((toast) => {
        const config = getToastConfig(toast.type);

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-md border text-xs transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${config.containerClass}`}
          >
            {config.icon}
            <div className="flex-1 min-w-0">
              {toast.title && <div className={`text-xs ${config.titleClass} mb-0.5`}>{toast.title}</div>}
              <div className="text-slate-700 leading-relaxed break-words font-medium">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded-xs transition-colors shrink-0"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
