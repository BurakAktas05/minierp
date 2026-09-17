import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, KeyRound, User as UserIcon, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

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
      setError(err.response?.data?.message || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
    }
  };

  const handleQuickLogin = async (u: string, p: string, t: string) => {
    setUsername(u);
    setPassword(p);
    setTenantId(t);
    setError(null);
    try {
      await login(t, u, p);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-100 p-4 select-none">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-lg bg-slate-900 text-white items-center justify-center shadow-md mb-3">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">MiniERP Kurumsal Portal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Çok Kiracılı (Multi-Tenant) B2B Kaynak ve Süreç Yönetimi
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" /> Kullanıcı Adı
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Örn: admin"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" /> Şifre
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 h-10 text-sm font-semibold"
              isLoading={isLoading}
            >
              <span>Sisteme Giriş Yap</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Demo Quick Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Hızlı Şirket Seçimi & Giriş
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123', 'tenant_aktas')}
                disabled={isLoading}
                className="px-2 py-2 rounded border border-indigo-200 bg-indigo-50/70 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all text-center shadow-xs cursor-pointer disabled:opacity-50"
              >
                ⚡ Aktaş Holding (Çözüm)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123', 'tenant_moda')}
                disabled={isLoading}
                className="px-2 py-2 rounded border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all text-center shadow-xs cursor-pointer disabled:opacity-50"
              >
                ⚡ Vogue (Üretim)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123', 'tenant_tekstil')}
                disabled={isLoading}
                className="px-2 py-2 rounded border border-emerald-200 bg-emerald-50/70 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all text-center shadow-xs cursor-pointer disabled:opacity-50"
              >
                ⚡ Atlas (100+ Cari)
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
              <span>Şifreler: <strong>admin123</strong> / <strong>manager123</strong> / <strong>user123</strong></span>
            </div>
          </div>
        </div>

        {/* Security & Multi-tenant note */}
        <div className="text-center mt-6 text-xs text-slate-500">
          <p>JWT & RBAC Güvenlik Mimarisi • Çok Kiracılı Kurumsal ERP</p>
        </div>
      </div>
    </div>
  );
};
