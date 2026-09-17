import React, { useState, useEffect, useMemo } from 'react';
import {
  Factory,
  Layers,
  Play,
  CheckCircle2,
  Clock,
  Plus,
  Boxes,
  Eye,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { manufacturingApi } from '../api/manufacturingApi';
import { inventoryApi } from '../api/inventoryApi';
import { useToast } from '../context/ToastContext';
import {
  BillOfMaterials,
  WorkOrder,
  WorkOrderStatus,
  ProductVariant,
  CreateWorkOrderRequest,
  CreateBomRequest,
} from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErpToolbar } from '../components/common/ErpToolbar';
import { ErpDataGrid, Column } from '../components/common/ErpDataGrid';
import { ErpSummaryBar } from '../components/common/ErpSummaryBar';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const ManufacturingPage: React.FC = () => {
  const { toast } = useToast();
  const [boms, setBoms] = useState<BillOfMaterials[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);

  // Nav tab
  const [activeTab, setActiveTab] = useState<'WORK_ORDERS' | 'BOMS'>('WORK_ORDERS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WorkOrderStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Detail Modals
  const [selectedWo, setSelectedWo] = useState<WorkOrder | null>(null);
  const [selectedBom, setSelectedBom] = useState<BillOfMaterials | null>(null);

  // Create Modals
  const [isNewWoOpen, setIsNewWoOpen] = useState(false);
  const [isNewBomOpen, setIsNewBomOpen] = useState(false);

  // New WO Form State
  const [newWoBomId, setNewWoBomId] = useState<number | ''>('');
  const [newWoQty, setNewWoQty] = useState<number>(10);
  const [newWoPriority, setNewWoPriority] = useState('NORMAL');
  const [newWoNotes, setNewWoNotes] = useState('');

  // New BOM Form State
  const [newBomName, setNewBomName] = useState('');
  const [newBomVariantId, setNewBomVariantId] = useState<number | ''>('');
  const [newBomQuantity, setNewBomQuantity] = useState<number>(1);
  const [newBomUnit, setNewBomUnit] = useState('ADET');
  const [newBomIndustry, setNewBomIndustry] = useState('TEXTILE');
  const [newBomItems, setNewBomItems] = useState<Array<{ componentVariantId: number; quantity: number; unit: string }>>([]);
  const [selectedCompVariantId, setSelectedCompVariantId] = useState<number | ''>('');
  const [selectedCompQty, setSelectedCompQty] = useState<number>(1);
  const [selectedCompUnit, setSelectedCompUnit] = useState('METRE');

  const loadData = async () => {
    try {
      setLoading(true);
      const [bomsData, woData, invData] = await Promise.all([
        manufacturingApi.getBoms(),
        manufacturingApi.getWorkOrders(),
        inventoryApi.getProducts(),
      ]);
      setBoms(bomsData);
      setWorkOrders(woData);

      // Flatten variants for selection dropdowns
      const allVars: ProductVariant[] = [];
      invData.forEach((p) => {
        if (p.variants) allVars.push(...p.variants);
      });
      setVariants(allVars);
    } catch (err) {
      console.error('Veriler yüklenirken hata oluştu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update WO status
  const handleUpdateWoStatus = async (woId: number, newStatus: WorkOrderStatus) => {
    try {
      await manufacturingApi.updateWorkOrderStatus(woId, newStatus);
      toast.success(`İş emri durumu güncellendi: ${newStatus}`);
      await loadData();
      if (selectedWo && selectedWo.id === woId) {
        const updated = await manufacturingApi.getWorkOrderById(woId);
        setSelectedWo(updated);
      }
    } catch (err: any) {
      toast.error('İş emri durumu güncellenirken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Submit New WO
  const handleCreateWo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWoBomId || newWoQty <= 0) {
      toast.warning('Lütfen geçerli bir reçete ve miktar girin');
      return;
    }
    try {
      const payload: CreateWorkOrderRequest = {
        bomId: Number(newWoBomId),
        plannedQuantity: newWoQty,
        priority: newWoPriority,
        notes: newWoNotes,
      };
      await manufacturingApi.createWorkOrder(payload);
      toast.success('Yeni iş emri başarıyla oluşturuldu.');
      setIsNewWoOpen(false);
      setNewWoNotes('');
      await loadData();
    } catch (err: any) {
      toast.error('İş emri oluşturulurken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Submit New BOM
  const handleCreateBom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBomName || !newBomVariantId || newBomItems.length === 0) {
      toast.warning('Lütfen reçete adı, üretilecek mamul ve en az 1 sarfiyat kalemi ekleyiniz.');
      return;
    }
    try {
      const payload: CreateBomRequest = {
        bomCode: `BOM-${Date.now().toString().slice(-6)}`,
        name: newBomName,
        variantId: Number(newBomVariantId),
        quantity: newBomQuantity,
        unit: newBomUnit,
        industryType: newBomIndustry,
        items: newBomItems.map((it) => ({
          componentVariantId: it.componentVariantId,
          quantity: it.quantity,
          unit: it.unit,
        })),
      };
      await manufacturingApi.createBom(payload);
      toast.success('Üretim reçetesi (BOM) başarıyla oluşturuldu.');
      setIsNewBomOpen(false);
      setNewBomName('');
      setNewBomItems([]);
      await loadData();
    } catch (err: any) {
      toast.error('Reçete oluşturulurken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddComponentItem = () => {
    if (!selectedCompVariantId || selectedCompQty <= 0) {
      toast.warning('Lütfen sarf edilecek hammaddeyi ve miktarı seçin.');
      return;
    }
    setNewBomItems((prev) => [
      ...prev,
      {
        componentVariantId: Number(selectedCompVariantId),
        quantity: selectedCompQty,
        unit: selectedCompUnit,
      },
    ]);
    setSelectedCompVariantId('');
    setSelectedCompQty(1);
  };

  // Filtered Work Orders
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter;
      const matchesSearch =
        wo.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wo.bomName && wo.bomName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (wo.productVariantName && wo.productVariantName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [workOrders, statusFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const totalBoms = boms.length;
    const activeWo = workOrders.filter((w) => w.status === 'PLANNED' || w.status === 'IN_PROGRESS').length;
    const completedWo = workOrders.filter((w) => w.status === 'COMPLETED').length;
    const totalProduced = workOrders.reduce((acc, w) => acc + (Number(w.producedQuantity) || 0), 0);
    return { totalBoms, activeWo, completedWo, totalProduced };
  }, [boms, workOrders]);

  // Grid Columns for Work Orders
  const woColumns: Column<WorkOrder>[] = [
    {
      id: 'orderNumber',
      header: 'İş Emri No',
      width: '160px',
      accessor: (row: WorkOrder) => (
        <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
          <Factory className="w-3.5 h-3.5 text-slate-500" />
          {row.orderNumber}
        </span>
      ),
    },
    {
      id: 'bomName',
      header: 'Üretim Reçetesi (BOM) & Hedef Mamul',
      accessor: (row: WorkOrder) => (
        <div>
          <div className="font-semibold text-slate-900">{row.bomName || row.bomCode || 'Reçete'}</div>
          <div className="text-xs text-slate-500">{row.productVariantName || row.productVariantSku}</div>
        </div>
      ),
    },
    {
      id: 'plannedQuantity',
      header: 'Miktar (Üretilen / Planlanan)',
      width: '180px',
      accessor: (row: WorkOrder) => (
        <div className="font-mono text-xs">
          <span className="text-emerald-700 font-bold">{row.producedQuantity || 0}</span>
          <span className="text-slate-400"> / </span>
          <span className="text-slate-800 font-semibold">{row.plannedQuantity} Adet</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Durum',
      width: '130px',
      align: 'center',
      accessor: (row: WorkOrder) => <StatusBadge status={row.status} />,
    },
    {
      id: 'priority',
      header: 'Öncelik',
      width: '100px',
      align: 'center',
      accessor: (row: WorkOrder) => {
        const isUrgent = row.priority === 'URGENT' || row.priority === 'HIGH';
        return (
          <span
            className={`px-2 py-0.5 text-xs rounded font-medium border ${
              isUrgent
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {row.priority}
          </span>
        );
      },
    },
    {
      id: 'startDate',
      header: 'Tarih',
      width: '120px',
      accessor: (row: WorkOrder) => <span className="text-xs text-slate-600 font-mono">{formatDate(row.startDate)}</span>,
    },
    {
      id: 'actions',
      header: 'İşlemler',
      width: '210px',
      align: 'right',
      accessor: (row: WorkOrder) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedWo(row)}
            className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 mr-1" /> Detay
          </Button>

          {row.status === 'PLANNED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdateWoStatus(row.id, 'IN_PROGRESS')}
              className="h-7 px-2 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50 cursor-pointer"
            >
              <Play className="w-3 h-3 mr-1" /> Başlat
            </Button>
          )}

          {row.status === 'IN_PROGRESS' && (
            <Button
              size="sm"
              onClick={() => handleUpdateWoStatus(row.id, 'COMPLETED')}
              className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" /> Tamamla
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Üst Başlık & Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Factory className="w-6 h-6 text-indigo-600" />
            Üretim Reçeteleri (BOM) & İş Emirleri
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ürün reçeteleri (BOM), hammadde sarfiyatı ve üretim operasyonları takibi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsNewBomOpen(true)}
            className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-600" /> + Yeni Reçete (BOM)
          </Button>
          <Button
            onClick={() => setIsNewWoOpen(true)}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> + Yeni İş Emri Aç
          </Button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Tanımlı BOM Reçeteleri</div>
            <div className="text-lg font-bold text-slate-900">
              {stats.totalBoms} <span className="text-xs font-normal text-slate-500">Adet</span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Aktif İş Emirleri</div>
            <div className="text-lg font-bold text-amber-700">
              {stats.activeWo} <span className="text-xs font-normal text-slate-500">Fiş</span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Tamamlanan Üretim</div>
            <div className="text-lg font-bold text-emerald-700">
              {stats.completedWo} <span className="text-xs font-normal text-slate-500">Fiş</span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Toplam Üretilen</div>
            <div className="text-lg font-bold text-indigo-700">
              {stats.totalProduced} <span className="text-xs font-normal text-slate-500">Adet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ana Sekmeler (İş Emirleri / Reçeteler) */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('WORK_ORDERS')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'WORK_ORDERS'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Factory className="w-3.5 h-3.5" /> Üretim İş Emirleri ({workOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('BOMS')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'BOMS'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Üretim Reçeteleri (BOM) ({boms.length})
        </button>
      </div>

      {/* SEKME 1: İŞ EMİRLERİ LİSTESİ */}
      {activeTab === 'WORK_ORDERS' && (
        <div className="space-y-0">
          <ErpToolbar
            title="Üretim İş Emirleri"
            subtitle="İmalat ve Operasyon Takibi"
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="İş emri no, reçete veya ürün adı ara..."
            onRefresh={loadData}
            actions={[
              {
                label: 'Yeni İş Emri Aç',
                icon: <Plus className="w-3.5 h-3.5 text-white" />,
                onClick: () => setIsNewWoOpen(true),
                variant: 'primary',
              },
            ]}
          >
            <div className="flex items-center gap-1 text-xs">
              {[
                { key: 'ALL', label: 'Tümü' },
                { key: 'PLANNED', label: 'Planlandı' },
                { key: 'IN_PROGRESS', label: 'Üretimde' },
                { key: 'COMPLETED', label: 'Tamamlandı' },
                { key: 'CANCELLED', label: 'İptal' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as any)}
                  className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                    statusFilter === tab.key
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </ErpToolbar>

          <ErpDataGrid
            data={filteredWorkOrders}
            columns={woColumns}
            keyExtractor={(wo) => wo.id}
            selectedId={selectedWo?.id}
            onSelectRow={(wo) => setSelectedWo(wo)}
            loading={loading}
            emptyMessage="Kriterlere uygun üretim iş emri bulunamadı."
          />

          <ErpSummaryBar
            totalCount={filteredWorkOrders.length}
            metrics={[
              { label: 'Aktif Fiş', value: stats.activeWo, highlight: 'warning' },
              { label: 'Tamamlanan', value: stats.completedWo, highlight: 'success' },
              { label: 'Toplam İmalat', value: `${stats.totalProduced} Adet`, highlight: 'info' },
            ]}
          />
        </div>
      )}

      {/* SEKME 2: REÇETELER (BOM) LİSTESİ */}
      {activeTab === 'BOMS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boms.map((bom) => (
            <div
              key={bom.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-400 hover:shadow-xs transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                    {bom.bomCode}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                    {bom.industryType || 'GENERIC'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {bom.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <Boxes className="w-3.5 h-3.5 text-slate-400" />
                  Hedef Mamul: <span className="text-slate-900 font-semibold">{bom.variantName || bom.variantSku}</span>
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Sarfiyat Kalemleri ({bom.items?.length || 0})</span>
                    <span className="text-slate-400 text-[11px]">1 {bom.unit} Üretim İçin</span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {bom.items?.map((it, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-slate-50 p-2 rounded flex items-center justify-between border border-slate-200/80"
                      >
                        <span className="text-slate-700 truncate max-w-[180px] font-medium">
                          {it.componentName || it.componentSku}
                        </span>
                        <span className="font-mono text-slate-900 font-bold">
                          {it.quantity} {it.unit}
                          {Number(it.scrapRate) > 0 && (
                            <span className="text-amber-600 text-[10px] ml-1 font-normal">(+% {it.scrapRate})</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedBom(bom)}
                  className="w-full text-xs border-slate-200 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Reçete Detayı & Ağaç Yapısı
                </Button>
              </div>
            </div>
          ))}

          {boms.length === 0 && !loading && (
            <div className="col-span-full p-12 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
              Henüz kayıtlı üretim reçetesi (BOM) bulunmuyor. Yukarıdaki "+ Yeni Reçete (BOM)" butonuyla ekleyebilirsiniz.
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: YENİ İŞ EMRİ AÇ */}
      <Dialog
        isOpen={isNewWoOpen}
        onClose={() => setIsNewWoOpen(false)}
        title="Yeni Üretim İş Emri (Work Order) Aç"
        maxWidth="md"
      >
        <form onSubmit={handleCreateWo} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Üretim Reçetesi (BOM) *
            </label>
            <select
              value={newWoBomId}
              onChange={(e) => setNewWoBomId(Number(e.target.value))}
              required
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="">-- Reçete Seçiniz --</option>
              {boms.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bomCode} - {b.name} ({b.variantName || b.variantSku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Planlanan Miktar *
              </label>
              <Input
                type="number"
                min="1"
                value={newWoQty}
                onChange={(e) => setNewWoQty(Number(e.target.value))}
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Öncelik
              </label>
              <select
                value={newWoPriority}
                onChange={(e) => setNewWoPriority(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="LOW">Düşük</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Yüksek</option>
                <option value="URGENT">Acil</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              İş Emri Notları
            </label>
            <Input
              value={newWoNotes}
              onChange={(e) => setNewWoNotes(e.target.value)}
              placeholder="Örn: Hafta sonu teslimatı için acil üretim hattına sevk."
              className="text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsNewWoOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-medium">
              İş Emrini Başlat
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: İŞ EMRİ DETAYI */}
      <Dialog
        isOpen={!!selectedWo}
        onClose={() => setSelectedWo(null)}
        title={`İş Emri Detayı: ${selectedWo?.orderNumber}`}
        maxWidth="lg"
      >
        {selectedWo && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 text-[11px] block">Reçete & Hedef Mamul:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedWo.bomName}</div>
                <div className="text-xs text-indigo-700 font-semibold">{selectedWo.productVariantName || selectedWo.productVariantSku}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block mb-1">Durum:</span>
                <StatusBadge status={selectedWo.status} />
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Planlanan Miktar:</span>
                <div className="font-bold text-slate-800 font-mono">{selectedWo.plannedQuantity} Adet</div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Gerçekleşen Üretim:</span>
                <div className="font-bold text-emerald-700 font-mono">{selectedWo.producedQuantity} Adet</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span>Otomatik Stok Sarfiyat Kalemleri</span>
                <span className="text-slate-500 normal-case font-normal">Tamamlandığında depodan otomatik düşer</span>
              </h4>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2 border-r border-slate-200">Hammadde / Kalem</th>
                      <th className="p-2 border-r border-slate-200">SKU Kodu</th>
                      <th className="p-2 text-right border-r border-slate-200">Gereken Miktar</th>
                      <th className="p-2 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedWo.items?.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-medium border-r border-slate-100 text-slate-900">
                          {it.componentName || it.componentSku}
                        </td>
                        <td className="p-2 font-mono text-slate-600 border-r border-slate-100">
                          {it.componentSku}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800 border-r border-slate-100">
                          {it.plannedQuantity} {it.unit}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {selectedWo.status === 'COMPLETED' ? (
                            <span className="text-emerald-700 font-semibold">✓ Stoktan Düşüldü</span>
                          ) : (
                            <span className="text-slate-500">Bekliyor</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <div>
                {selectedWo.status === 'PLANNED' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateWoStatus(selectedWo.id, 'IN_PROGRESS')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" /> Üretimi Başlat
                  </Button>
                )}
                {selectedWo.status === 'IN_PROGRESS' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateWoStatus(selectedWo.id, 'COMPLETED')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Üretimi Tamamla (Stok Çıkışı/Girişi)
                  </Button>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedWo(null)}>
                Kapat
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* MODAL 3: REÇETE (BOM) DETAYI */}
      <Dialog
        isOpen={!!selectedBom}
        onClose={() => setSelectedBom(null)}
        title={`Üretim Reçetesi: ${selectedBom?.bomCode} — ${selectedBom?.name}`}
        maxWidth="lg"
      >
        {selectedBom && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-slate-500 text-[11px] block">Hedef Mamul:</span>
                <strong className="text-slate-900 font-semibold">{selectedBom.variantName || selectedBom.variantSku}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Parti Miktarı:</span>
                <span className="font-mono text-slate-800 font-bold">{selectedBom.quantity} {selectedBom.unit}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Sektör Tipi:</span>
                <span className="text-indigo-700 font-semibold">{selectedBom.industryType || 'GENERIC'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Kalem Sayısı:</span>
                <span className="font-mono text-slate-800 font-bold">{selectedBom.items?.length || 0} Sarfiyat</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-1.5">
                Reçete Bileşenleri & Hammadde Sarfiyatları
              </h4>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2 border-r border-slate-200">Hammadde / Kalem</th>
                      <th className="p-2 border-r border-slate-200">SKU Kodu</th>
                      <th className="p-2 text-right border-r border-slate-200">Birim Sarfiyat</th>
                      <th className="p-2 text-right">Fire Oranı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedBom.items || []).map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-medium border-r border-slate-100 text-slate-900">
                          {it.componentName || it.componentSku}
                        </td>
                        <td className="p-2 font-mono text-slate-600 border-r border-slate-100">
                          {it.componentSku}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800 border-r border-slate-100">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="p-2 text-right font-mono text-amber-700 font-medium">
                          {Number(it.scrapRate) > 0 ? `%${it.scrapRate}` : '-%0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedBom(null)}>
                Kapat
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* MODAL 4: YENİ REÇETE (BOM) EKLE */}
      <Dialog
        isOpen={isNewBomOpen}
        onClose={() => setIsNewBomOpen(false)}
        title="Yeni Üretim Reçetesi (BOM) Tanımla"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBom} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reçete Adı / Tanımı *
              </label>
              <Input
                value={newBomName}
                onChange={(e) => setNewBomName(e.target.value)}
                placeholder="Örn: Slim Fit Gömlek İmalat Reçetesi"
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Üretilecek Nihai Mamul (SKU) *
              </label>
              <select
                value={newBomVariantId}
                onChange={(e) => setNewBomVariantId(Number(e.target.value))}
                required
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="">-- Mamul Seçiniz --</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.variantName ? `${v.variantName} (${v.sku})` : v.sku}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parti Miktarı
              </label>
              <Input
                type="number"
                min="1"
                value={newBomQuantity}
                onChange={(e) => setNewBomQuantity(Number(e.target.value))}
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Birim
              </label>
              <Input
                value={newBomUnit}
                onChange={(e) => setNewBomUnit(e.target.value)}
                placeholder="Adet, Kg, Mt..."
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endüstri Şablonu
              </label>
              <select
                value={newBomIndustry}
                onChange={(e) => setNewBomIndustry(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="GENERIC">Genel Üretim</option>
                <option value="TEXTILE">Tekstil & Konfeksiyon</option>
                <option value="FOOD_BEVERAGE">Gıda & İçecek</option>
                <option value="AUTOMOTIVE">Otomotiv Yan Sanayi</option>
                <option value="FURNITURE">Mobilya & Ahşap</option>
                <option value="ELECTRONICS">Elektronik</option>
                <option value="CHEMICAL">Kimya & Kozmetik</option>
              </select>
            </div>
          </div>

          {/* BOM Reçete Kalemleri Ekleme */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Reçete Bileşenleri (Hammadde / Yarı Mamul Sarfiyatı)
            </h4>

            <div className="grid grid-cols-12 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <div className="col-span-6">
                <select
                  value={selectedCompVariantId}
                  onChange={(e) => setSelectedCompVariantId(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                >
                  <option value="">-- Sarfiyat Varyantı Seçin --</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.variantName ? `${v.variantName} (${v.sku})` : v.sku}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Miktar"
                  value={selectedCompQty}
                  onChange={(e) => setSelectedCompQty(Number(e.target.value))}
                  className="text-xs h-8"
                />
              </div>
              <div className="col-span-3 flex gap-1">
                <Input
                  placeholder="Birim"
                  value={selectedCompUnit}
                  onChange={(e) => setSelectedCompUnit(e.target.value)}
                  className="text-xs h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddComponentItem}
                  className="h-8 px-3 text-xs bg-slate-800 text-white hover:bg-slate-900 cursor-pointer"
                >
                  Ekle
                </Button>
              </div>
            </div>

            {newBomItems.length > 0 && (
              <div className="mt-2 space-y-1">
                {newBomItems.map((it, idx) => {
                  const v = variants.find((x) => x.id === it.componentVariantId);
                  return (
                    <div key={idx} className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded text-xs">
                      <span>{v ? (v.variantName ? `${v.variantName} (${v.sku})` : v.sku) : `Varyant #${it.componentVariantId}`}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{it.quantity} {it.unit}</span>
                        <button
                          type="button"
                          onClick={() => setNewBomItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button size="sm" variant="ghost" type="button" onClick={() => setIsNewBomOpen(false)}>
              Vazgeç
            </Button>
            <Button size="sm" type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-medium">
              Reçeteyi Kaydet
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
