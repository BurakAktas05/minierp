import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Building2,
  FileSpreadsheet,
  ShoppingCart,
  Truck,
  Factory,
  ShieldCheck,
  LogOut,
  Layers,
  Building,
  ChevronDown,
  ChevronRight,
  Settings,
  ReceiptText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, activeTenant, tenants, switchTenant, logout, isAdmin } = useAuth();
  const [setupExpanded, setSetupExpanded] = useState(false);

  // 1. GÜNLÜK OPERASYONEL MODÜLLER (En yüksek kullanım sıklığı)
  const coreOperationalItems = [
    { name: 'Genel Bakış', path: '/', icon: LayoutDashboard },
    { name: 'Siparişler', path: '/orders', icon: ShoppingCart, badge: 'Sipariş' },
    { name: 'İrsaliye & Sevkiyat', path: '/waybills', icon: Truck, badge: 'Lojistik' },
    { name: 'Faturalar & Finans', path: '/invoices', icon: ReceiptText, badge: 'Kasa/Banka' },
    { name: 'Cari Hesaplar', path: '/partners', icon: Building2 },
    { name: 'Stok & Depo', path: '/inventory', icon: Package },
  ];

  // 2. SÜREÇ & PLANLAMA MODÜLLERİ (Orta kullanım sıklığı)
  const planningItems = [
    { name: 'Üretim & Reçete (BOM)', path: '/manufacturing', icon: Factory },
    { name: 'B2B Teklifler', path: '/quotations', icon: FileSpreadsheet },
  ];

  // 3. TANIMLAR & SİSTEM (Nadir kullanılan ayarlar / yapılandırma)
  const systemSetupItems = [
    { name: 'Ürün Kategorileri', path: '/categories', icon: FolderTree },
  ];

  if (isAdmin) {
    systemSetupItems.push({ name: 'Denetim Kayıtları', path: '/audit-logs', icon: ShieldCheck });
  }

  const currentTenantObj = tenants.find((t) => t.id === activeTenant);

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 select-none">
      {/* 1. Logo & Marka Başlığı */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded bg-white text-slate-900 flex items-center justify-center font-bold text-sm shadow-sm">
          <Layers className="w-5 h-5 text-slate-900" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-white">MiniERP</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
              B2B
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
            {currentTenantObj ? currentTenantObj.name : activeTenant}
          </p>
        </div>
      </div>

      {/* 2. Aktif Kiracı (Tenant) Şema Seçici */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
            <Building className="w-3 h-3" /> Kiracı Şeması
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">● Aktif</span>
        </div>
        <select
          value={activeTenant}
          onChange={(e) => switchTenant(e.target.value)}
          className="w-full bg-slate-800 text-xs text-slate-200 rounded border border-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-slate-500 font-medium cursor-pointer"
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.id})
            </option>
          ))}
        </select>
      </div>

      {/* 3. Sayfa Navigasyon Bağlantıları (Kullanım Hiyerarşisiyle Gruplanmış) */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
        {/* GRUP 1: GÜNLÜK OPERASYONLAR */}
        <div>
          <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5 flex items-center justify-between">
            <span>Operasyonel İşlemler</span>
            <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">Günlük</span>
          </p>
          <div className="space-y-0.5">
            {coreOperationalItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50 font-normal">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* GRUP 2: PLANLAMA & ÜRETİM */}
        <div>
          <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
            Planlama & Üretim
          </p>
          <div className="space-y-0.5">
            {planningItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* GRUP 3: TANIMLAR & SİSTEM (Nadir Kullanılanlar - Açılır/Kapanır) */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setSetupExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 uppercase tracking-wider rounded hover:bg-slate-800/40 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-slate-400" /> Tanımlar & Sistem
            </span>
            {setupExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {setupExpanded && (
            <div className="mt-1 pl-2 space-y-0.5 animate-fadeIn">
              {systemSetupItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* 4. Kullanıcı Profili ve Çıkış Butonu */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-xs text-slate-200">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.username}</p>
            <span className="inline-block text-[10px] font-semibold text-slate-400 uppercase">
              {user?.role ? user.role.replace('ROLE_', '') : 'USER'}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          title="Çıkış Yap"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
