import React from 'react';
import { Database, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTurkishStatusLabel } from '../common/StatusBadge';

/**
 * ============================================================================
 * MiniERP - Header (Üst Bilgi Çubuğu)
 * ============================================================================
 * Aktif kiracı şemasını ve canlı API bağlantı durumunu gösterir.
 */

export const Header: React.FC = () => {
  const { activeTenant, user } = useAuth();

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between select-none">
      {/* Sol: Şema ve Durum Bilgisi */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Database className="w-3.5 h-3.5 text-slate-700" />
          <span>Kiracı Şeması:</span>
          <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {activeTenant}
          </span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Backend API Bağlı</span>
        </div>
      </div>

      {/* Sağ: Aktif Kullanıcı & Yetki */}
      <div className="flex items-center gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-mono text-slate-900">{user?.username || 'Giriş Yapılmadı'}</span>
          <span className="text-slate-400">({user?.role ? getTurkishStatusLabel(user.role) : 'Personel'})</span>
        </div>
      </div>
    </header>
  );
};
