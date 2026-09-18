import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Truck,
  Plus,
  Trash2,
  Printer,
  Eye,
  Calendar,
  Building2,
  Layers,
} from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { waybillApi } from '../api/waybillApi';
import { partnerApi } from '../api/partnerApi';
import { inventoryApi } from '../api/inventoryApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Order,

  OrderStatus,
  OrderType,
  CreateOrderRequest,
  BusinessPartner,
  Product,
} from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { StatusBadge, getTurkishStatusLabel } from '../components/common/StatusBadge';
import { ErpToolbar } from '../components/common/ErpToolbar';
import { ErpDataGrid, Column } from '../components/common/ErpDataGrid';
import { ErpSummaryBar } from '../components/common/ErpSummaryBar';
import { OfficialReportModal } from '../components/reports/OfficialReportModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useSelectablePartners } from '../hooks/useSelectablePartners';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { isManager, activeTenant, tenants } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SALES' | 'PURCHASE' | 'CONFIRMED' | 'DRAFT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modallar
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Yeni sipariş formu durumu
  interface OrderFormItem {
    variantId: number;
    description: string;
    quantity: number;
    unitPrice: number;
    discountRate: number;
    taxRate: number;
  }

  const [newOrderType, setNewOrderType] = useState<OrderType>('SALES_ORDER');
  const [newNotes, setNewNotes] = useState('');
  const [orderItems, setOrderItems] = useState<OrderFormItem[]>([
    { variantId: 0, description: '', quantity: 1, unitPrice: 0, discountRate: 0, taxRate: 20 },
  ]);

  const currentTenantObj = useMemo(() => {
    return tenants.find((t) => t.id === activeTenant || t.tenantId === activeTenant);
  }, [tenants, activeTenant]);

  // Dinamik cari hesap seçimi ve filtreleme (kendi firmasını otomatik hariç tutar)
  const {
    selectablePartners,
    selectedPartnerId: newPartnerId,
    setSelectedPartnerId: setNewPartnerId,
    isSelf,
  } = useSelectablePartners({
    partners,
    direction: newOrderType === 'SALES_ORDER' ? 'CUSTOMER' : 'SUPPLIER',
  });


  const allVariants = useMemo(() => {
    const list: Array<{
      id: number;
      productId: number;
      productName: string;
      productCode: string;
      sku: string;
      variantName: string;
      salePrice: number;
      purchasePrice: number;
      taxRate: number;
      availableStock: number;
    }> = [];
    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        list.push({
          id: v.id,
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          sku: v.sku,
          variantName: v.variantName || v.sku,
          salePrice: Number(v.salePrice ?? p.basePrice ?? 0),
          purchasePrice: Number(v.purchasePrice ?? 0),
          taxRate: Number(p.taxRate ?? 20),
          availableStock: Number(v.availableStock ?? 0),
        });
      });
    });
    return list;
  }, [products]);

  useEffect(() => {
    if (allVariants.length > 0 && orderItems.length === 1 && orderItems[0].variantId === 0) {
      const v = allVariants[0];
      setOrderItems([
        {
          variantId: v.id,
          description: `${v.productName} - ${v.variantName}`,
          quantity: 1,
          unitPrice: newOrderType === 'SALES_ORDER' ? v.salePrice : v.purchasePrice,
          discountRate: 0,
          taxRate: v.taxRate,
        },
      ]);
    }
  }, [allVariants, newOrderType]);

  const handleVariantSelect = (index: number, variantId: number) => {
    const selected = allVariants.find((v) => v.id === variantId);
    const copy = [...orderItems];
    if (selected) {
      copy[index] = {
        ...copy[index],
        variantId: selected.id,
        description: `${selected.productName} - ${selected.variantName}`,
        unitPrice: newOrderType === 'SALES_ORDER' ? selected.salePrice : selected.purchasePrice,
        taxRate: selected.taxRate,
      };
    } else {
      copy[index] = { ...copy[index], variantId };
    }
    setOrderItems(copy);
  };

  const handleAddItem = () => {
    const v = allVariants[0];
    setOrderItems([
      ...orderItems,
      {
        variantId: v ? v.id : 0,
        description: v ? `${v.productName} - ${v.variantName}` : '',
        quantity: 1,
        unitPrice: v ? (newOrderType === 'SALES_ORDER' ? v.salePrice : v.purchasePrice) : 0,
        discountRate: 0,
        taxRate: v ? v.taxRate : 20,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length <= 1) {
      toast.warning('Siparişte en az bir kalem bulunmalıdır.');
      return;
    }
    setOrderItems(orderItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderFormItem, value: any) => {
    const copy = [...orderItems];
    copy[index] = { ...copy[index], [field]: value };
    setOrderItems(copy);
  };

  const orderTotals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    orderItems.forEach((it) => {
      const gross = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
      const disc = (gross * (Number(it.discountRate) || 0)) / 100;
      const net = gross - disc;
      const tax = (net * (Number(it.taxRate) || 0)) / 100;

      subtotal += gross;
      totalDiscount += disc;
      totalTax += tax;
    });

    const grandTotal = subtotal - totalDiscount + totalTax;
    return { subtotal, totalDiscount, totalTax, grandTotal };
  }, [orderItems]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordList, partList, prodList] = await Promise.all([
        orderApi.getOrders(),
        partnerApi.getPartners(),
        inventoryApi.getProducts(),
      ]);
      setOrders(ordList);
      setPartners(partList);
      setProducts(prodList);
      if (partList.length > 0 && newPartnerId === 0) {
        setNewPartnerId(partList[0].id);
      }
      if (selectedOrder) {
        const found = ordList.find((o) => o.id === selectedOrder.id);
        setSelectedOrder(found || null);
      }
    } catch (err) {
      console.error('Siparişler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sipariş Onayı (RabbitMQ Stok Rezervasyonu Tetikler)
  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    if (!isManager) {
      toast.error('Yalnızca YÖNETİCİ (Manager) veya ADMIN rolündeki kullanıcılar sipariş onaylayabilir.');
      return;
    }

    if (
      !window.confirm(
        `#${selectedOrder.orderNumber} nolu siparişi onaylamak istiyor musunuz?\nArka planda RabbitMQ üzerinden stok rezervasyon kuyruğu tetiklenecektir.`
      )
    ) {
      return;
    }

    try {
      await orderApi.updateStatus(selectedOrder.id, 'CONFIRMED');
      await loadData();
      toast.success('Sipariş onaylandı ve ürün varyantları için stoklar rezerve edildi.');
    } catch (err: any) {
      toast.error('Sipariş onaylanırken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // İrsaliyeleştirme (Sevk İşlemi)
  const handleCreateWaybill = async () => {
    if (!selectedOrder) return;
    if (selectedOrder.status !== 'CONFIRMED') {
      toast.warning('Yalnızca ONAYLANMIŞ (CONFIRMED) siparişler için irsaliye düzenlenebilir.');
      return;
    }

    try {
      await waybillApi.createWaybillFromOrder(selectedOrder.id);
      toast.success('Siparişten irsaliye başarıyla oluşturuldu.');
      navigate('/waybills');
    } catch (err: any) {
      toast.error('İrsaliye oluşturulurken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Sipariş İptali
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    if (
      !window.confirm(
        `#${selectedOrder.orderNumber} nolu siparişi iptal etmek istediğinize emin misiniz?`
      )
    ) {
      return;
    }

    try {
      await orderApi.updateStatus(selectedOrder.id, 'CANCELLED');
      await loadData();
      toast.success('Sipariş iptal edildi.');
    } catch (err: any) {
      toast.error('Sipariş iptal edilirken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Yeni Sipariş Kaydı
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = partners.find((p) => p.id === newPartnerId);
    if (!chosen || !newPartnerId) {
      toast.warning('Lütfen bir cari hesap seçiniz.');
      return;
    }

    if (isSelf(chosen)) {
      toast.error('Kendi firmanıza sipariş düzenleyemezsiniz! Lütfen bir müşteri veya tedarikçi seçiniz.');
      return;
    }


    if (orderItems.some((it) => !it.variantId || it.variantId === 0)) {
      toast.warning('Lütfen tüm kalemler için geçerli bir ürün/varyant seçiniz.');
      return;
    }

    try {
      const payload: CreateOrderRequest = {
        orderType: newOrderType,
        partnerId: newPartnerId,
        notes: newNotes,
        items: orderItems.map((it) => ({
          variantId: it.variantId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          taxRate: Number(it.taxRate || 20),
          discountRate: Number(it.discountRate || 0),
          description: it.description || undefined,
        })),
      };

      await orderApi.createOrder(payload);
      setCreateModalOpen(false);
      setNewNotes('');
      if (allVariants.length > 0) {
        const v = allVariants[0];
        setOrderItems([
          {
            variantId: v.id,
            description: `${v.productName} - ${v.variantName}`,
            quantity: 1,
            unitPrice: newOrderType === 'SALES_ORDER' ? v.salePrice : v.purchasePrice,
            discountRate: 0,
            taxRate: v.taxRate,
          },
        ]);
      }
      toast.success('Yeni sipariş başarıyla oluşturuldu.');
      await loadData();
    } catch (err: any) {
      toast.error('Sipariş oluşturulurken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtrelenmiş siparişler
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (activeTab === 'SALES' && ord.type !== 'SALES_ORDER') return false;
      if (activeTab === 'PURCHASE' && ord.type !== 'PURCHASE_ORDER') return false;
      if (activeTab === 'CONFIRMED' && ord.status !== 'CONFIRMED') return false;
      if (activeTab === 'DRAFT' && ord.status !== 'DRAFT') return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const pName = ord.partnerTitle || '';
        return (
          ord.orderNumber.toLowerCase().includes(term) ||
          pName.toLowerCase().includes(term) ||
          (ord.notes && ord.notes.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [orders, activeTab, searchTerm]);

  // Toplamlar
  const totalAmountSum = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const confirmedAmountSum = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'CONFIRMED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  // Tablo sütun tanımları
  const columns: Column<Order>[] = [
    {
      id: 'orderNumber',
      header: 'Sipariş Fiş No',
      width: '160px',
      accessor: (ord) => (
        <span className="font-mono font-bold text-slate-900">{ord.orderNumber}</span>
      ),
    },
    {
      id: 'orderDate',
      header: 'Sipariş Tarihi',
      width: '110px',
      accessor: (ord) => <span className="font-mono text-slate-600">{formatDate(ord.orderDate)}</span>,
    },
    {
      id: 'deliveryDate',
      header: 'Teslim Tarihi',
      width: '110px',
      accessor: (ord) => <span className="font-mono text-slate-600">{formatDate(ord.deliveryDate)}</span>,
    },
    {
      id: 'type',
      header: 'Sipariş Türü',
      width: '130px',
      accessor: (ord) => (
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
            ord.type === 'SALES_ORDER'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}
        >
          {ord.type === 'SALES_ORDER' ? 'Satış Siparişi' : 'Satın Alma Siparişi'}
        </span>
      ),
    },
    {
      id: 'partner',
      header: 'Cari Hesap Unvanı',
      accessor: (ord) => (
        <span className="font-medium text-slate-900 truncate block max-w-xs">
          {ord.partnerTitle || 'Cari Hesap'}
        </span>
      ),
    },
    {
      id: 'itemCount',
      header: 'Kalem',
      align: 'center',
      width: '80px',
      accessor: (ord) => (
        <span className="font-mono text-slate-700 font-semibold">
          {ord.items ? ord.items.length : 0} adet
        </span>
      ),
    },
    {
      id: 'totalAmount',
      header: 'Genel Toplam',
      align: 'right',
      width: '130px',
      accessor: (ord) => (
        <span className="font-bold font-mono text-slate-900">{formatCurrency(ord.totalAmount)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Fiş Durumu',
      align: 'center',
      width: '120px',
      accessor: (ord) => <StatusBadge status={ord.status} />,
    },
  ];

  return (
    <div className="space-y-0 select-none">
      {/* 1. DİA ERP Toolbar */}
      <ErpToolbar
        title="Resmi Sipariş Fişleri"
        subtitle="Müşteri & Tedarikçi Sipariş Yönetimi"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Sipariş no veya cari unvanı ile ara..."
        onRefresh={loadData}
        actions={[
          {
            label: 'Yeni Sipariş',
            icon: <Plus className="w-3.5 h-3.5 text-white" />,
            onClick: () => navigate('/orders/new'),
            variant: 'primary',
          },
          {
            label: 'Siparişi Onayla',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
            onClick: handleConfirmOrder,
            disabled: !selectedOrder || selectedOrder.status !== 'DRAFT',
            title: 'Siparişi onaylar ve varyant stoğunu rezerve eder (RabbitMQ)',
          },
          {
            label: 'İrsaliyeleştir',
            icon: <Truck className="w-3.5 h-3.5 text-indigo-600" />,
            onClick: handleCreateWaybill,
            disabled: !selectedOrder || selectedOrder.status !== 'CONFIRMED',
            title: 'Onaylı siparişten sevk irsaliyesi oluşturur',
          },
          {
            label: 'Kalemleri İncele',
            icon: <Eye className="w-3.5 h-3.5 text-blue-600" />,
            onClick: () => {
              if (!selectedOrder) {
                toast.warning('Lütfen incelemek istediğiniz siparişi seçiniz.');
                return;
              }
              setDetailModalOpen(true);
            },
            disabled: !selectedOrder,
          },
          {
            label: 'İptal Et',
            icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
            onClick: handleCancelOrder,
            disabled: !selectedOrder || selectedOrder.status === 'CANCELLED',
          },
          {
            label: 'Yazdır',
            icon: <Printer className="w-3.5 h-3.5 text-slate-600" />,
            onClick: () => {
              if (!selectedOrder) {
                toast.warning('Lütfen yazdırmak istediğiniz siparişi listeden seçiniz.');
                return;
              }
              setPrintModalOpen(true);
            },
          },
        ]}
      >
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1 text-xs">
          {[
            { id: 'ALL', label: 'Tümü' },
            { id: 'SALES', label: 'Satış' },
            { id: 'PURCHASE', label: 'Satın Alma' },
            { id: 'CONFIRMED', label: 'Onaylananlar' },
            { id: 'DRAFT', label: 'Taslaklar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </ErpToolbar>

      {/* 2. DİA ERP Veri Izgarası (Data Grid) */}
      <ErpDataGrid
        data={filteredOrders}
        columns={columns}
        keyExtractor={(ord) => ord.id}
        selectedId={selectedOrder?.id}
        onSelectRow={(ord) => setSelectedOrder(ord)}
        onDoubleClickRow={(ord) => {
          setSelectedOrder(ord);
          setDetailModalOpen(true);
        }}
        loading={loading}
        emptyMessage="Sipariş kaydı bulunamadı."
      />

      {/* 3. DİA ERP Dip Toplam Çubuğu */}
      <ErpSummaryBar
        totalCount={filteredOrders.length}
        selectedText={
          selectedOrder
            ? `Seçili Sipariş: ${selectedOrder.orderNumber} (${selectedOrder.partnerTitle || ''})`
            : undefined
        }
        metrics={[
          { label: 'Toplam Tutar', value: formatCurrency(totalAmountSum) },
          { label: 'Onaylı Tutar', value: formatCurrency(confirmedAmountSum), highlight: 'success' },
        ]}
      />

      {/* MODAL 1: Sipariş Kalemleri ve Detay Modalı */}
      <Dialog
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Sipariş Fişi İnceleme — ${selectedOrder?.orderNumber || ''}`}
        description="Sipariş başlık bilgileri, rezerve edilen kalemler ve finansal icmal"
        maxWidth="4xl"
      >
        {selectedOrder && (() => {
          const totalQty = (selectedOrder.items || []).reduce((s, it) => s + (it.quantity || 0), 0);
          const deliveredQty = (selectedOrder.items || []).reduce((s, it) => s + (it.deliveredQuantity || 0), 0);
          const remainingQty = Math.max(0, totalQty - deliveredQty);
          const fulfillmentPct = totalQty > 0 ? Math.min(100, Math.round((deliveredQty / totalQty) * 100)) : 0;

          return (
            <div className="space-y-4">
              {/* 1. ERP Sipariş Başlık Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider uppercase ${
                        selectedOrder.type === 'SALES_ORDER'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-purple-100 text-purple-800 border-purple-200'
                      }`}
                    >
                      {selectedOrder.type === 'SALES_ORDER' ? 'Satış Siparişi' : 'Satın Alma Siparişi'}
                    </span>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <h2 className="text-2xl font-black font-mono tracking-tight text-slate-900">
                    {selectedOrder.orderNumber}
                  </h2>
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{selectedOrder.partnerTitle || 'Cari Hesap Bilgisi'}</span>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Sipariş Tarihi:</span>
                    <span className="font-mono font-bold text-slate-800">{formatDate(selectedOrder.orderDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Teslim Tarihi:</span>
                    <span className="font-mono font-semibold text-slate-700">{formatDate(selectedOrder.deliveryDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Sevkiyat Deposu:</span>
                    <span className="font-mono text-xs font-semibold text-slate-700">WH-MRK-01 (Merkez Ana Depo)</span>
                  </div>
                </div>
              </div>

              {/* 2. Kalemler Tablosu */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    Sipariş Kalemleri ({selectedOrder.items?.length || 0})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">Rezerve edilen ürün kalemleri</span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase">
                      <tr>
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5">Ürün / Varyant Açıklaması</th>
                        <th className="p-2.5 w-24 text-right">Sipariş</th>
                        <th className="p-2.5 w-24 text-center">Sevk / Kalan</th>
                        <th className="p-2.5 w-28 text-right">Birim Fiyat</th>
                        <th className="p-2.5 w-16 text-right">KDV %</th>
                        <th className="p-2.5 w-32 text-right">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((it, idx) => {
                          const delivered = it.deliveredQuantity || 0;
                          const remaining = Math.max(0, it.quantity - delivered);
                          const lineTot =
                            (it.quantity || 0) * (it.unitPrice || 0) * (1 + (it.taxRate || 20) / 100);
                          return (
                            <tr key={it.id || idx} className="hover:bg-slate-50/70">
                              <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-2.5 font-medium text-slate-900">
                                {it.description || it.productName || it.variantName || 'Ürün Kalemi'}
                                {it.variantSku && (
                                  <span className="block font-mono text-[10px] text-slate-400">
                                    SKU: {it.variantSku}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                {it.quantity} Adet
                              </td>
                              <td className="p-2.5 text-center font-mono text-[11px]">
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {delivered}
                                </span>
                                <span className="text-slate-400 mx-1">/</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded border font-bold ${
                                    remaining > 0
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-slate-100 text-slate-400 border-slate-200'
                                  }`}
                                >
                                  {remaining}
                                </span>
                              </td>
                              <td className="p-2.5 text-right font-mono text-slate-700">
                                {formatCurrency(it.unitPrice)}
                              </td>
                              <td className="p-2.5 text-right font-mono text-slate-600">
                                %{it.taxRate || 20}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                {formatCurrency(lineTot)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400">
                            Bu siparişe ait kalem kaydı bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Alt Bölüm: Sol (Sevkiyat İlerlemesi & Notlar) + Sağ (Finansal İcmal) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                {/* Sol Kolon: Fiş Notları & Lojistik İlerleme */}
                <div className="md:col-span-7 space-y-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-500" />
                        Depo & Lojistik Sevk Özeti
                      </span>
                      <span className="font-mono text-slate-900 font-bold">
                        {deliveredQty} / {totalQty} Adet (%{fulfillmentPct})
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          fulfillmentPct === 100
                            ? 'bg-emerald-500'
                            : fulfillmentPct > 0
                            ? 'bg-amber-500'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${fulfillmentPct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Kalan Sevk Bekleyen: <strong className="font-mono text-amber-700">{remainingQty} Adet</strong></span>
                      <span>Fiilen Sevk Edilen: <strong className="font-mono text-emerald-700">{deliveredQty} Adet</strong></span>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div className="bg-amber-50/60 border border-amber-200 rounded p-2.5 text-xs text-slate-700">
                      <strong className="block text-amber-900 font-semibold mb-0.5">Sipariş Notu / Talimatı:</strong>
                      <span>{selectedOrder.notes}</span>
                    </div>
                  )}
                </div>

                {/* Sağ Kolon: Finansal İcmal */}
                <div className="md:col-span-5 flex flex-col justify-start">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                      Sipariş Tutarları
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Kalem Toplamı:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </span>
                    </div>

                    {/* Genel Toplam Büyük Kutu */}
                    <div className="flex justify-between items-center bg-white border border-slate-300 p-2.5 rounded shadow-2xs mt-2">
                      <span className="font-extrabold text-slate-900 uppercase tracking-wide text-xs">
                        Sipariş Toplamı:
                      </span>
                      <span className="text-lg font-black font-mono text-slate-900">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Modal Alt Aksiyon Çubuğu */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer"
                  onClick={() => setPrintModalOpen(true)}
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  Resmi Sipariş Formunu Yazdır / PDF
                </Button>

                <Button size="sm" variant="outline" onClick={() => setDetailModalOpen(false)}>
                  Kapat
                </Button>
              </div>
            </div>
          );
        })()}
      </Dialog>

      {/* MODAL 2: Yeni Sipariş Oluşturma Penceresi */}
      <Dialog
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Yeni B2B Sipariş Girişi"
        description="Müşteri veya tedarikçiden gelen resmi sipariş mektubunu ürün/varyant seçimiyle sisteme işleyin"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          {/* Üst Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sipariş Türü</label>
              <select
                value={newOrderType}
                onChange={(e) => {
                  const newT = e.target.value as OrderType;
                  setNewOrderType(newT);
                  setOrderItems((prev) =>
                    prev.map((it) => {
                      const v = allVariants.find((av) => av.id === it.variantId);
                      return v
                        ? { ...it, unitPrice: newT === 'SALES_ORDER' ? v.salePrice : v.purchasePrice }
                        : it;
                    })
                  );
                }}
                className="w-full h-8 text-xs bg-white border border-slate-300 rounded px-2.5 focus:outline-none focus:border-slate-800"
              >
                <option value="SALES_ORDER">Müşteri Satış Siparişi (Stok Rezerve Edilir)</option>
                <option value="PURCHASE_ORDER">Tedarikçi Satın Alma Siparişi</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cari Hesap {newOrderType === 'SALES_ORDER' ? '(Müşteri)' : '(Tedarikçi)'}
              </label>
              <select
                value={newPartnerId}
                onChange={(e) => setNewPartnerId(Number(e.target.value))}
                className="w-full h-8 text-xs bg-white border border-slate-300 rounded px-2.5 focus:outline-none focus:border-slate-800"
                required
              >
                {selectablePartners.length === 0 ? (
                  <option value={0} disabled>
                    Uygun cari bulunamadı
                  </option>
                ) : (
                  selectablePartners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title || p.name} ({getTurkishStatusLabel(p.type)})
                    </option>
                  ))
                )}
              </select>
            </div>


            <div className="col-span-full">
              <label className="block font-semibold text-slate-700 mb-1">Sipariş Notu / Sevkiyat Talimatı</label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Örn: 15 gün içinde sevk edilmeli. Teslimat Gebze Depoya yapılacak."
              />
            </div>
          </div>

          {/* Kalemler Tablosu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <span>Sipariş Kalemleri ({orderItems.length})</span>
                <span className="text-[10px] font-normal text-slate-500 lowercase">
                  (satılacak / alınacak ürün ve varyantları seçiniz)
                </span>
              </h4>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddItem}
                className="gap-1 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kalem Ekle</span>
              </Button>
            </div>

            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200">Ürün & Varyant</th>
                    <th className="p-2 w-20 text-center border-r border-slate-200">Miktar</th>
                    <th className="p-2 w-28 text-right border-r border-slate-200">Birim Fiyat</th>
                    <th className="p-2 w-16 text-center border-r border-slate-200">İsk.%</th>
                    <th className="p-2 w-16 text-center border-r border-slate-200">KDV%</th>
                    <th className="p-2 w-28 text-right border-r border-slate-200">Tutar</th>
                    <th className="p-2 w-10 text-center">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {orderItems.map((item, idx) => {
                    const gross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                    const disc = (gross * (Number(item.discountRate) || 0)) / 100;
                    const net = gross - disc;
                    const tax = (net * (Number(item.taxRate) || 0)) / 100;
                    const lineTotal = net + tax;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        {/* Ürün & Varyant Seçici */}
                        <td className="p-2 border-r border-slate-100">
                          <select
                            value={item.variantId}
                            onChange={(e) => handleVariantSelect(idx, Number(e.target.value))}
                            className="w-full h-8 text-xs bg-white border border-slate-300 rounded px-2 focus:outline-none focus:border-slate-800"
                            required
                          >
                            <option value={0} disabled>
                              -- Ürün / Varyant Seçiniz --
                            </option>
                            {products.map((prod) => (
                              <optgroup key={prod.id} label={`${prod.name} [${prod.code}]`}>
                                {(prod.variants || []).map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.sku} - {v.variantName || v.sku} (Mevcut: {v.availableStock} Adet)
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            placeholder="Kalem açıklaması (opsiyonel)"
                            className="w-full mt-1 h-6 text-[11px] px-1.5 border border-slate-200 rounded text-slate-600 focus:outline-none"
                          />
                        </td>

                        {/* Miktar */}
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full h-8 text-center text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-800 font-mono font-bold"
                            required
                          />
                        </td>

                        {/* Birim Fiyat */}
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                            className="w-full h-8 text-right text-xs border border-slate-300 rounded px-1.5 focus:outline-none focus:border-slate-800 font-mono"
                            required
                          />
                        </td>

                        {/* İskonto % */}
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountRate}
                            onChange={(e) => handleItemChange(idx, 'discountRate', Number(e.target.value))}
                            className="w-full h-8 text-center text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-800 font-mono"
                          />
                        </td>

                        {/* KDV % */}
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.taxRate}
                            onChange={(e) => handleItemChange(idx, 'taxRate', Number(e.target.value))}
                            className="w-full h-8 text-center text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-800 font-mono"
                          />
                        </td>

                        {/* Tutar */}
                        <td className="p-2 text-right border-r border-slate-100 font-mono font-bold text-slate-900">
                          {formatCurrency(lineTotal)}
                        </td>

                        {/* Sil */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={orderItems.length <= 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors p-1"
                            title="Kalemi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dip Toplamlar & Kaydet Butonları */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-3 border-t border-slate-200">
            <div className="flex flex-wrap gap-4 text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-2 rounded">
              <div>
                <span className="text-slate-500">Ara Toplam: </span>
                <span className="font-bold text-slate-800">{formatCurrency(orderTotals.subtotal)}</span>
              </div>
              {orderTotals.totalDiscount > 0 && (
                <div>
                  <span className="text-amber-600">İskonto (-): </span>
                  <span className="font-bold text-amber-700">{formatCurrency(orderTotals.totalDiscount)}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">KDV (+): </span>
                <span className="font-bold text-slate-800">{formatCurrency(orderTotals.totalTax)}</span>
              </div>
              <div className="border-l border-slate-300 pl-3">
                <span className="text-slate-700 font-semibold">Genel Toplam: </span>
                <span className="font-bold text-emerald-700 text-sm">{formatCurrency(orderTotals.grandTotal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end">
              <Button type="button" size="sm" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" size="sm" variant="primary" className="bg-slate-900 hover:bg-slate-800 text-white">
                Siparişi Kaydet (DRAFT)
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Resmi Sipariş Onay Formu Baskı Önizleme Penceresi */}
      <OfficialReportModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        reportType="ORDER"
        order={selectedOrder}
      />
    </div>
  );
};
