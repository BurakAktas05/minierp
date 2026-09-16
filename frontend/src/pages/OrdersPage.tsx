import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  Truck,
  RefreshCw,
  Search,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { waybillApi } from '../api/waybillApi';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus, OrderType } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs } from '../components/ui/tabs';
import { Card } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { StatusBadge } from '../components/common/StatusBadge';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const typeParam = activeTab === 'ALL' ? undefined : (activeTab as OrderType);
      const list = await orderApi.getOrders(typeParam);
      setOrders(list);
    } catch (err) {
      console.error('Siparişler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const toggleExpand = (id: number) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Order Confirmation (Triggers RabbitMQ Stock Reservation!)
  const handleConfirmOrder = async (orderId: number) => {
    if (!isManager) {
      alert('Yalnızca YÖNETİCİ (Manager) veya ADMIN rolündeki kullanıcılar sipariş onaylayabilir.');
      return;
    }

    if (!window.confirm('Siparişi onaylamak istediğinize emin misiniz? Arka planda RabbitMQ üzerinden stok rezervasyon kuyruğu tetiklenecektir.')) {
      return;
    }

    try {
      await orderApi.updateStatus(orderId, 'CONFIRMED');
      await loadData();
      alert('Sipariş onaylandı ve ilgili ürün varyantları için stoklar rezerve edildi (RabbitMQ Event).');
    } catch (err: any) {
      alert('Sipariş onaylanırken hata: ' + (err.message || 'Hata'));
    }
  };

  // Order Cancellation (Releases Reserved Stock)
  const handleCancelOrder = async (orderId: number) => {
    if (!isManager) {
      alert('Yalnızca YÖNETİCİ (Manager) veya ADMIN rolündeki kullanıcılar sipariş iptal edebilir.');
      return;
    }

    if (!window.confirm('Siparişi iptal etmek istediğinize emin misiniz? Rezerve edilmiş stoklar serbest bırakılacaktır.')) {
      return;
    }

    try {
      await orderApi.updateStatus(orderId, 'CANCELLED');
      await loadData();
      alert('Sipariş iptal edildi ve rezerve stoklar serbest bırakıldı.');
    } catch (err: any) {
      alert('İptal edilirken hata: ' + (err.message || 'Hata'));
    }
  };

  // Create Waybill from Order
  const handleCreateWaybill = async (orderId: number) => {
    try {
      await waybillApi.createWaybillFromOrder(orderId);
      alert('Siparişten sevk irsaliyesi başarıyla üretildi. İrsaliye sayfasına yönlendiriliyorsunuz.');
      navigate('/waybills');
    } catch (err: any) {
      alert('İrsaliye üretilirken hata: ' + (err.message || 'Hata'));
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.partnerTitle && o.partnerTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Resmi Siparişler</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            RabbitMQ asenkron stok rezervasyonu ve irsaliye sevk döngüsü
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
            { id: 'ALL', label: 'Tüm Siparişler', count: orders.length },
            { id: 'SALES_ORDER', label: 'Satış Siparişleri' },
            { id: 'PURCHASE_ORDER', label: 'Satın Alma Siparişleri' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sipariş numarası (ORD-...) veya cari unvan ara..."
            className="pl-9 text-xs"
          />
        </div>
      </Card>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const isExpanded = !!expandedOrders[order.id];
          return (
            <Card key={order.id} className="border border-slate-200 overflow-hidden">
              <div
                onClick={() => toggleExpand(order.id)}
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
                        {order.orderNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {order.partnerTitle || 'Cari Hesap'}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 bg-slate-50">
                        {order.type === 'SALES_ORDER' ? 'Satış Siparişi' : 'Satın Alma'}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span>Sipariş Tarihi: {new Date(order.orderDate).toLocaleDateString('tr-TR')}</span>
                      <span>{order.items.length} Kalem</span>
                      {order.quotationId && (
                        <span className="text-slate-600 font-medium">
                          Teklif Ref: #{order.quotationId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Total and Actions */}
                <div className="flex items-center gap-4 self-end md:self-center">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Sipariş Tutarı</p>
                    <p className="font-mono text-sm font-bold text-slate-900">
                      ₺{order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {order.status === 'DRAFT' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs h-8 bg-emerald-700 hover:bg-emerald-800 border-emerald-700"
                          onClick={() => handleConfirmOrder(order.id)}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          <span>Siparişi Onayla (MQ Rezerve)</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-rose-700 border-rose-300"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          <span>İptal</span>
                        </Button>
                      </>
                    )}

                    {order.status === 'CONFIRMED' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => handleCreateWaybill(order.id)}
                        >
                          <Truck className="w-3.5 h-3.5 mr-1" />
                          <span>İrsaliye Oluştur</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-rose-700 border-rose-300"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          <span>İptal Et</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items Detail */}
              {isExpanded && (
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Sipariş Kalemleri
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ürün & Varyant</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Miktar</TableHead>
                        <TableHead className="text-right">Birim Fiyat</TableHead>
                        <TableHead className="text-right">KDV</TableHead>
                        <TableHead className="text-right">Satır Tutarı</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item, idx) => (
                        <TableRow key={idx} className="bg-white">
                          <TableCell className="text-xs font-semibold text-slate-800">
                            {item.productName || `Varyant #${item.variantId}`}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {item.variantSku || '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold">
                            {item.quantity} Adet
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            ₺{item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-slate-500">
                            %{item.taxRate}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                            ₺
                            {(
                              item.quantity * item.unitPrice * (1 + item.taxRate / 100)
                            ).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {order.notes && (
                    <p className="mt-3 text-xs text-slate-500 italic bg-white p-2.5 rounded border border-slate-200">
                      Not: {order.notes}
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <ShoppingCart className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Sipariş kaydı bulunamadı</p>
            <p className="text-xs text-slate-400 mt-1">Teklifler sayfasından onaylanan bir teklifi siparişe dönüştürebilirsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
};
