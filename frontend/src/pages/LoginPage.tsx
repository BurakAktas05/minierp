import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Building, KeyRound, User as UserIcon, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';

export const LoginPage: React.FC = () => {
  const { login, tenants, createTenant, isLoading } = useAuth();
  const navigate = useNavigate();

  const [tenantId, setTenantId] = useState('tenant_tekstil');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  // New tenant modal state
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [newTenantId, setNewTenantId] = useState('');
  const [newTenantName, setNewTenantName] = useState('');
  const [tenantModalLoading, setTenantModalLoading] = useState(false);

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

  const handleQuickFill = (u: string, p: string, t: string) => {
    setUsername(u);
    setPassword(p);
    setTenantId(t);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantId || !newTenantName) return;
    setTenantModalLoading(true);
    try {
      await createTenant(newTenantId.toLowerCase().replace(/\s+/g, '_'), newTenantName);
      setTenantId(newTenantId.toLowerCase().replace(/\s+/g, '_'));
      setIsTenantModalOpen(false);
      setNewTenantId('');
      setNewTenantName('');
    } catch (err: any) {
      alert('Kiracı oluşturulurken hata: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setTenantModalLoading(false);
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
            {/* Tenant ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" /> Kiracı (Tenant) Şeması
                </label>
                <button
                  type="button"
                  onClick={() => setIsTenantModalOpen(true)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Yeni Kiracı
                </button>
              </div>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-sm"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))}
              </select>
            </div>

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
              Hızlı Rol Testi
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123', 'tenant_tekstil')}
                className="px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Admin (Tüm Yetki)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager', 'manager123', 'tenant_tekstil')}
                className="px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Yönetici (Sipariş)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('user', 'user123', 'tenant_tekstil')}
                className="px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Kullanıcı (Standart)
              </button>
            </div>
          </div>
        </div>

        {/* Security & Multi-tenant note */}
        <div className="text-center mt-6 text-xs text-slate-500">
          <p>JWT & RBAC Güvenlik Mimarisi • Schema-Per-Tenant PostgreSQL İzolasyonu</p>
        </div>
      </div>

      {/* New Tenant Modal */}
      <Dialog
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        title="Yeni Kiracı (Tenant) Şeması Oluştur"
        description="Sistem otomatik olarak PostgreSQL üzerinde izole bir veritabanı şeması ve Flyway migration oluşturacaktır."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTenant} className="space-y-4">
          <Input
            label="Kiracı Kodu (Schema ID)"
            value={newTenantId}
            onChange={(e) => setNewTenantId(e.target.value)}
            placeholder="Örn: tenant_ayakkabi"
            helperText="Yalnızca küçük harf ve alt çizgi kullanınız."
            required
          />
          <Input
            label="Şirket / Kiracı Ticari Unvanı"
            value={newTenantName}
            onChange={(e) => setNewTenantName(e.target.value)}
            placeholder="Örn: Ayakkabı Dünyası San. Tic. A.Ş."
            required
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTenantModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={tenantModalLoading}
            >
              Şemayı Oluştur
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
