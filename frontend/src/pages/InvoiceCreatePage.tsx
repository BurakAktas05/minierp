import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ReceiptText,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  Layers,
  Save,
  Info,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { invoiceApi } from '../api/invoiceApi';
import { partnerApi } from '../api/partnerApi';
import { inventoryApi } from '../api/inventoryApi';
import { useToast } from '../context/ToastContext';
import {
  InvoiceType,
  BusinessPartner,
  Product,
} from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const formatCurrency = (amount: number = 0, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
};

interface InvoiceFormItem {
  variantId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
}

export const InvoiceCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form durumları
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('SALES_INVOICE');
  const [partnerId, setPartnerId] = useState<number>(0);
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  );
  const [currency, setCurrency] = useState('TRY');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceFormItem[]>([
    { description: '', quantity: 1, unitPrice: 0, discountRate: 0, taxRate: 20 },
  ]);

  // Otomatik tamamlama için düzleştirilmiş varyant listesi
  const allVariants = useMemo(() => {
    const list: Array<{
      id: number;
      productName: string;
      productCode: string;
      variantName: string;
      salePrice: number;
      purchasePrice: number;
      taxRate: number;
    }> = [];

    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        list.push({
          id: v.id,
          productName: p.name,
          productCode: p.code,
          variantName: v.variantName || v.sku,
          salePrice: Number(v.salePrice ?? p.basePrice ?? 0),
          purchasePrice: Number(v.purchasePrice ?? 0),
          taxRate: Number(p.taxRate ?? 20),
        });
      });
    });
    return list;
  }, [products]);

  // Seçilen cari hesap
  const selectedPartner = useMemo(() => {
    return partners.find((p) => p.id === partnerId) || null;
  }, [partners, partnerId]);

  // Ana verileri yükle
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
        if (partList.length > 0) {
          setPartnerId(partList[0].id);
        }
      } catch (err) {
        console.error('Master data yüklenemedi:', err);
        toast.error('Cari ve ürün listesi yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
  }, [toast]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: 'Hizmet / Ürün Kalemi',
        quantity: 1,
        unitPrice: 1000,
        discountRate: 0,
        taxRate: 20,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.warning('Faturada en az bir satır bulunmalıdır.');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceFormItem, value: any) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: value };
    setItems(copy);
  };

  const handleSelectProductForLine = (index: number, variantId: number) => {
    const v = allVariants.find((x) => x.id === variantId);
    if (!v) return;
    const copy = [...items];
    copy[index] = {
      ...copy[index],
      variantId: v.id,
      description: `${v.productName} - ${v.variantName}`,
      unitPrice: invoiceType === 'SALES_INVOICE' ? v.salePrice : v.purchasePrice,
      taxRate: v.taxRate,
    };
    setItems(copy);
  };

  // Finansal toplamlar
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach((it) => {
      const gross = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
      const disc = (gross * (Number(it.discountRate) || 0)) / 100;
      const net = gross - disc;
      const tax = (net * (Number(it.taxRate) || 0)) / 100;

      subtotal += gross;
      totalDiscount += disc;
      totalTax += tax;
    });

    const netTaxable = subtotal - totalDiscount;
    const grandTotal = netTaxable + totalTax;

    return { subtotal, totalDiscount, netTaxable, totalTax, grandTotal };
  }, [items]);

  const handleSubmit = async (approveImmediately: boolean = true) => {
    if (!partnerId) {
      toast.error('Lütfen bir cari hesap seçin.');
      return;
    }

    const invalidItem = items.find(
      (it) => !it.description.trim() || Number(it.quantity) <= 0 || Number(it.unitPrice) < 0
    );
    if (invalidItem) {
      toast.error('Lütfen tüm kalemlerde geçerli açıklama, miktar ve birim fiyat girin.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        invoiceType,
        partnerId,
        invoiceDate,
        dueDate,
        currency,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          variantId: it.variantId,
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          discountRate: Number(it.discountRate || 0),
          taxRate: Number(it.taxRate || 20),
        })),
      };

      const created = await invoiceApi.createInvoice(payload);

      if (approveImmediately) {
        await invoiceApi.updateInvoiceStatus(created.id, 'APPROVED');
        toast.success(
          `#${created.invoiceNumber} nolu fatura başarıyla oluşturuldu, muhasebeleştirildi ve cari hesaba işlendi.`
        );
      } else {
        toast.success(
          `#${created.invoiceNumber} nolu fatura taslak olarak kaydedildi.`
        );
      }

      navigate('/invoices');
    } catch (err: any) {
      console.error('Fatura oluşturulamadı:', err);
      toast.error(err?.response?.data?.message || 'Fatura oluşturulurken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* 1. Üst Başlık & Hızlı Navigasyon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Fatura Listesine Dön
          </Button>

          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-emerald-600" />
                Yeni Fatura Düzenle
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Resmi Mali Belge
              </span>
            </div>
            <p className="text-xs text-slate-500">
              E-Fatura ve E-Arşiv formatında kurumsal cari fatura düzenleyin ve muhasebeleştirin
            </p>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/invoices')}
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
            className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Faturayı Kaydet & Muhasebeleştir
          </Button>
        </div>
      </div>

      {/* 2. Fatura Başlık Bilgileri & Cari Kartı */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sol Panel: Belge Bilgileri */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Layers className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Fatura Başlık & Tarih Bilgileri
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fatura Türü <span className="text-red-500">*</span>
              </label>
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
                className="w-full h-9 text-xs bg-slate-50 border border-slate-300 rounded px-3 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="SALES_INVOICE">Satış Faturası (Alacak Doğurur)</option>
                <option value="PURCHASE_INVOICE">Alış Faturası (Borç Doğurur)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fatura Tarihi <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vade Tarihi
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Para Birimi
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 text-xs bg-slate-50 border border-slate-300 rounded px-3 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="TRY">TRY — Türk Lirası (₺)</option>
                <option value="USD">USD — Amerikan Doları ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fatura Genel Açıklaması / Sipariş & İrsaliye No
              </label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Örn: 2026/09 Dönemi ERP Danışmanlık ve Bakım Bedeli"
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Sağ Panel: Cari Hesap Seçimi & Mali Kimlik Kartı */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Muhatap Cari Hesap
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">Vergi & Bakiye Detayı</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cari Seçimi <span className="text-red-500">*</span>
              </label>
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(Number(e.target.value))}
                className="w-full h-9 text-xs bg-slate-50 border border-slate-300 rounded px-3 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
                required
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.title} ({p.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Cari Bilgi Kartı */}
            {selectedPartner && (
              <div className="mt-3 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-800">{selectedPartner.title}</span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {selectedPartner.type}
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

          <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded text-[11px] text-emerald-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              Fatura kaydedildiği an PostgreSQL veritabanındaki cari hareket tablosuna işlenir ve carinin
              açık bakiye alacağı/borcu doğrudan güncellenir.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Fatura Kalemleri Tablosu */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Fatura Kalemleri & Hizmet Satırları
            </h2>
            <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
              {items.length} Kalem
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
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
                <th className="p-2.5 min-w-[280px]">Hizmet / Ürün Açıklaması</th>
                <th className="p-2.5 min-w-[180px]">Hızlı Ürün Şablonu</th>
                <th className="p-2.5 w-24 text-right">Miktar</th>
                <th className="p-2.5 w-32 text-right">Birim Fiyat</th>
                <th className="p-2.5 w-20 text-right">İskonto %</th>
                <th className="p-2.5 w-20 text-right">KDV %</th>
                <th className="p-2.5 w-32 text-right">Satır Tutarı</th>
                <th className="p-2.5 w-12 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => {
                const gross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                const disc = (gross * (Number(item.discountRate) || 0)) / 100;
                const net = gross - disc;
                const tax = (net * (Number(item.taxRate) || 0)) / 100;
                const lineTot = net + tax;

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-2.5 text-center font-mono text-slate-400 font-semibold">
                      {idx + 1}
                    </td>

                    {/* Açıklama */}
                    <td className="p-2.5">
                      <Input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="Hizmet veya ürün açıklaması girin"
                        className="h-8 text-xs font-medium"
                        required
                      />
                    </td>

                    {/* Hızlı Şablon Dropdown */}
                    <td className="p-2.5">
                      <select
                        onChange={(e) => {
                          const vId = Number(e.target.value);
                          if (vId) handleSelectProductForLine(idx, vId);
                        }}
                        className="w-full h-8 text-xs bg-slate-50 border border-slate-300 rounded px-2 text-slate-600 focus:outline-none"
                      >
                        <option value="">-- Üründen Doldur (Opsiyonel) --</option>
                        {allVariants.map((v) => (
                          <option key={v.id} value={v.id}>
                            [{v.productCode}] {v.productName} ({v.variantName})
                          </option>
                        ))}
                      </select>
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

                    {/* Satır Tutarı */}
                    <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(lineTot, currency)}
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

      {/* 4. Dip Toplamlar & Muhasebe İcmali */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
        {/* Sol Alan: Maliye & E-Fatura Notu */}
        <div className="md:col-span-7 bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4 text-slate-500" />
            Ödeme ve Tahsilat Şartları
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-700 block">Vade Kuralı:</span>
              <span>Net 30 gün içinde Banka Havalesi / EFT</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700 block">Tahsilat Entegrasyonu:</span>
              <span>Fatura oluştuktan sonra "Tahsilat Ekle" ile kasa/banka hareketi işlenebilir</span>
            </div>
          </div>
        </div>

        {/* Sağ Alan: Finansal İcmal Kutusu */}
        <div className="md:col-span-5 bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-2.5">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-2">
            Vergi & Finansal Dağılım
          </div>

          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>Matrah (KDV Hariç):</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatCurrency(totals.netTaxable, currency)}
            </span>
          </div>

          {totals.totalDiscount > 0 && (
            <div className="flex justify-between items-center text-xs text-rose-600">
              <span>Toplam İskonto:</span>
              <span className="font-mono font-semibold">
                -{formatCurrency(totals.totalDiscount, currency)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>Hesaplanan KDV (%20):</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatCurrency(totals.totalTax, currency)}
            </span>
          </div>

          {/* Genel Toplam Büyük Kutu */}
          <div className="flex justify-between items-center bg-slate-900 text-white p-3.5 rounded-lg shadow-sm mt-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">
                Ödenecek / Tahsil Edilecek Tutar
              </span>
              <span className="font-bold text-xs uppercase tracking-wide">Fatura Genel Toplamı</span>
            </div>
            <span className="text-xl font-black font-mono text-emerald-400">
              {formatCurrency(totals.grandTotal, currency)}
            </span>
          </div>

          {/* Alt Butonlar */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/invoices')}
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
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Faturayı Kaydet & Muhasebeleştir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InvoiceCreatePage;
