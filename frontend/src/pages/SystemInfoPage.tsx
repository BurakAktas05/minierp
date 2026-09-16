import React, { useState } from 'react';
import {
  Database,
  Layers,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Server,
  Code2,
  ExternalLink,
  CheckCircle2,
  Package,
  ShoppingCart,
  Truck,
  Building2,
  FileSpreadsheet,
  Users,
  Activity,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export const SystemInfoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'er' | 'workflow' | 'architecture' | 'api'>('er');

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const tables = [
    {
      name: 'tenants',
      schema: 'public (Master)',
      icon: Layers,
      desc: 'Sistemdeki kiracı şirketler ve dinamik PostgreSQL şema adları.',
      keys: ['id (PK)', 'tenant_id (UK)', 'schema_name (UK)', 'company_name', 'is_active'],
    },
    {
      name: 'categories',
      schema: 'tenant_*',
      icon: Database,
      desc: 'Ürün kategorileri ve hiyerarşik sınıflandırma.',
      keys: ['id (PK)', 'code (UK)', 'name', 'description'],
    },
    {
      name: 'products',
      schema: 'tenant_*',
      icon: Package,
      desc: 'Ana ürün şablon kartları, KDV oranları ve dinamik JSONB özellikleri.',
      keys: ['id (PK)', 'category_id (FK)', 'code (UK)', 'name', 'base_unit', 'tax_rate', 'attributes (JSONB)'],
    },
    {
      name: 'product_variants',
      schema: 'tenant_*',
      icon: Package,
      desc: 'Stok tutulan satılabilir fiziksel varyantlar (SKU, Renk, Beden, Fiyat, Stok).',
      keys: ['id (PK)', 'product_id (FK)', 'sku (UK)', 'barcode', 'purchase_price', 'sale_price', 'stock_quantity', 'reserved_stock'],
    },
    {
      name: 'business_partners',
      schema: 'tenant_*',
      icon: Building2,
      desc: 'Cari hesaplar: Müşteriler, Tedarikçiler ve Vergi/İletişim detayları.',
      keys: ['id (PK)', 'partner_type', 'name', 'tax_number', 'email', 'phone', 'metadata (JSONB)'],
    },
    {
      name: 'quotations & items',
      schema: 'tenant_*',
      icon: FileSpreadsheet,
      desc: 'B2B Alış ve Satış Teklifleri ve teklif satır kalemleri.',
      keys: ['quotation_id (PK)', 'partner_id (FK)', 'status', 'total_amount', 'variant_id (FK)', 'quantity'],
    },
    {
      name: 'orders & items',
      schema: 'tenant_*',
      icon: ShoppingCart,
      desc: 'Resmi Siparişler. Tekliften türetilebilir; onaylandığında stok rezerve eder.',
      keys: ['order_id (PK)', 'partner_id (FK)', 'quotation_id (FK)', 'status', 'total_amount', 'variant_id (FK)'],
    },
    {
      name: 'waybills & items',
      schema: 'tenant_*',
      icon: Truck,
      desc: 'Sevk ve Kabul İrsaliyeleri. Sevk edildiğinde depodan fiili stok düşer.',
      keys: ['waybill_id (PK)', 'partner_id (FK)', 'order_id (FK)', 'status', 'tracking_number', 'variant_id (FK)'],
    },
    {
      name: 'users',
      schema: 'tenant_*',
      icon: Users,
      desc: 'Kiracı bazlı kullanıcı kimlik ve rol yetkilendirmesi (RBAC).',
      keys: ['id (PK)', 'username (UK)', 'email (UK)', 'role (ADMIN/MANAGER/USER)', 'is_active'],
    },
    {
      name: 'audit_logs',
      schema: 'tenant_*',
      icon: Activity,
      desc: 'Kritik durum ve veri değişikliklerinin JSON diff ile saklandığı denetim kaydı.',
      keys: ['id (PK)', 'action', 'entity_type', 'entity_id', 'performed_by', 'details (JSONB)', 'performed_at'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Architecture & Data Model
            </span>
            <span className="text-xs text-slate-400">PostgreSQL 16 Multi-Tenant</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sistem Mimarisi & Varlık-İlişki (ER) Modeli
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            MiniERP Schema-per-Tenant veritabanı şeması, modül ilişkileri ve uçtan uca B2B süreç akışı.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`${backendUrl}/bilgilendirme`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Canlı Bilgilendirme API'si
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('er')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'er'
              ? 'border-sky-500 text-sky-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Veritabanı Tabloları (ER)
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'workflow'
              ? 'border-sky-500 text-sky-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          İşleyiş & Süreç Akışı
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'architecture'
              ? 'border-sky-500 text-sky-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Multi-Tenancy & Mimari
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'api'
              ? 'border-sky-500 text-sky-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          API & Canlı Yayın (Railway)
        </button>
      </div>

      {/* Tab 1: ER Diyagramı ve Tablolar */}
      {activeTab === 'er' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((t) => {
              const Icon = t.icon;
              return (
                <Card key={t.name} className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-sky-500/10 text-sky-400 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <CardTitle className="text-sm font-bold text-white font-mono">{t.name}</CardTitle>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {t.schema}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-xs text-slate-400 mb-3">{t.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.keys.map((k) => (
                        <span
                          key={k}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            k.includes('PK')
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 font-semibold'
                              : k.includes('FK')
                              ? 'bg-sky-500/10 text-sky-300 border-sky-500/30 font-semibold'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Süreç Akışı (Order-to-Cash) */}
      {activeTab === 'workflow' && (
        <div className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-sky-400" /> Uçtan Uca B2B Sipariş ve Sevkiyat Döngüsü
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-sky-500 border-4 border-slate-900"></div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-sky-400">
                  Adım 1: Cari ve Ürün Varyantı Tanımlama
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Müşteri veya Tedarikçi cari hesabı açılır. Ürün ana şablonu (Tişört vb.) oluşturulup altına SKU varyantları (Kırmızı-M vb.) tanımlanır.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-sky-500 border-4 border-slate-900"></div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-sky-400">
                  Adım 2: Teklif (Quotation) Hazırlama
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Müşteriye adet, birim fiyat ve KDV/iskonto içeren teklif iletilir. Müşteri teklifi kabul ettiğinde tek tıkla siparişe dönüştürülür.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-slate-900"></div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-400">
                  Adım 3: Sipariş Onayı & Otomatik Stok Rezervasyonu
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Yönetici siparişi onayladığında sistem depoda yeterli stok olup olmadığını denetler. İlgili varyantların <span className="text-emerald-400 font-mono">reserved_stock</span> miktarı artırılır ve RabbitMQ üzerinden asenkron olay fırlatılır.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-amber-500 border-4 border-slate-900"></div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-amber-400">
                  Adım 4: İrsaliye (Waybill) & Depodan Fiili Çıkış
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Sevkiyat günü irsaliye oluşturulur ve sevk edildiğinde <span className="text-amber-400 font-mono">reserved_stock</span> düşürülürken depodaki fiili <span className="text-amber-400 font-mono">stock_quantity</span> eksiltilir.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900"></div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-indigo-400">
                  Adım 5: Denetim ve İzlenebilirlik (Audit Logging)
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Her kritik işlem kimin tarafından ne zaman yapıldığı bilgisiyle JSONB diff şeklinde <span className="text-indigo-400 font-mono">audit_logs</span> tablosuna yazılır.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Multi-Tenancy Mimarisi */}
      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900/80 border-slate-800 p-6">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" /> Schema-per-Tenant Çoklu Kiracılık
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              MiniERP, PostgreSQL üzerinde paylaşımlı tek bir veritabanı içerisinde her kiracı için izole bir veritabanı şeması (<code className="text-sky-400 font-mono">tenant_*</code>) tahsis eder.
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>Veri Güvenliği:</strong> Bir kiracının verisi diğerinin şemasından tamamen izoledir.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>Dinamik Çözümleme:</strong> Gelen her istekte JWT veya X-Tenant-ID header'ı üzerinden şema otomatik switch edilir.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>Flyway Entegrasyonu:</strong> Yeni kiracı oluşturulduğunda şeması Flyway ile anında migrate edilir.</span>
              </li>
            </ul>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800 p-6">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Güvenlik ve RBAC
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Stateless JWT mimarisi kullanılarak kimlik doğrulama sağlanır. Kullanıcı rolleri operasyonel güvenliği garanti eder:
            </p>
            <div className="space-y-2">
              <div className="p-2.5 rounded bg-slate-800/60 border border-slate-700/60 text-xs">
                <span className="font-bold text-rose-400">ROLE_ADMIN:</span> Tüm kiracıları yönetir, denetim (audit) loglarını inceler.
              </div>
              <div className="p-2.5 rounded bg-slate-800/60 border border-slate-700/60 text-xs">
                <span className="font-bold text-amber-400">ROLE_MANAGER:</span> Siparişleri onaylayabilir veya iptal edebilir, stok kilitler.
              </div>
              <div className="p-2.5 rounded bg-slate-800/60 border border-slate-700/60 text-xs">
                <span className="font-bold text-sky-400">ROLE_USER:</span> Teklif hazırlar, ürün ve cari kayıtlarını oluşturur.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: API & Railway Bilgisi */}
      {activeTab === 'api' && (
        <Card className="bg-slate-900/80 border-slate-800 p-6">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-400" /> Railway & Canlı Yayın Bilgilendirmesi
          </h3>
          <p className="text-xs text-slate-300 mb-4">
            Backend servisinizi Railway üzerinde çalıştırdığınızda aşağıdaki ortam değişkenlerini (Environment Variables) tanımlamanız yeterlidir:
          </p>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-sky-300 space-y-1 overflow-x-auto">
            <p><span className="text-slate-500"># PostgreSQL (Örn: Neon.tech veya Railway Postgres)</span></p>
            <p>SPRING_DATASOURCE_URL=jdbc:postgresql://ep-xyz.neon.tech/minierp_db?sslmode=require</p>
            <p>SPRING_DATASOURCE_USERNAME=senin_kullanicin</p>
            <p>SPRING_DATASOURCE_PASSWORD=senin_sifren</p>
            <p className="pt-2"><span className="text-slate-500"># RabbitMQ (Örn: CloudAMQP)</span></p>
            <p>SPRING_RABBITMQ_HOST=lemur.cloudamqp.com</p>
            <p>SPRING_RABBITMQ_PORT=5672</p>
            <p>SPRING_RABBITMQ_USERNAME=senin_kullanicin</p>
            <p>SPRING_RABBITMQ_PASSWORD=senin_sifren</p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Public Bilgilendirme Uç Noktası:</span>
            <code className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
              GET /bilgilendirme
            </code>
          </div>
        </Card>
      )}
    </div>
  );
};
