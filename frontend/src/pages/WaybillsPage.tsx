import React, { useState, useEffect } from 'react';
import {
  Truck,
  Send,
  CheckCircle2,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  PackageCheck,
} from 'lucide-react';
import { waybillApi } from '../api/waybillApi';
import { Waybill, WaybillStatus, WaybillType } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs } from '../components/ui/tabs';
import { Card } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { StatusBadge } from '../components/common/StatusBadge';

export const WaybillsPage: React.FC = () => {
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedWaybills, setExpandedWaybills] = useState<Record<number, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const typeParam = activeTab === 'ALL' ? undefined : (activeTab as WaybillType);
      const list = await waybillApi.getWaybills(typeParam);
      setWaybills(list);
    } catch (err) {
      console.error('İrsaliyeler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const toggleExpand = (id: number) => {
    setExpandedWaybills((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Dispatch Waybill (Deducts stock via RabbitMQ event!)
  const handleDispatch = async (waybillId: number) => {
    if (!window.confirm('İrsaliyeyi sevk etmek istediğinize emin misiniz? Arka planda RabbitMQ üzerinden fiili stok düşüşü ve rezervasyon temizliği gerçekleştirilecektir.')) {
      return;
    }
    try {
      await waybillApi.updateStatus(waybillId, 'DISPATCHED');
      await loadData();
      alert('İrsaliye sevk edildi. İlgili ürün varyantlarının fiili stokları düşüldü ve rezerve stokları serbest bırakıldı.');
    } catch (err: any) {
      alert('Sevk edilirken hata: ' + (err.message || 'Hata'));
    }
  };

  // Mark Delivered
  const handleDeliver = async (waybillId: number) => {
    try {
      await waybillApi.updateStatus(waybillId, 'DELIVERED');
      await loadData();
    } catch (err: any) {
      alert('Durum güncellenirken hata: ' + (err.message || 'Hata'));
    }
  };

  const filteredWaybills = waybills.filter(
    (w) =>
      w.waybillNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.orderNumber && w.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (w.partnerTitle && w.partnerTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">İrsaliye & Sevkiyat Yönetimi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sipariş teslimatları, taşıyıcı takibi ve fiili stok düşüm döngüsü
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yenile</span>
          </Button>
        </div>
      </div>

      {/* Tabs and Search */}
      <Card className="p-4 space-y-4">
        <Tabs
          tabs={[
            { id: 'ALL', label: 'Tüm İrsaliyeler', count: waybills.length },
            { id: 'DISPATCH', label: 'Sevk İrsaliyeleri (Çıkış)' },
            { id: 'RECEIPT', label: 'Teslim Alma İrsaliyeleri (Giriş)' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="İrsaliye no (IRS-...), sipariş no veya cari unvan ara..."
            className="pl-9 text-xs"
          />
        </div>
      </Card>

      {/* Waybills List */}
      <div className="space-y-3">
        {filteredWaybills.map((w) => {
          const isExpanded = !!expandedWaybills[w.id];
          return (
            <Card key={w.id} className="border border-slate-200 overflow-hidden">
              <div
                onClick={() => toggleExpand(w.id)}
                className="p-4 bg-white hover:bg-slate-50/70 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="text-slate-400 hover:text-slate-700">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-900" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {w.waybillNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {w.partnerTitle || 'Cari Hesap'}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 bg-slate-50">
                        {w.type === 'DISPATCH' ? 'Sevk İrsaliyesi' : 'Teslim Alma'}
                      </span>
                      <StatusBadge status={w.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span>Tarih: {new Date(w.waybillDate).toLocaleDateString('tr-TR')}</span>
                      {w.orderNumber && (
                        <span className="text-slate-700 font-mono font-medium">
                          Sipariş Ref: {w.orderNumber}
                        </span>
                      )}
                      {w.carrierInfo && <span>Taşıyıcı: {w.carrierInfo}</span>}
                      {w.trackingNumber && (
                        <span className="font-mono">Takip: {w.trackingNumber}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Actions */}
                <div
                  className="flex items-center gap-2 self-end md:self-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {w.status === 'DRAFT' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs h-8 bg-slate-900"
                      onClick={() => handleDispatch(w.id)}
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      <span>Sevk Et (MQ Fiili Stok Düş)</span>
                    </Button>
                  )}

                  {w.status === 'DISPATCHED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-emerald-700 border-emerald-300 bg-emerald-50/50"
                      onClick={() => handleDeliver(w.id)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      <span>Teslim Edildi Olarak İşaretle</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Waybill Items Detail */}
              {isExpanded && (
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    İrsaliye Kalemleri
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ürün & Varyant</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Sevk Edilen Miktar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {w.items.map((item, idx) => (
                        <TableRow key={idx} className="bg-white">
                          <TableCell className="text-xs font-semibold text-slate-800">
                            {item.productName || `Varyant #${item.variantId}`}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {item.variantSku || '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                            {item.quantity} Adet
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {w.notes && (
                    <p className="mt-3 text-xs text-slate-500 italic bg-white p-2.5 rounded border border-slate-200">
                      Sevkiyat Notu: {w.notes}
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {filteredWaybills.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <Truck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">İrsaliye kaydı bulunamadı</p>
            <p className="text-xs text-slate-400 mt-1">Onaylanan siparişler üzerinden sevk irsaliyesi oluşturabilirsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
};
