import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  KeyRound,
  User as UserIcon,
  ArrowRight,
  Building,
  ShieldCheck,
  Briefcase,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface TenantOption {
  id: string;
  name: string;
  desc: string;
}

const TENANTS: TenantOption[] = [
  { id: 'tenant_tekstil', name: 'Atlas Tekstil & Dokuma Sanayi A.Ş.', desc: 'Ana B2B ve Üretim Şeması (3 Cari + Ürünler)' },
  { id: 'tenant_aktas', name: 'Aktaş Holding A.Ş.', desc: 'Teknoloji ve Çözüm Portalı Şeması' },
  { id: 'tenant_moda', name: 'Vogue Hazır Giyim & Konfeksiyon Ltd.', desc: 'Perakende ve Hazır Giyim Şeması' },
  { id: 'tenant_perakende', name: 'Trendline Mağazacılık & E-Ticaret A.Ş.', desc: 'E-Ticaret ve Dağıtım Şeması' },
];

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [tenantId, setTenantId] = useState('tenant_tekstil');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(tenantId, username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Giriş yapılamadı. Kullanıcı adı veya şifre hatalı.');
    }
  };

  const handleQuickLogin = async (u: string, p: string, t?: string) => {
    const targetTenant = t || tenantId;
    setUsername(u);
    setPassword(p);
    if (t) setTenantId(t);
    setError(null);
    try {
      await login(targetTenant, u, p);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-950 p-4 select-none">
      {/* Container */}
      <div className="w-full max-w-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-slate-900 text-white items-center justify-center shadow-lg shadow-indigo-500/20 mb-3 border border-indigo-400/30">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            MiniERP Kurumsal Portal
            <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
              v1.0 B2B
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            PostgreSQL Schema-per-Tenant • RabbitMQ Event-Driven ERP Mimarisi
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur p-7 shadow-2xl space-y-5">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tenant Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-400" /> Şirket / Kiracı Şeması (Tenant)
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">● PostgreSQL İzole Şema</span>
              </label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full h-10 text-xs bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                {TENANTS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Username & Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Kullanıcı Adı
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="h-10 text-xs bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Şifre
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 text-xs bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-10 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              isLoading={isLoading}
            >
              <span>Sisteme Giriş Yap</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* DB Test Accounts (Canlı Veritabanı Hesapları) */}
          <div className="pt-5 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Veritabanındaki Canlı Hesaplar (Tek Tıkla Giriş)
              </p>
              <span className="text-[10px] text-slate-500 font-mono">BCrypt Hash</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                disabled={isLoading}
                className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                    👑 Admin
                  </span>
                  <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 px-1 py-0.2 rounded border border-indigo-500/30">
                    ROLE_ADMIN
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">admin / admin123</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">Tam Yetki & Şema Geçişi</div>
              </button>

              {/* 2. Manager */}
              <button
                type="button"
                onClick={() => handleQuickLogin('manager', 'manager123')}
                disabled={isLoading}
                className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    💼 Müdür
                  </span>
                  <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30">
                    ROLE_MANAGER
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">manager / manager123</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">Sipariş Onayı & Finans</div>
              </button>

              {/* 3. User */}
              <button
                type="button"
                onClick={() => handleQuickLogin('user', 'user123')}
                disabled={isLoading}
                className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    👤 Kullanıcı
                  </span>
                  <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/30">
                    ROLE_USER
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">user / user123</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">Teklif & Taslak Girişi</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Multi-tenant note */}
        <div className="text-center mt-5 text-[11px] text-slate-500 space-y-1">
          <p>
            Her kiracı kendi izole PostgreSQL şemasına (<code className="text-slate-400 font-mono">search_path</code>) sahiptir.
          </p>
          <p className="text-slate-600">
            MiniERP • Clean Architecture • Java 21 Spring Boot 3 & React 18
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
