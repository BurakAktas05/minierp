import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Truck,
  Building2,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Wallet,
  Factory,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';
import { quotationApi } from '../api/quotationApi';
import { orderApi } from '../api/orderApi';
import { partnerApi } from '../api/partnerApi';
import { invoiceApi } from '../api/invoiceApi';
import { waybillApi } from '../api/waybillApi';
import { treasuryApi } from '../api/treasuryApi';
import { manufacturingApi } from '../api/manufacturingApi';
import {
  Product,
  Quotation,
  Order,
  BusinessPartner,
  Invoice,
  Waybill,
  TreasuryAccount,
  WorkOrder,
} from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/ui/button';

const formatCurrency = (amount: number = 0, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
};

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

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Canlı Veritabanı Varlıkları
  const [products, setProducts] = useState<Product[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [treasuryAccounts, setTreasuryAccounts] = useState<TreasuryAccount[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveDatabaseData = async () => {
    setLoading(true);
    try {
      const [
        prodList,
        quotList,
        ordList,
        partList,
        invList,
        waybList,
        treasList,
        mfgList,
      ] = await Promise.all([
        inventoryApi.getProducts().catch(() => []),
        quotationApi.getQuotations().catch(() => []),
        orderApi.getOrders().catch(() => []),
        partnerApi.getPartners().catch(() => []),
        invoiceApi.getInvoices().catch(() => []),
        waybillApi.getWaybills().catch(() => []),
        treasuryApi.getAllAccounts().catch(() => []),
        manufacturingApi.getWorkOrders().catch(() => []),
      ]);

      setProducts(prodList);
      setQuotations(quotList);
      setOrders(ordList);
      setPartners(partList);
      setInvoices(invList);
      setWaybills(waybList);
      setTreasuryAccounts(treasList);
      setWorkOrders(mfgList);
    } catch (err) {
      console.error('Veritabanı metrikleri alınırken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDatabaseData();
  }, []);

  // ==========================================
  // %100 GERÇEK VERİTABANI METRİKLERİ
  // ==========================================

  // 1. Stok Metrikleri
  const stockMetrics = useMemo(() => {
    let physical = 0;
    let reserved = 0;
    let totalValuation = 0;
    const criticalVariants: Array<{
      id: number;
      sku: string;
      name: string;
      productCode: string;
      physical: number;
      reserved: number;
      available: number;
    }> = [];

    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        const pQty = v.stockQuantity || 0;
        const rQty = v.reservedStock || 0;
        const aQty = pQty - rQty;

        physical += pQty;
        reserved += rQty;
        totalValuation += pQty * Number(v.salePrice || p.basePrice || 0);

        if (aQty <= 15) {
          criticalVariants.push({
            id: v.id,
            sku: v.sku,
            name: v.variantName || v.sku,
            productCode: p.code,
            physical: pQty,
            reserved: rQty,
            available: aQty,
          });
        }
      });
    });

    return {
      totalSkuCount: products.reduce((sum, p) => sum + (p.variants?.length || 0), 0),
      totalProducts: products.length,
      physical,
      reserved,
      available: physical - reserved,
      totalValuation,
      criticalVariants: criticalVariants.sort((a, b) => a.available - b.available),
    };
  }, [products]);

  // 2. Finans & Hazine Metrikleri
  const financialMetrics = useMemo(() => {
    // Toplam Kesilen Fatura Tutarı (DRAFT hariç)
    const officialInvoices = invoices.filter((i) => i.status !== 'DRAFT' && i.status !== 'CANCELLED');
    const totalInvoiced = officialInvoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
    const totalRemaining = officialInvoices.reduce((sum, i) => sum + Number(i.remainingAmount || 0), 0);
    const totalCollected = totalInvoiced - totalRemaining;

    // Kasa ve Banka Toplam Mevduatı
    const treasuryBalance = treasuryAccounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance || 0),
      0
    );

    // Cari Borç/Alacak Bakiyeleri
    const totalPartnerDebt = partners.reduce((sum, p) => sum + Number(p.totalDebit || 0), 0);
    const totalPartnerCredit = partners.reduce((sum, p) => sum + Number(p.totalCredit || 0), 0);

    return {
      totalInvoiced,
      totalRemaining,
      totalCollected,
      treasuryBalance,
      totalPartnerDebt,
      totalPartnerCredit,
      activeInvoiceCount: officialInvoices.length,
      unpaidInvoiceCount: officialInvoices.filter((i) => (i.remainingAmount || 0) > 0).length,
    };
  }, [invoices, treasuryAccounts, partners]);

  // 3. Sipariş & Operasyon Metrikleri
  const operationMetrics = useMemo(() => {
    const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED');
    const draftOrders = orders.filter((o) => o.status === 'DRAFT');
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

    const confirmedAmount = confirmedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const pendingWaybills = waybills.filter((w) => w.status === 'DRAFT');
    const dispatchedWaybills = waybills.filter((w) => w.status === 'DISPATCHED');
    const pendingQuotes = quotations.filter((q) => q.status === 'SENT' || q.status === 'DRAFT');
    const activeWorkOrders = workOrders.filter((wo) => wo.status === 'IN_PROGRESS' || wo.status === 'PLANNED');

    return {
      totalOrders: orders.length,
      confirmedCount: confirmedOrders.length,
      draftCount: draftOrders.length,
      completedCount: completedOrders.length,
      confirmedAmount,
      pendingWaybillCount: pendingWaybills.length,
      dispatchedWaybillCount: dispatchedWaybills.length,
      pendingQuoteCount: pendingQuotes.length,
      activeWorkOrderCount: activeWorkOrders.length,
    };
  }, [orders, waybills, quotations, workOrders]);

  return (
    <div className="space-y-4 select-none pb-8">
      {/* 1. KURUMSAL ERP BAŞLIK VE HIZLI MENÜ */}
      <div className="bg-slate-900 text-white p-4 rounded-t-sm border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-xs"></span>
            <h1 className="text-sm font-bold tracking-wide uppercase">
              Kurumsal Operasyon & Finans Kontrol Kokpiti
            </h1>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              Canlı DB
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            PostgreSQL şemasından anlık çekilen fiili stok, rezerve pozisyonu, cari borç/alacak ve açık sipariş dengesi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchLiveDatabaseData}
            title="Veritabanını Yenile (F5)"
            disabled={loading}
            className="h-7 px-2.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/orders')}
            className="h-7 px-2.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
            <span>Siparişler</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/invoices')}
            className="h-7 px-2.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            <span>Faturalar</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/inventory')}
            className="h-7 px-2.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          >
            <Package className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            <span>Stok Yönetimi</span>
          </Button>
        </div>
      </div>

      {/* 2. ANA KURUMSAL KPI METRİK IZGARASI (CİDDİ ERP FORMATI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KART 1: STOK POZİSYONU */}
        <div
          onClick={() => navigate('/inventory')}
          className="bg-white border border-slate-300 rounded-sm p-3.5 shadow-2xs hover:border-slate-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-700" />
              Depo Fiili Stok
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
              {stockMetrics.totalSkuCount} SKU
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-slate-900 tracking-tight">
              {stockMetrics.physical.toLocaleString('tr-TR')}
            </span>
            <span className="text-xs font-medium text-slate-500">Birim Adet</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-amber-700 font-semibold">
              Rezerve: {stockMetrics.reserved.toLocaleString('tr-TR')}
            </span>
            <span className="text-emerald-700 font-bold">
              Satılabilir: {stockMetrics.available.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>

        {/* KART 2: FİNANSAL CİRO & AÇIK BAKİYE */}
        <div
          onClick={() => navigate('/invoices')}
          className="bg-white border border-slate-300 rounded-sm p-3.5 shadow-2xs hover:border-slate-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              Fatura Hacmi
            </span>
            <span className="text-[11px] font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
              {financialMetrics.activeInvoiceCount} Belge
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(financialMetrics.totalInvoiced)}
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">
              Tahsil Edilen: {formatCurrency(financialMetrics.totalCollected)}
            </span>
            <span className="text-rose-700 font-bold">
              Kalan: {formatCurrency(financialMetrics.totalRemaining)}
            </span>
          </div>
        </div>

        {/* KART 3: HAZİNE & LİKİDİTE (KASA/BANKA) */}
        <div
          onClick={() => navigate('/invoices')}
          className="bg-white border border-slate-300 rounded-sm p-3.5 shadow-2xs hover:border-slate-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-700" />
              Kasa & Banka Hazine
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              {treasuryAccounts.length} Hesap
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-emerald-900 tracking-tight">
              {formatCurrency(financialMetrics.treasuryBalance)}
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Kasa: {treasuryAccounts.filter((a) => a.accountType === 'CASH').length}</span>
            <span>Banka: {treasuryAccounts.filter((a) => a.accountType === 'BANK').length}</span>
          </div>
        </div>

        {/* KART 4: SİPARİŞ & TEDARİK OPERASYONU */}
        <div
          onClick={() => navigate('/orders')}
          className="bg-white border border-slate-300 rounded-sm p-3.5 shadow-2xs hover:border-slate-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-slate-800" />
              Resmi Siparişler
            </span>
            <span className="text-[11px] font-mono font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
              {operationMetrics.confirmedCount} Onaylı
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(operationMetrics.confirmedAmount)}
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-amber-700 font-medium">Taslak: {operationMetrics.draftCount}</span>
            <span className="text-slate-600">Tamamlanan: {operationMetrics.completedCount}</span>
          </div>
        </div>
      </div>

      {/* 3. İKİ SÜTUNLU CANLI VERİTABANI İŞLEM MASALARI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SOL: EN SON DÜZENLENEN RESMİ FATURALAR (DB'DEN) */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-2xs flex flex-col">
          <div className="p-2.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-700 rounded-xs"></span>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Son Düzenlenen Faturalar
              </h2>
              <span className="text-[10px] font-mono text-slate-500">
                (Toplam {invoices.length} kayıt)
              </span>
            </div>
            <button
              onClick={() => navigate('/invoices')}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
            >
              Tüm Faturalar <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-auto max-h-72">
            <table className="w-full border-collapse text-xs text-left">
              <thead className="sticky top-0 bg-slate-200 text-slate-800 border-b border-slate-300 font-semibold text-[11px]">
                <tr>
                  <th className="px-2.5 py-1.5 border-r border-slate-300">Fatura No</th>
                  <th className="px-2.5 py-1.5 border-r border-slate-300">Cari Ünvan</th>
                  <th className="px-2.5 py-1.5 text-right border-r border-slate-300">Tutar</th>
                  <th className="px-2.5 py-1.5 text-right border-r border-slate-300">Kalan Bakiye</th>
                  <th className="px-2 py-1.5 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.slice(0, 7).map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate('/invoices')}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-2.5 py-1.5 border-r border-slate-200 truncate max-w-[150px]">
                      <span className="font-semibold text-slate-800">
                        {inv.partnerTitle || inv.partner?.name || `Cari #${inv.partnerId}`}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {formatDate(inv.invoiceDate)}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 font-mono text-[11px] text-right font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </td>
                    <td className="px-2.5 py-1.5 font-mono text-[11px] text-right font-bold text-rose-800 border-r border-slate-200 whitespace-nowrap">
                      {formatCurrency(inv.remainingAmount, inv.currency)}
                    </td>
                    <td className="px-2 py-1.5 text-center whitespace-nowrap">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      Veritabanında kayıtlı fatura bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SAĞ: EN SON ONAYLANAN & BEKLEYEN SİPARİŞLER (DB'DEN) */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-2xs flex flex-col">
          <div className="p-2.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-700 rounded-xs"></span>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Son Resmi Siparişler
              </h2>
              <span className="text-[10px] font-mono text-slate-500">
                (Toplam {orders.length} kayıt)
              </span>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
            >
              Tüm Siparişler <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-auto max-h-72">
            <table className="w-full border-collapse text-xs text-left">
              <thead className="sticky top-0 bg-slate-200 text-slate-800 border-b border-slate-300 font-semibold text-[11px]">
                <tr>
                  <th className="px-2.5 py-1.5 border-r border-slate-300">Sipariş No</th>
                  <th className="px-2.5 py-1.5 border-r border-slate-300">Cari Ünvan</th>
                  <th className="px-2.5 py-1.5 text-right border-r border-slate-300">Toplam Tutar</th>
                  <th className="px-2.5 py-1.5 text-center border-r border-slate-300">Kalem</th>
                  <th className="px-2 py-1.5 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.slice(0, 7).map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => navigate('/orders')}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      {ord.orderNumber}
                    </td>
                    <td className="px-2.5 py-1.5 border-r border-slate-200 truncate max-w-[150px]">
                      <span className="font-semibold text-slate-800">
                        {ord.partnerTitle || `Cari #${ord.partnerId}`}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {ord.orderType === 'SALES_ORDER' ? 'Satış Siparişi' : 'Alış Siparişi'}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 font-mono text-[11px] text-right font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      {formatCurrency(ord.totalAmount)}
                    </td>
                    <td className="px-2.5 py-1.5 font-mono text-[11px] text-center text-slate-600 border-r border-slate-200 whitespace-nowrap">
                      {ord.items?.length || 1}
                    </td>
                    <td className="px-2 py-1.5 text-center whitespace-nowrap">
                      <StatusBadge status={ord.status} />
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      Veritabanında kayıtlı sipariş bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. ALT BÖLÜM: KRİTİK STOK ALARMI & ÇALIŞMA BANDI */}
      <div className="bg-white border border-slate-300 rounded-sm shadow-2xs">
        <div className="p-2.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Kritik Stok & Azalan Varyantlar Takip Paneli
            </h3>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
              {stockMetrics.criticalVariants.length} Varyant Kritik Eşikte (≤ 15 Adet)
            </span>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            Stok Girişi Yap <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-auto max-h-56">
          <table className="w-full border-collapse text-xs text-left">
            <thead className="sticky top-0 bg-slate-200 text-slate-800 border-b border-slate-300 font-semibold text-[11px]">
              <tr>
                <th className="px-2.5 py-1.5 border-r border-slate-300">Stok Kodu</th>
                <th className="px-2.5 py-1.5 border-r border-slate-300">SKU / Varyant Adı</th>
                <th className="px-2.5 py-1.5 text-right border-r border-slate-300">Fiili Stok</th>
                <th className="px-2.5 py-1.5 text-right border-r border-slate-300">Rezerve Stok</th>
                <th className="px-2.5 py-1.5 text-right border-r border-slate-300">Kullanılabilir</th>
                <th className="px-2 py-1.5 text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stockMetrics.criticalVariants.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => navigate('/inventory')}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-2.5 py-1.5 font-mono text-[11px] font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                    {item.productCode}
                  </td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200">
                    <span className="font-semibold text-slate-900">{item.name}</span>
                    <span className="block font-mono text-[10px] text-slate-400">{item.sku}</span>
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-[11px] text-right text-slate-700 border-r border-slate-200">
                    {item.physical.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-[11px] text-right text-amber-700 font-medium border-r border-slate-200">
                    {item.reserved.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-[11px] text-right font-bold text-rose-800 border-r border-slate-200">
                    {item.available.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        item.available <= 0
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {item.available <= 0 ? 'TÜKENDİ' : 'KRİTİK'}
                    </span>
                  </td>
                </tr>
              ))}
              {stockMetrics.criticalVariants.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    Tüm ürün varyantlarında satılabilir stok seviyesi güvenli sınırın üzerindedir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
