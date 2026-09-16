import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Layers,
  FileSpreadsheet,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Plus,
  Truck,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { inventoryApi } from '../api/inventoryApi';
import { quotationApi } from '../api/quotationApi';
import { orderApi } from '../api/orderApi';
import { partnerApi } from '../api/partnerApi';
import { Product, Quotation, Order, BusinessPartner } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodList, quotList, ordList, partList] = await Promise.all([
          inventoryApi.getProducts(),
          quotationApi.getQuotations(),
          orderApi.getOrders(),
          partnerApi.getPartners(),
        ]);
        setProducts(prodList);
        setQuotations(quotList);
        setOrders(ordList);
        setPartners(partList);
      } catch (err) {
        console.error('Dashboard veri yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute metrics
  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0);
  const totalStockQuantity = products.reduce(
    (sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stockQuantity, 0),
    0
  );
  const totalReservedStock = products.reduce(
    (sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.reservedStock, 0),
    0
  );

  // Critical / Low stock variants (availableStock <= 15 or high reserved ratio)
  const criticalVariants: Array<{
    productName: string;
    sku: string;
    size?: string;
    color?: string;
    stock: number;
    reserved: number;
    available: number;
  }> = [];

  products.forEach((p) => {
    p.variants.forEach((v) => {
      if (v.availableStock <= 15 || v.reservedStock > 0) {
        criticalVariants.push({
          productName: p.name,
          sku: v.sku,
          size: v.size,
          color: v.color,
          stock: v.stockQuantity,
          reserved: v.reservedStock,
          available: v.availableStock,
        });
      }
    });
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Genel Bakış & KPI Raporu</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerçek zamanlı stok rezervasyonları, cari teklifler ve sipariş akış paneli
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/quotations')}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Teklif</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/orders')}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Siparişler</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/inventory')}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stok / Ürün Girişi</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Stok SKU"
          value={totalVariants}
          subtitle={`Toplam ${totalStockQuantity} adet fiili ürün`}
          icon={Package}
          onClick={() => navigate('/inventory')}
        />
        <StatCard
          title="Rezerve Stok"
          value={totalReservedStock}
          subtitle="Siparişler için ayrıldı (RabbitMQ)"
          change={`${totalReservedStock} Adet`}
          isPositive={false}
          icon={Layers}
          onClick={() => navigate('/inventory')}
        />
        <StatCard
          title="B2B Teklifler"
          value={quotations.length}
          subtitle={`${quotations.filter((q) => q.status === 'ACCEPTED').length} adet kabul edilmiş`}
          icon={FileSpreadsheet}
          onClick={() => navigate('/quotations')}
        />
        <StatCard
          title="Resmi Siparişler"
          value={orders.length}
          subtitle={`${orders.filter((o) => o.status === 'CONFIRMED').length} adet onaylı`}
          change={`${orders.filter((o) => o.status === 'CONFIRMED').length} Onaylı`}
          isPositive={true}
          icon={ShoppingCart}
          onClick={() => navigate('/orders')}
        />
      </div>

      {/* Grid: Critical Stock & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Stock Alert Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Kritik Stok & Rezervasyon Durumu</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Kullanılabilir adedi düşük veya rezervasyonu yüksek varyantlar
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/inventory')}
              className="text-xs"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün & Varyant</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Fiili</TableHead>
                  <TableHead className="text-right">Rezerve</TableHead>
                  <TableHead className="text-right">Kullanılabilir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalVariants.slice(0, 5).map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <p className="font-semibold text-xs text-slate-900">{item.productName}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.size ? `Beden: ${item.size}` : ''} {item.color ? `/ Renk: ${item.color}` : ''}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{item.stock}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-amber-700 font-semibold">
                      {item.reserved}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded font-bold ${
                          item.available <= 5
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {item.available}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {criticalVariants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-xs text-slate-400">
                      Tüm stok seviyeleri optimal durumda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Orders Flow */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-slate-700" />
                <span>Son Siparişler</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                En son oluşturulan B2B müşteri ve tedarik siparişleri
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/orders')}
              className="text-xs"
            >
              <span>Siparişler</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Cari Unvan</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs font-semibold text-slate-900">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-[160px]">
                      {order.partnerTitle || 'Cari Hesap'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      ₺{order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-xs text-slate-400">
                      Henüz sipariş kaydı bulunmuyor.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Business Partners & Quick Link Strip */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-md border border-slate-200 text-slate-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Cari Hesaplar & Portföy
              </p>
              <p className="text-xs text-slate-500">
                Kayıtlı {partners.length} aktif cari hesap (müşteri ve tedarikçi firmalar)
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/partners')}
          >
            <span>Cari Kartları Yönet</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
