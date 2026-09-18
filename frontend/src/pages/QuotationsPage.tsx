import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  Printer,
  Eye,
  Trash2,
} from 'lucide-react';
import { quotationApi } from '../api/quotationApi';
import { orderApi } from '../api/orderApi';
import { partnerApi } from '../api/partnerApi';
import { inventoryApi } from '../api/inventoryApi';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useSelectablePartners } from '../hooks/useSelectablePartners';
import {
  Quotation,
  QuotationType,
  QuotationStatus,
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

export const QuotationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SALES' | 'PURCHASE' | 'ACCEPTED' | 'DRAFT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);

  // Modallar
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Yeni teklif formu durumu
  interface FormItem {
    variantId: number;
    description: string;
    quantity: number;
    unitPrice: number;
    discountRate: number;
    taxRate: number;
  }

  const [quoteType, setQuoteType] = useState<QuotationType>('SALES');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<FormItem[]>([
    { variantId: 0, description: '', quantity: 1, unitPrice: 0, discountRate: 0, taxRate: 20 },
  ]);

  // Cari listesini dinamik olarak filtrele ve yönet (kendi firmasını otomatik hariç tutar)
  const {
    selectablePartners,
    selectedPartnerId,
    setSelectedPartnerId,
    isSelf,
  } = useSelectablePartners({
    partners,
    direction: quoteType === 'SALES' ? 'CUSTOMER' : 'SUPPLIER',
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [quoteList, partList, prodList] = await Promise.all([
        quotationApi.getQuotations(),
        partnerApi.getPartners(),
        inventoryApi.getProducts(),
      ]);
      setQuotations(quoteList);
      setPartners(partList);
      setProducts(prodList);
      if (selectedQuote) {
        const found = quoteList.find((q) => q.id === selectedQuote.id);
        setSelectedQuote(found || null);
      }
    } catch (err) {
      console.error('Teklifler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);

  // İlk yüklemede veya modal açıldığında ilk geçerli varyantı ata
  useEffect(() => {
    if (allVariants.length > 0 && items.length === 1 && items[0].variantId === 0) {
      const v = allVariants[0];
      setItems([
        {
          variantId: v.id,
          description: `${v.productName} - ${v.variantName}`,
          quantity: 1,
          unitPrice: quoteType === 'SALES' ? v.salePrice : v.purchasePrice,
          discountRate: 0,
          taxRate: v.taxRate,
        },
      ]);
    }
  }, [allVariants, quoteType]);

  const handleVariantSelect = (index: number, variantId: number) => {
    const selected = allVariants.find((v) => v.id === variantId);
    const copy = [...items];
    if (selected) {
      copy[index] = {
        ...copy[index],
        variantId: selected.id,
        description: `${selected.productName} - ${selected.variantName}`,
        unitPrice: quoteType === 'SALES' ? selected.salePrice : selected.purchasePrice,
        taxRate: selected.taxRate,
      };
    } else {
      copy[index] = { ...copy[index], variantId };
    }
    setItems(copy);
  };

  const handleAddItem = () => {
    const v = allVariants[0];
    setItems([
      ...items,
      {
        variantId: v ? v.id : 0,
        description: v ? `${v.productName} - ${v.variantName}` : '',
        quantity: 1,
        unitPrice: v ? (quoteType === 'SALES' ? v.salePrice : v.purchasePrice) : 0,
        discountRate: 0,
        taxRate: v ? v.taxRate : 20,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.warning('Teklifte en az bir kalem bulunmalıdır.');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: value };
    setItems(copy);
  };

  const quoteTotals = useMemo(() => {
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

    const grandTotal = subtotal - totalDiscount + totalTax;
    return { subtotal, totalDiscount, totalTax, grandTotal };
  }, [items]);

  // Durum Güncelle
  const handleUpdateStatus = async (status: QuotationStatus) => {
    if (!selectedQuote) return;
    try {
      await quotationApi.updateStatus(selectedQuote.id, status);
      toast.success(`Teklif durumu güncellendi: ${getTurkishStatusLabel(status)}`);
      await loadData();
    } catch (err: any) {
      toast.error('Durum güncellenirken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Tekliften Siparişe Dönüştür
  const handleConvertToOrder = async () => {
    if (!selectedQuote) return;
    if (selectedQuote.status !== 'ACCEPTED') {
      toast.warning('Yalnızca MÜŞTERİ TARAFINDAN KABUL EDİLEN (ACCEPTED) teklifler resmi siparişe dönüştürülebilir.');
      return;
    }

    try {
      await orderApi.createOrderFromQuotation(selectedQuote.id);
      toast.success('Teklif başarıyla resmi siparişe dönüştürüldü.');
      navigate('/orders');
    } catch (err: any) {
      toast.error('Siparişe dönüştürülürken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Yeni Teklif Kaydet
  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenPartner = partners.find((p) => p.id === selectedPartnerId);
    if (!chosenPartner || !selectedPartnerId) {
      toast.warning('Lütfen geçerli bir cari hesap seçiniz.');
      return;
    }


    if (isSelf(chosenPartner)) {
      toast.error('Kendi firmanıza teklif düzenleyemezsiniz! Lütfen bir müşteri veya tedarikçi seçiniz.');
      return;
    }


    if (items.some((it) => !it.variantId || it.variantId === 0)) {
      toast.warning('Lütfen tüm kalemler için geçerli bir ürün/varyant seçiniz.');
      return;
    }


    try {
      await quotationApi.createQuotation({
        type: quoteType,
        partnerId: selectedPartnerId,
        validUntil: validUntil ? (validUntil.includes('T') ? validUntil : `${validUntil}T23:59:59Z`) : undefined,
        notes: notes || undefined,
        items: items.map((it) => ({
          variantId: it.variantId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          discountRate: Number(it.discountRate || 0),
          taxRate: Number(it.taxRate || 20),
          description: it.description || undefined,
        })),
      });

      toast.success('Teklif başarıyla oluşturuldu.');
      setCreateModalOpen(false);
      setNotes('');
      // Formu sıfırla
      if (allVariants.length > 0) {
        const v = allVariants[0];
        setItems([
          {
            variantId: v.id,
            description: `${v.productName} - ${v.variantName}`,
            quantity: 1,
            unitPrice: quoteType === 'SALES' ? v.salePrice : v.purchasePrice,
            discountRate: 0,
            taxRate: v.taxRate,
          },
        ]);
      }
      await loadData();
    } catch (err: any) {
      toast.error('Teklif oluşturulurken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtrelenmiş teklifler
  const filteredQuotes = useMemo(() => {
    return quotations.filter((q) => {
      if (activeTab === 'SALES' && q.type !== 'SALES') return false;
      if (activeTab === 'PURCHASE' && q.type !== 'PURCHASE') return false;
      if (activeTab === 'ACCEPTED' && q.status !== 'ACCEPTED') return false;
      if (activeTab === 'DRAFT' && q.status !== 'DRAFT') return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          q.quotationNumber.toLowerCase().includes(term) ||
          (q.partnerTitle && q.partnerTitle.toLowerCase().includes(term)) ||
          (q.notes && q.notes.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [quotations, activeTab, searchTerm]);

  // Toplamlar
  const totalAmountSum = useMemo(() => {
    return filteredQuotes.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
  }, [filteredQuotes]);

  const acceptedAmountSum = useMemo(() => {
    return filteredQuotes
      .filter((q) => q.status === 'ACCEPTED')
      .reduce((sum, q) => sum + (q.totalAmount || 0), 0);
  }, [filteredQuotes]);

  // Tablo sütun tanımları
  const columns: Column<Quotation>[] = [
    {
      id: 'quotationNumber',
      header: 'Teklif No',
      width: '160px',
      accessor: (q) => (
        <span className="font-mono font-bold text-slate-900">{q.quotationNumber}</span>
      ),
    },
    {
      id: 'issueDate',
      header: 'Teklif Tarihi',
      width: '110px',
      accessor: (q) => <span className="font-mono text-slate-600">{formatDate(q.issueDate)}</span>,
    },
    {
      id: 'validUntil',
      header: 'Geçerlilik',
      width: '110px',
      accessor: (q) => <span className="font-mono text-slate-600">{formatDate(q.validUntil)}</span>,
    },
    {
      id: 'type',
      header: 'Teklif Yönü',
      width: '150px',
      accessor: (q) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
            q.type === 'SALES'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}
        >
          {q.type === 'SALES' ? 'Verilen Teklif (Satış)' : 'Alınan Teklif (Alış)'}
        </span>
      ),
    },
    {
      id: 'partner',
      header: 'Cari Hesap Unvanı',
      accessor: (q) => (
        <span className="font-medium text-slate-900 truncate block max-w-xs">
          {q.partnerTitle || 'Cari Hesap'}
        </span>
      ),
    },
    {
      id: 'itemCount',
      header: 'Kalem',
      align: 'center',
      width: '80px',
      accessor: (q) => (
        <span className="font-mono text-slate-700 font-semibold">
          {q.items ? q.items.length : 0} adet
        </span>
      ),
    },
    {
      id: 'totalAmount',
      header: 'Genel Toplam',
      align: 'right',
      width: '130px',
      accessor: (q) => (
        <span className="font-bold font-mono text-slate-900">{formatCurrency(q.totalAmount)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Teklif Durumu',
      align: 'center',
      width: '120px',
      accessor: (q) => <StatusBadge status={q.status} />,
    },
  ];

  return (
    <div className="space-y-0 select-none">
      {/* 1. DİA ERP Toolbar */}
      <ErpToolbar
        title="B2B Teklif Yönetimi"
        subtitle="Verilen (Satış) & Alınan (Satın Alma) Teklifleri"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Teklif no veya cari unvanı ile ara..."
        onRefresh={loadData}
        actions={[
          {
            label: 'Yeni Teklif',
            icon: <Plus className="w-3.5 h-3.5 text-white" />,
            onClick: () => setCreateModalOpen(true),
            variant: 'primary',
          },
          {
            label: 'Siparişe Dönüştür',
            icon: <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />,
            onClick: handleConvertToOrder,
            disabled: !selectedQuote || selectedQuote.status !== 'ACCEPTED',
            title: 'Kabul edilen teklifi resmi siparişe dönüştürür',
          },
          {
            label: 'Kabul Et',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />,
            onClick: () => handleUpdateStatus('ACCEPTED'),
            disabled: !selectedQuote || (selectedQuote.status !== 'DRAFT' && selectedQuote.status !== 'SENT'),
          },
          {
            label: 'Gönder (SENT)',
            icon: <Send className="w-3.5 h-3.5 text-amber-600" />,
            onClick: () => handleUpdateStatus('SENT'),
            disabled: !selectedQuote || selectedQuote.status !== 'DRAFT',
          },
          {
            label: 'Reddet',
            icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
            onClick: () => handleUpdateStatus('REJECTED'),
            disabled: !selectedQuote || selectedQuote.status === 'CONVERTED' || selectedQuote.status === 'REJECTED',
          },
          {
            label: 'İncele / Detay',
            icon: <Eye className="w-3.5 h-3.5 text-slate-700" />,
            onClick: () => {
              if (!selectedQuote) {
                toast.warning('Lütfen incelemek istediğiniz teklifi seçiniz.');
                return;
              }
              setDetailModalOpen(true);
            },
            disabled: !selectedQuote,
          },
          {
            label: 'Yazdır',
            icon: <Printer className="w-3.5 h-3.5 text-slate-600" />,
            onClick: () => window.print(),
          },
        ]}
      >
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1 text-xs">
          {[
            { id: 'ALL', label: 'Tümü' },
            { id: 'SALES', label: 'Verilen Teklifler (Satış)' },
            { id: 'PURCHASE', label: 'Alınan Teklifler (Satın Alma)' },
            { id: 'ACCEPTED', label: 'Kabul Edilenler' },
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
        data={filteredQuotes}
        columns={columns}
        keyExtractor={(q) => q.id}
        selectedId={selectedQuote?.id}
        onSelectRow={(q) => setSelectedQuote(q)}
        onDoubleClickRow={(q) => {
          setSelectedQuote(q);
          setDetailModalOpen(true);
        }}
        loading={loading}
        emptyMessage="Teklif kaydı bulunamadı."
      />

      {/* 3. DİA ERP Dip Toplam Çubuğu */}
      <ErpSummaryBar
        totalCount={filteredQuotes.length}
        selectedText={
          selectedQuote
            ? `Seçili Teklif: ${selectedQuote.quotationNumber} (${selectedQuote.partnerTitle || ''})`
            : undefined
        }
        metrics={[
          { label: 'Teklif Toplamı', value: formatCurrency(totalAmountSum) },
          { label: 'Kabul Edilen', value: formatCurrency(acceptedAmountSum), highlight: 'success' },
        ]}
      />

      {/* MODAL 1: Teklif Kalemleri Detay Penceresi */}
      <Dialog
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Teklif İnceleme — ${selectedQuote?.quotationNumber || ''}`}
        description="Fiyat teklifine ait kalemler ve geçerlilik koşulları"
        maxWidth="2xl"
      >
        {selectedQuote && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Cari Hesap:</span>
                <strong className="text-slate-900 font-semibold">{selectedQuote.partnerTitle}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Teklif Tarihi:</span>
                <span className="font-mono text-slate-800">{formatDate(selectedQuote.issueDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Son Geçerlilik:</span>
                <span className="font-mono text-slate-800">{formatDate(selectedQuote.validUntil)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Teklif Durumu:</span>
                <StatusBadge status={selectedQuote.status} />
              </div>
            </div>

            {selectedQuote.notes && (
              <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded text-xs text-amber-900">
                <strong>Not:</strong> {selectedQuote.notes}
              </div>
            )}

            {/* Kalemler Tablosu */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Teklif Kalemleri ({selectedQuote.items?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2 border-r border-slate-200">Ürün / Varyant</th>
                      <th className="p-2 text-right border-r border-slate-200">Miktar</th>
                      <th className="p-2 text-right border-r border-slate-200">Birim Fiyat</th>
                      <th className="p-2 text-right border-r border-slate-200">KDV</th>
                      <th className="p-2 text-right">Kalem Toplamı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedQuote.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-100 font-mono font-bold text-slate-900">
                          {item.productName || item.variantSku || `Varyant #${item.variantId}`}
                        </td>
                        <td className="p-2 text-right font-mono font-bold border-r border-slate-100">
                          {item.quantity} adet
                        </td>
                        <td className="p-2 text-right font-mono border-r border-slate-100">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="p-2 text-right font-mono border-r border-slate-100">
                          %{item.taxRate}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.lineTotal || item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              {selectedQuote.status === 'ACCEPTED' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleConvertToOrder}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Resmi Siparişe Dönüştür</span>
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setDetailModalOpen(false)} className="ml-auto">
                Kapat
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* MODAL 2: Yeni Teklif Oluşturma Penceresi */}
      <Dialog
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Yeni B2B Fiyat Teklifi Düzenle"
        description="Müşteri veya tedarikçiye ürün/varyant seçimi yaparak resmi teklif mektubu oluşturun"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
          {/* Üst Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Teklif Yönü / Türü</label>
              <select
                value={quoteType}
                onChange={(e) => {
                  const newT = e.target.value as QuotationType;
                  setQuoteType(newT);
                  setItems((prev) =>
                    prev.map((it) => {
                      const v = allVariants.find((av) => av.id === it.variantId);
                      return v
                        ? { ...it, unitPrice: newT === 'SALES' ? v.salePrice : v.purchasePrice }
                        : it;
                    })
                  );
                }}
                className="w-full h-8 text-xs bg-white border border-slate-300 rounded px-2.5 focus:outline-none focus:border-slate-800"
              >
                <option value="SALES">Verilen Teklif (Satış - Müşteriye Gönderilen)</option>
                <option value="PURCHASE">Alınan Teklif (Satın Alma - Tedarikçiden Gelen)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cari Hesap {quoteType === 'SALES' ? '(Müşteri)' : '(Tedarikçi)'}
              </label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
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


            <div>
              <label className="block font-semibold text-slate-700 mb-1">Son Geçerlilik Tarihi</label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            <div className="col-span-full">
              <label className="block font-semibold text-slate-700 mb-1">Teklif Notu / Şartlar</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Örn: Fiyatlara nakliye dahildir. Ödeme vadesi 30 gündür."
              />
            </div>
          </div>

          {/* Kalemler Tablosu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <span>Teklif Kalemleri ({items.length})</span>
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
                  {items.map((item, idx) => {
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
                            disabled={items.length <= 1}
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
                <span className="font-bold text-slate-800">{formatCurrency(quoteTotals.subtotal)}</span>
              </div>
              {quoteTotals.totalDiscount > 0 && (
                <div>
                  <span className="text-amber-600">İskonto (-): </span>
                  <span className="font-bold text-amber-700">{formatCurrency(quoteTotals.totalDiscount)}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">KDV (+): </span>
                <span className="font-bold text-slate-800">{formatCurrency(quoteTotals.totalTax)}</span>
              </div>
              <div className="border-l border-slate-300 pl-3">
                <span className="text-slate-700 font-semibold">Genel Toplam: </span>
                <span className="font-bold text-emerald-700 text-sm">{formatCurrency(quoteTotals.grandTotal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end">
              <Button type="button" size="sm" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" size="sm" variant="primary" className="bg-slate-900 hover:bg-slate-800 text-white">
                Teklifi Kaydet (DRAFT)
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
