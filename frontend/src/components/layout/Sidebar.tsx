import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Building2,
  FileSpreadsheet,
  ShoppingCart,
  Truck,
  ShieldCheck,
  LogOut,
  Layers,
  Building,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, activeTenant, tenants, switchTenant, logout, isAdmin } = useAuth();

  const navItems = [
    { name: 'Genel Bakış', path: '/', icon: LayoutDashboard },
    { name: 'Stok & Varyantlar', path: '/inventory', icon: Package },
    { name: 'Kategoriler', path: '/categories', icon: FolderTree },
    { name: 'Cari Hesaplar', path: '/partners', icon: Building2 },
    { name: 'B2B Teklifler', path: '/quotations', icon: FileSpreadsheet },
    { name: 'Resmi Siparişler', path: '/orders', icon: ShoppingCart },
    { name: 'İrsaliye & Sevkiyat', path: '/waybills', icon: Truck },
    { name: 'ER & Sistem Şeması', path: '/info', icon: Database },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Denetim Kayıtları', path: '/audit-logs', icon: ShieldCheck });
  }

  const currentTenantObj = tenants.find((t) => t.id === activeTenant);

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
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
          <p className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
            {currentTenantObj ? currentTenantObj.name : activeTenant}
          </p>
        </div>
      </div>

      {/* Tenant Selector Dropdown */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
            <Building className="w-3 h-3" /> Aktif Kiracı
          </span>
          <span className="text-[10px] font-mono text-emerald-400">Şema Aktif</span>
        </div>
        <select
          value={activeTenant}
          onChange={(e) => switchTenant(e.target.value)}
          className="w-full bg-slate-800 text-xs text-slate-200 rounded border border-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-slate-500 font-medium"
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.id})
            </option>
          ))}
        </select>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
          İşletme Modülleri
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-inner border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-xs text-slate-200">
            {user?.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.username}</p>
            <span className="inline-block text-[10px] font-semibold text-slate-400 uppercase">
              {user?.role.replace('ROLE_', '')}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          title="Çıkış Yap"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
