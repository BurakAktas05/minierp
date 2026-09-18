import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
  Save,
  Info,
  Truck,
} from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { partnerApi } from '../api/partnerApi';
import { inventoryApi } from '../api/inventoryApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import { useSelectablePartners } from '../hooks/useSelectablePartners';
import {
  OrderType,
  BusinessPartner,
  Product,
} from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getTurkishStatusLabel } from '../components/common/StatusBadge';

interface OrderFormItem {
  variantId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  priceSource?: 'PARTNER_PRICE' | 'PARTNER_LAST_PRICE' | 'DEFAULT_PRICE' | 'MANUAL';
}

export const OrderCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const { toast } = useToast();

  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form durumları
  const [orderType, setOrderType] = useState<OrderType>('SALES_ORDER');
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<OrderFormItem[]>([
    { variantId: 0, description: '', quantity: 1, unitPrice: 0, discountRate: 0, taxRate: 20, priceSource: 'DEFAULT_PRICE' },
  ]);

  // Stok bakiyeleriyle birlikte düzleştirilmiş varyant listesi
  const allVariants = useMemo(() => {
    const list: Array<{
      id: number;
      productId: number;
      productName: string;
      productCode: string;
      productType?: string;
      sku: string;
      variantName: string;
      salePrice: number;
      purchasePrice: number;
      taxRate: number;
      availableStock: number;
      stockQuantity: number;
    }> = [];

    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        list.push({
          id: v.id,
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          productType: p.productType,
          sku: v.sku,
          variantName: v.variantName || v.sku,
          salePrice: Number(v.salePrice ?? p.basePrice ?? 0),
          purchasePrice: Number(v.purchasePrice ?? 0),
          taxRate: Number(p.taxRate ?? 20),
          availableStock: Number(v.availableStock ?? 0),
          stockQuantity: Number(v.stockQuantity ?? 0),
        });
      });
    });

    // Satış Siparişinde Mamul & Hizmetleri öne al, Hammaddeleri en sona koy
    list.sort((a, b) => {
      const typeRank = (t?: string) => {
        if (t === 'FINISHED_GOOD' || t === 'COMMERCIAL_GOOD') return 1;
        if (t === 'SERVICE') return 2;
        if (t === 'SEMI_FINISHED') return 3;
        if (t === 'RAW_MATERIAL') return 4;
        return 5;
      };
      return typeRank(a.productType) - typeRank(b.productType);
    });

    return list;
  }, [products]);

  // Dinamik cari hesap seçimi ve filtreleme (kendi firmasını otomatik hariç tutar)
  const {
    selectablePartners,
    selectedPartnerId: partnerId,
    setSelectedPartnerId: setPartnerId,
    selectedPartner,
    isSelf,
  } = useSelectablePartners({
    partners,
    direction: orderType === 'SALES_ORDER' ? 'CUSTOMER' : 'SUPPLIER',
  });

  // Başlangıç ana verilerini yükle
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoading(true);
        const [partList, prodList] = await Promise.all([
          partnerApi.getPartners(),
          inventoryApi.getProducts(),
        ]);
        setPartners(partList);
        setProducts(prodList);
      } catch (err) {
        console.error('Master data yüklenemedi:', err);
        toast.error('Cari ve ürün listesi yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
  }, [toast]);


  // Varyantlar yüklendiğinde ilk satırı otomatik hazırla
  useEffect(() => {
    if (allVariants.length > 0 && orderItems.length === 1 && orderItems[0].variantId === 0) {
      const v = allVariants[0];
      const defaultPrice = orderType === 'SALES_ORDER' ? v.salePrice : v.purchasePrice;
      setOrderItems([
        {
          variantId: v.id,
          description: `${v.productName} - ${v.variantName}`,
          quantity: 1,
          unitPrice: Number(defaultPrice || 0),
          discountRate: 0,
          taxRate: v.taxRate,
          priceSource: 'DEFAULT_PRICE',
        },
      ]);
    }
  }, [allVariants, orderType]);

  const handleVariantSelect = (index: number, vId: number) => {
    const selected = allVariants.find((v) => v.id === vId);
    const copy = [...orderItems];
    if (selected) {
      const defaultPrice = orderType === 'SALES_ORDER' ? selected.salePrice : selected.purchasePrice;
      copy[index] = {
        ...copy[index],
        variantId: selected.id,
        description: `${selected.productName} - ${selected.variantName}`,
        unitPrice: Number(defaultPrice || 0),
        taxRate: selected.taxRate,
        priceSource: 'DEFAULT_PRICE',
      };
    } else {
      copy[index] = { ...copy[index], variantId: vId };
    }
    setOrderItems(copy);
  };

  const handleAddItem = () => {
    const v = allVariants[0];
    const defaultPrice = v ? (orderType === 'SALES_ORDER' ? v.salePrice : v.purchasePrice) : 0;
    setOrderItems([
      ...orderItems,
      {
        variantId: v ? v.id : 0,
        description: v ? `${v.productName} - ${v.variantName}` : '',
        quantity: 1,
        unitPrice: Number(defaultPrice || 0),
        discountRate: 0,
        taxRate: v ? v.taxRate : 20,
        priceSource: 'DEFAULT_PRICE',
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
    // Fiyat elle değiştirildiğinde priceSource'u MANUAL yap
    if (field === 'unitPrice') {
      copy[index].priceSource = 'MANUAL';
    }
    setOrderItems(copy);
  };

  // Finansal toplam hesaplamaları (Ara toplam, KDV, İskonto, Genel Toplam)
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

  const handleSubmit = async (confirmImmediately: boolean = false) => {
    const chosen = partners.find((p) => p.id === partnerId);
    if (!chosen || !partnerId) {
      toast.error('Lütfen bir cari hesap seçin.');
      return;
    }

    if (isSelf(chosen)) {
      toast.error('Kendi firmanıza sipariş düzenleyemezsiniz! Lütfen bir müşteri veya tedarikçi seçiniz.');
      return;
    }


    const invalidItem = orderItems.find((it) => !it.variantId || it.quantity <= 0);
    if (invalidItem) {
      toast.error('Lütfen tüm kalemlerde geçerli ürün ve miktar seçin.');
      return;
    }

    if (confirmImmediately && !isManager) {
      toast.error('Siparişi doğrudan onaylamak için Yönetici yetkisi gereklidir.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        partnerId,
        type: orderType,
        orderType,
        notes: notes.trim() || undefined,
        items: orderItems.map((it) => ({
          variantId: it.variantId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          taxRate: Number(it.taxRate),
          description: it.description || undefined,
        })),
      };

      const createdOrder = await orderApi.createOrder(payload);

      if (confirmImmediately) {
        await orderApi.updateStatus(createdOrder.id, 'CONFIRMED');
        toast.success(
          `#${createdOrder.orderNumber} nolu sipariş kaydedildi ve ONAYLANDI! RabbitMQ ile stok rezerve edildi.`
        );
      } else {
        toast.success(`#${createdOrder.orderNumber} nolu sipariş taslak olarak başarıyla kaydedildi.`);
      }

      navigate('/orders');
    } catch (err: any) {
      console.error('Sipariş oluşturulamadı:', err);
      toast.error(err?.response?.data?.message || 'Sipariş oluşturulurken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* 1. Üst Başlık ve Hızlı Navigasyon Barı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/orders')}
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Sipariş Listesine Dön
          </Button>

          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Yeni Sipariş Girişi
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                Taslak Form
              </span>
            </div>
            <p className="text-xs text-slate-500">
              B2B kurumsal sipariş mektubunu detaylı kalem ve vergi hesaplamalarıyla sisteme işleyin
            </p>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/orders')}
            disabled={submitting}
            className="text-xs"
          >
            İptal
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit(false)}
            disabled={submitting || loading}
            className="flex items-center gap-1.5 text-xs border-slate-300 hover:bg-slate-50"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            Taslak Olarak Kaydet
          </Button>
          <Button
            size="sm"
            onClick={() => handleSubmit(true)}
            disabled={submitting || loading}
            className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Kaydet & Onayla (Stok Rezerve Et)
          </Button>
        </div>
      </div>

      {/* 2. Sipariş Üst Bilgileri & Cari Kartı */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sol Panel: Belge Üst Bilgileri */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Layers className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Sipariş Başlık Bilgileri
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sipariş Türü <span className="text-red-500">*</span>
              </label>
              <select
                value={orderType}
                onChange={(e) => {
                  const newT = e.target.value as OrderType;
                  setOrderType(newT);
                  // Fiyatlar useEffect'te partnerId/orderType değiştiğinde otomatik güncellenecek
                }}
                className="w-full h-9 text-xs bg-slate-50 border border-slate-300 rounded px-3 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
              >
                <option value="SALES_ORDER">Müşteri Satış Siparişi (Stok Rezerve Edilir)</option>
                <option value="PURCHASE_ORDER">Tedarikçi Satın Alma Siparişi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sipariş Tarihi <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Termin / Teslim Tarihi
              </label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                İlgili Depo
              </label>
              <input
                type="text"
                readOnly
                value="WH-MRK-01 (Merkez Ana Depo)"
                className="w-full h-9 text-xs bg-slate-100 border border-slate-200 rounded px-3 text-slate-600 font-medium cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sipariş Notu & Özel Şartlar
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Örn: 2 parti halinde teslim edilecek, palet ambalaj şartı var."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:border-indigo-600"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Sağ Panel: Cari Hesap Seçimi & Canlı Bilgi Kartı */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Cari Hesap Seçimi
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">Vergi & Bakiye Özeti</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                İş Ortağı {orderType === 'SALES_ORDER' ? '(Müşteri)' : '(Tedarikçi)'} <span className="text-red-500">*</span>
              </label>
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(Number(e.target.value))}
                className="w-full h-9 text-xs bg-slate-50 border border-slate-300 rounded px-3 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
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


            {/* Seçilen Cari Bilgi Kartı */}
            {selectedPartner && (
              <div className="mt-3 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-800">{selectedPartner.title}</span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    {getTurkishStatusLabel(selectedPartner.type)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block">Cari Kodu:</span>
                    <span className="font-mono font-medium">{selectedPartner.code}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Vergi No / Dairesi:</span>
                    <span>
                      {selectedPartner.taxNumber || '-'}{' '}
                      {selectedPartner.taxOffice ? `(${selectedPartner.taxOffice})` : ''}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Adres:</span>
                    <span className="text-slate-700 truncate block">
                      {selectedPartner.address || 'Kayıtlı adres bulunmuyor'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded text-[11px] text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>
              Sipariş onaylandığında sistem, seçili ürünler için asenkron <strong>RabbitMQ</strong> stok rezervasyonu
              yapar. Satılabilir stok düşer, fiili stok irsaliye sevkine kadar depoda korunur.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sipariş Kalemleri Tablosu (Tam Genişlikli Grid) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Sipariş Kalemleri
            </h2>
            <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
              {orderItems.length} Kalem
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Yeni Satır Ekle
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="p-2.5 w-10 text-center">#</th>
                <th className="p-2.5 min-w-[260px]">Ürün / Varyant Seçimi</th>
                <th className="p-2.5 min-w-[140px]">Stok Mevcudu</th>
                <th className="p-2.5 w-24 text-right">Miktar</th>
                <th className="p-2.5 w-32 text-right">Birim Fiyat</th>
                <th className="p-2.5 w-20 text-right">İskonto %</th>
                <th className="p-2.5 w-20 text-right">KDV %</th>
                <th className="p-2.5 w-32 text-right">Satır Toplamı</th>
                <th className="p-2.5 w-12 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orderItems.map((item, idx) => {
                const gross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                const disc = (gross * (Number(item.discountRate) || 0)) / 100;
                const net = gross - disc;
                const tax = (net * (Number(item.taxRate) || 0)) / 100;
                const lineTot = net + tax;

                const selectedVariant = allVariants.find((v) => v.id === item.variantId);

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-2.5 text-center font-mono text-slate-400 font-semibold">
                      {idx + 1}
                    </td>

                    {/* Ürün & Varyant Dropdown */}
                    <td className="p-2.5">
                      <select
                        value={item.variantId}
                        onChange={(e) => handleVariantSelect(idx, Number(e.target.value))}
                        className="w-full h-8 text-xs bg-white border border-slate-300 rounded px-2 focus:outline-none focus:border-indigo-600"
                        required
                      >
                        <option value={0} disabled>
                          -- Ürün Seçiniz --
                        </option>
                        {allVariants.map((v) => {
                          const typeBadge =
                            v.productType === 'RAW_MATERIAL'
                              ? '[Hammadde]'
                              : v.productType === 'SERVICE'
                              ? '[Hizmet]'
                              : '[Mamul]';
                          return (
                            <option key={v.id} value={v.id}>
                              {typeBadge} [{v.productCode}] {v.productName} — {v.variantName}
                            </option>
                          );
                        })}
                      </select>
                    </td>

                    {/* Stok Durumu Rozeti */}
                    <td className="p-2.5">
                      {selectedVariant ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              selectedVariant.availableStock > 10
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : selectedVariant.availableStock > 0
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {selectedVariant.availableStock} Adet
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (Fiili: {selectedVariant.stockQuantity})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Miktar */}
                    <td className="p-2.5 text-right">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value)))
                        }
                        className="h-8 text-xs text-right font-mono font-semibold w-24 ml-auto"
                        required
                      />
                    </td>

                    {/* Birim Fiyat */}
                    <td className="p-2.5 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(idx, 'unitPrice', Number(e.target.value))
                          }
                          className="h-8 text-xs text-right font-mono font-medium w-32 ml-auto"
                          required
                        />
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                            item.priceSource === 'MANUAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {item.priceSource === 'MANUAL' ? '✏️ Özel Fiyat' : '⚙️ Liste Fiyatı'}
                        </span>
                      </div>
                    </td>

                    {/* İskonto % */}
                    <td className="p-2.5 text-right">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={item.discountRate}
                        onChange={(e) =>
                          handleItemChange(idx, 'discountRate', Number(e.target.value))
                        }
                        className="h-8 text-xs text-right font-mono w-20 ml-auto"
                      />
                    </td>

                    {/* KDV % */}
                    <td className="p-2.5 text-right">
                      <select
                        value={item.taxRate}
                        onChange={(e) =>
                          handleItemChange(idx, 'taxRate', Number(e.target.value))
                        }
                        className="h-8 text-xs text-right font-mono bg-white border border-slate-300 rounded px-2 w-20 ml-auto"
                      >
                        <option value={0}>%0</option>
                        <option value={1}>%1</option>
                        <option value={10}>%10</option>
                        <option value={20}>%20</option>
                      </select>
                    </td>

                    {/* Satır Toplamı */}
                    <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(lineTot)}
                    </td>

                    {/* Silme */}
                    <td className="p-2.5 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Satırı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Dip Toplamlar ve Alt İcmal Bölümü */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
        {/* Sol Alan: Sipariş Bilgilendirmesi & Açıklama */}
        <div className="md:col-span-7 bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-slate-500" />
            Sipariş Açıklaması & Şartlar
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Bu belge resmi bir müşteri satış siparişidir. Onaylandığında seçili ürün varyantları için depoda stok rezervasyonu yapılır.
            Fiziki teslimat ve sevkiyat işlemi İrsaliye modülü üzerinden irsaliyeleştirilerek gerçekleştirilir.
          </p>
        </div>

        {/* Sağ Alan: Finansal İcmal Kutusu */}
        <div className="md:col-span-5 bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-2.5">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-2">
            Finansal İcmal
          </div>

          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>Kalemler Ara Toplamı:</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatCurrency(orderTotals.subtotal)}
            </span>
          </div>

          {orderTotals.totalDiscount > 0 && (
            <div className="flex justify-between items-center text-xs text-rose-600">
              <span>Toplam İskonto Tutarı:</span>
              <span className="font-mono font-semibold">
                -{formatCurrency(orderTotals.totalDiscount)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>Hesaplanan KDV (%20):</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatCurrency(orderTotals.totalTax)}
            </span>
          </div>

          {/* Genel Toplam Büyük Kutu */}
          <div className="flex justify-between items-center bg-slate-900 text-white p-3.5 rounded-lg shadow-sm mt-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">
                Ödenecek / Fatura Edilecek
              </span>
              <span className="font-bold text-xs uppercase tracking-wide">Genel Toplam</span>
            </div>
            <span className="text-xl font-black font-mono text-emerald-400">
              {formatCurrency(orderTotals.grandTotal)}
            </span>
          </div>

          {/* Alt Butonlar */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit(false)}
              disabled={submitting || loading}
              className="text-xs"
            >
              Taslak Kaydet
            </Button>
            <Button
              size="sm"
              onClick={() => handleSubmit(true)}
              disabled={submitting || loading}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Kaydet & Onayla
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OrderCreatePage;
