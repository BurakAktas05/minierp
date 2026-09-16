import React from 'react';
import { Database, Radio, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const { activeTenant, isDemoMode, toggleDemoMode } = useAuth();

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Database className="w-3.5 h-3.5 text-slate-700" />
          <span>Şema:</span>
          <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {activeTenant}
          </span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sistem Hazır</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Offline / Demo Fallback toggle */}
        <button
          onClick={toggleDemoMode}
          title="Backend açık değilken yerel mock verileriyle çalışmak için tıklayın"
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border transition-colors ${
            isDemoMode
              ? 'bg-amber-50 text-amber-900 border-amber-300 font-medium'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {isDemoMode ? (
            <ToggleRight className="w-4 h-4 text-amber-600" />
          ) : (
            <ToggleLeft className="w-4 h-4 text-slate-400" />
          )}
          <span>{isDemoMode ? 'Demo Veri Modu Açık' : 'Canlı API Modu'}</span>
        </button>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
          <Radio className="w-3 h-3 text-slate-400" />
          <span>RabbitMQ Topic Ex.</span>
        </div>
      </div>
    </header>
  );
};
