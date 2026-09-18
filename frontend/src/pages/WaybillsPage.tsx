import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Send,
  CheckCircle2,
  Printer,
  FileText,
  Eye,
  PackageCheck,
  Building2,
  ArrowRight,
  Ban,
} from 'lucide-react';
import { waybillApi } from '../api/waybillApi';
import { invoiceApi } from '../api/invoiceApi';
import { Waybill, WaybillStatus, WaybillType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/button';
import { Dialog } from '../components/ui/dialog';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErpToolbar } from '../components/common/ErpToolbar';
import { ErpDataGrid, Column } from '../components/common/ErpDataGrid';
import { ErpSummaryBar } from '../components/common/ErpSummaryBar';
import { OfficialReportModal } from '../components/reports/OfficialReportModal';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const WaybillsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const { toast } = useToast();
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DISPATCH' | 'RECEIPT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWaybill, setSelectedWaybill] = useState<Waybill | null>(null);

  // Modallar
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await waybillApi.getWaybills();
      setWaybills(list);
      if (selectedWaybill) {
        const found = list.find((w) => w.id === selectedWaybill.id);
        setSelectedWaybill(found || null);
      }
    } catch (err: any) {
      console.error('İrsaliyeler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sevk Etme (Fiziki Stok Düşümü Tetikler)
  const handleDispatch = async () => {
    if (!selectedWaybill) return;
    if (
      !window.confirm(
        `#${selectedWaybill.waybillNumber} nolu irsaliyeyi sevk etmek istiyor musunuz?\nDepodan fiili stok düşülecek ve kurumsal stok hareket kütüğü oluşturulacaktır.`
      )
    ) {
      return;
    }

    try {
      await waybillApi.updateStatus(selectedWaybill.id, 'DISPATCHED');
      await loadData();
      toast.success('İrsaliye sevk edildi. Depo fiili stokları güncellendi.');
    } catch (err: any) {
      toast.error('Sevk edilirken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Teslim Edildi Olarak İşaretleme
  const handleDeliver = async () => {
    if (!selectedWaybill) return;
    try {
      await waybillApi.updateStatus(selectedWaybill.id, 'DELIVERED');
      await loadData();
      toast.success('İrsaliye teslim edildi olarak işaretlendi.');
    } catch (err: any) {
      toast.error('Teslim kaydı yapılırken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // İrsaliye İptal & Depoya İade Alma (Ters stok hareketi tetikler)
  const handleCancelWaybill = async () => {
    if (!selectedWaybill) return;
    if (
      !window.confirm(
        `#${selectedWaybill.waybillNumber} nolu irsaliyeyi İPTAL etmek istiyor musunuz?\n${
          selectedWaybill.status === 'DISPATCHED'
            ? 'DİKKAT: Sevk edilmiş olan mallar depoya geri iade edilecek ve bağlı sipariş teslimat bakiyesi geri açılacaktır!'
            : 'İrsaliye iptal statüsüne alınacaktır.'
        }`
      )
    ) {
      return;
    }

    try {
      await waybillApi.updateStatus(selectedWaybill.id, 'CANCELLED');
      await loadData();
      toast.success('İrsaliye iptal edildi. İlgili stoklar depoya geri iade edildi.');
    } catch (err: any) {
      toast.error('İptal edilirken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // İrsaliyeden Tek Tıkla Faturalaştırma
  const handleCreateInvoice = async () => {
    if (!selectedWaybill) return;
    try {
      await invoiceApi.createInvoiceFromWaybill(selectedWaybill.id);
      toast.success('İrsaliyeden fatura başarıyla oluşturuldu.');
      navigate('/invoices');
    } catch (err: any) {
      toast.error('Fatura oluşturulurken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // İrsaliye Detayını Açma ve Kalemleri (Lot Nolarını) Canlı Getirme
  const handleOpenDetail = async (waybill: Waybill) => {
    setSelectedWaybill(waybill);
    setDetailModalOpen(true);
    try {
      const full = await waybillApi.getWaybillById(waybill.id);
      if (full && full.items) {
        setSelectedWaybill(full);
      }
    } catch (e) {
      console.error('İrsaliye detayı yüklenirken hata:', e);
    }
  };

  // Filtrelenmiş irsaliyeler
  const filteredWaybills = useMemo(() => {
    return waybills.filter((w) => {
      // 1. Yaşam Döngüsü / Durum Filtresi
      if (statusFilter !== 'ALL' && w.status !== statusFilter) return false;

      // 2. Yön / Tür Filtresi (Giden Sevk / Gelen Mal Kabul)
      if (typeFilter !== 'ALL' && w.type !== typeFilter) return false;

      // 3. Arama Çubuğu
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          w.waybillNumber.toLowerCase().includes(term) ||
          (w.partnerTitle && w.partnerTitle.toLowerCase().includes(term)) ||
          (w.trackingNumber && w.trackingNumber.toLowerCase().includes(term)) ||
          (w.orderNumber && w.orderNumber.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [waybills, statusFilter, typeFilter, searchTerm]);

  // Tablo sütun tanımları
  const columns: Column<Waybill>[] = [
    {
      id: 'waybillNumber',
      header: 'İrsaliye No',
      width: '150px',
      accessor: (w) => (
        <span className="font-mono font-bold text-slate-900">{w.waybillNumber}</span>
      ),
    },
    {
      id: 'waybillDate',
      header: 'Sevk Tarihi',
      width: '100px',
      accessor: (w) => <span className="font-mono text-slate-600">{formatDate(w.waybillDate)}</span>,
    },
    {
      id: 'orderNumber',
      header: 'Kaynak Sipariş',
      width: '140px',
      accessor: (w) => (
        <span className="font-mono text-slate-700 font-medium">
          {w.orderNumber || (w.orderId ? `Sipariş #${w.orderId}` : '-')}
        </span>
      ),
    },
    {
      id: 'type',
      header: 'İrsaliye Türü',
      width: '120px',
      accessor: (w) => (
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
            w.type === 'DISPATCH'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {w.type === 'DISPATCH' ? 'Sevk İrsaliyesi' : 'Mal Kabul İrsaliyesi'}
        </span>
      ),
    },
    {
      id: 'partner',
      header: 'Cari Hesap Unvanı',
      accessor: (w) => (
        <span className="font-medium text-slate-900 truncate block max-w-xs">
          {w.partnerTitle || 'Cari Hesap'}
        </span>
      ),
    },
    {
      id: 'carrier',
      header: 'Taşıyıcı / Takip No',
      width: '180px',
      accessor: (w) => (
        <div className="text-[11px] truncate">
          <span className="text-slate-800 font-medium">{w.carrierInfo || 'Taşıyıcı Belirtilmedi'}</span>
          {w.trackingNumber && (
            <span className="block font-mono text-slate-500 text-[10px]">
              Kargo: {w.trackingNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'İrsaliye Durumu',
      align: 'center',
      width: '120px',
      accessor: (w) => <StatusBadge status={w.status} />,
    },
  ];

  return (
    <div className="space-y-0 select-none">
      {/* 1. DİA ERP Toolbar */}
      <ErpToolbar
        title="İrsaliye & Sevkiyat İşlemleri"
        subtitle="Depo Çıkış / Giriş İrsaliyeleri ve Lojistik Takip"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="İrsaliye no, sipariş no veya takip no ile ara..."
        onRefresh={loadData}
        actions={[
          {
            label: 'Sevk Et (DISPATCH)',
            icon: <Send className="w-3.5 h-3.5 text-blue-600" />,
            onClick: handleDispatch,
            disabled: !selectedWaybill || selectedWaybill.status !== 'DRAFT',
            variant: 'primary',
            title: 'İrsaliyeyi sevk eder ve fiili stoğu depodan düşer',
          },
          {
            label: 'Teslim Edildi',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
            onClick: handleDeliver,
            disabled: !selectedWaybill || selectedWaybill.status !== 'DISPATCHED',
            title: 'İrsaliyenin alıcıya ulaştığını onaylar',
          },
          {
            label: 'Faturalaştır',
            icon: <FileText className="w-3.5 h-3.5 text-indigo-600" />,
            onClick: handleCreateInvoice,
            disabled:
              !selectedWaybill ||
              (selectedWaybill.status !== 'DISPATCHED' && selectedWaybill.status !== 'DELIVERED'),
            title: 'Sevk edilen irsaliyeden tek tıkla resmi fatura düzenler',
          },
          {
            label: 'Detay / İncele',
            icon: <Eye className="w-3.5 h-3.5 text-slate-700" />,
            onClick: () => {
              if (!selectedWaybill) {
                toast.warning('Lütfen incelemek istediğiniz irsaliyeyi seçiniz.');
                return;
              }
              handleOpenDetail(selectedWaybill);
            },
            disabled: !selectedWaybill,
          },
          {
            label: 'İptal Et / İade Al',
            icon: <Ban className="w-3.5 h-3.5 text-rose-600" />,
            onClick: handleCancelWaybill,
            disabled: !selectedWaybill || selectedWaybill.status === 'CANCELLED' || selectedWaybill.status === 'DELIVERED',
            title: 'İrsaliyeyi iptal eder ve sevk edilmişse stokları depoya geri iade alır',
          },
          {
            label: 'Yazdır',
            icon: <Printer className="w-3.5 h-3.5 text-slate-600" />,
            onClick: () => {
              if (!selectedWaybill) {
                toast.warning('Lütfen yazdırmak istediğiniz irsaliyeyi listeden seçiniz.');
                return;
              }
              setPrintModalOpen(true);
            },
          },
        ]}
      >
        {/* Lojistik Yaşam Döngüsü Sekmeleri & Tür Seçimi */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Tür / Yön Açılır Seçimi */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="h-7 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2 text-slate-800 font-medium focus:outline-none focus:border-slate-800 cursor-pointer"
            title="İrsaliye Yönü Filtresi"
          >
            <option value="ALL">Tüm İrsaliyeler (Giden & Gelen)</option>
            <option value="DISPATCH">Giden Sevk İrsaliyeleri (Satış / Çıkış)</option>
            <option value="RECEIPT">Gelen Mal Kabul İrsaliyeleri (Alış / Giriş)</option>
          </select>

          <span className="text-slate-300">|</span>

          {/* Durum / Yaşam Döngüsü Sekmeleri */}
          <div className="flex items-center gap-1">
            {[
              {
                id: 'ALL',
                label: 'Tümü',
                count: waybills.filter((w) => typeFilter === 'ALL' || w.type === typeFilter).length,
              },
              {
                id: 'DRAFT',
                label: 'Taslaklar',
                count: waybills.filter((w) => w.status === 'DRAFT' && (typeFilter === 'ALL' || w.type === typeFilter)).length,
              },
              {
                id: 'DISPATCHED',
                label: 'Yolda / Sevkiyatta',
                count: waybills.filter((w) => w.status === 'DISPATCHED' && (typeFilter === 'ALL' || w.type === typeFilter)).length,
              },
              {
                id: 'DELIVERED',
                label: 'Teslim Edilenler',
                count: waybills.filter((w) => w.status === 'DELIVERED' && (typeFilter === 'ALL' || w.type === typeFilter)).length,
              },
              {
                id: 'CANCELLED',
                label: 'İptal Edilenler',
                count: waybills.filter((w) => w.status === 'CANCELLED' && (typeFilter === 'ALL' || w.type === typeFilter)).length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-full font-mono font-bold ${
                    statusFilter === tab.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </ErpToolbar>

      {/* 2. DİA ERP Veri Izgarası (Data Grid) */}
      <ErpDataGrid
        data={filteredWaybills}
        columns={columns}
        keyExtractor={(w) => w.id}
        selectedId={selectedWaybill?.id}
        onSelectRow={(w) => setSelectedWaybill(w)}
        onDoubleClickRow={(w) => {
          handleOpenDetail(w);
        }}
        loading={loading}
        emptyMessage="Seçili kriterlere uygun irsaliye kaydı bulunamadı. Siparişler sayfasından onaylı siparişi 'İrsaliyeleştir' butonuyla oluşturabilirsiniz."
      />

      {/* 3. DİA ERP Dip Toplam Çubuğu */}
      <ErpSummaryBar
        totalCount={filteredWaybills.length}
        selectedText={
          selectedWaybill
            ? `Seçili İrsaliye: ${selectedWaybill.waybillNumber} (${selectedWaybill.partnerTitle || ''})`
            : undefined
        }
        metrics={[
          {
            label: 'Taslak',
            value: `${filteredWaybills.filter((w) => w.status === 'DRAFT').length} adet`,
            highlight: filteredWaybills.filter((w) => w.status === 'DRAFT').length > 0 ? 'warning' : undefined,
          },
          {
            label: 'Yolda / Sevkiyatta',
            value: `${filteredWaybills.filter((w) => w.status === 'DISPATCHED').length} adet`,
            highlight: 'info',
          },
          {
            label: 'Teslim Edilen',
            value: `${filteredWaybills.filter((w) => w.status === 'DELIVERED').length} adet`,
            highlight: 'success',
          },
          {
            label: 'İptal',
            value: `${filteredWaybills.filter((w) => w.status === 'CANCELLED').length} adet`,
          },
        ]}
      />

      {/* MODAL: İrsaliye Detayı ve Sevk Kalemleri */}
      <Dialog
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`İrsaliye İnceleme — ${selectedWaybill?.waybillNumber || ''}`}
        description="Sevk edilen ürün varyantları, lojistik bilgileri ve kaynak sipariş"
        maxWidth="3xl"
      >
        {selectedWaybill && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Cari Hesap:</span>
                <strong className="text-slate-900 font-semibold">{selectedWaybill.partnerTitle}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sevk Tarihi:</span>
                <span className="font-mono text-slate-800">{formatDate(selectedWaybill.waybillDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">İlişkili Sipariş:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedWaybill.orderNumber || `#${selectedWaybill.orderId || '-'}`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Durum:</span>
                <StatusBadge status={selectedWaybill.status} />
              </div>
            </div>

            {/* Lojistik Bilgisi */}
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded text-xs">
              <div className="flex items-center gap-2 font-semibold text-blue-900">
                <Truck className="w-4 h-4 text-blue-700" />
                <span>Taşıyıcı & Lojistik:</span>
                <span className="font-normal text-slate-700">{selectedWaybill.carrierInfo || 'Belirtilmedi'}</span>
              </div>
              {selectedWaybill.trackingNumber && (
                <div className="mt-1 text-slate-600 font-mono text-[11px]">
                  Kargo Takip Kodu: <strong>{selectedWaybill.trackingNumber}</strong>
                </div>
              )}
              {selectedWaybill.notes && (
                <div className="mt-1 text-slate-500 italic text-[11px]">
                  Not: {selectedWaybill.notes}
                </div>
              )}
            </div>

            {/* Sevk Kalemleri */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Sevk Edilen Kalemler ({selectedWaybill.items?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2 border-r border-slate-200">Ürün / SKU</th>
                      <th className="p-2 border-r border-slate-200">Kalem Açıklaması</th>
                      <th className="p-2 border-r border-slate-200">Parti / Lot No</th>
                      <th className="p-2 text-right">Sevk Miktarı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedWaybill.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-100 font-mono font-bold text-slate-900">
                          {item.variantSku || `Varyant #${item.variantId}`}
                        </td>
                        <td className="p-2 border-r border-slate-100 text-slate-600">
                          {item.productName || item.description || '-'}
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          {item.lotNumber ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              {item.lotNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Belirtilmedi</span>
                          )}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">
                          {item.quantity} adet
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs text-slate-700 cursor-pointer"
                  onClick={() => setPrintModalOpen(true)}
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  Resmi İrsaliyeyi Yazdır / PDF
                </Button>
                {(selectedWaybill.status === 'DISPATCHED' || selectedWaybill.status === 'DELIVERED') && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleCreateInvoice}
                    className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Bu İrsaliyeyi Faturalaştır</span>
                  </Button>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => setDetailModalOpen(false)}>
                Kapat
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Resmi e-İrsaliye Baskı Önizleme Penceresi */}
      <OfficialReportModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        reportType="WAYBILL"
        waybill={selectedWaybill}
      />
    </div>
  );
};
