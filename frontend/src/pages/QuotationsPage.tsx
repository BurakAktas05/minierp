import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Send,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { quotationApi } from '../api/quotationApi';
import { orderApi } from '../api/orderApi';
import { partnerApi } from '../api/partnerApi';
import { inventoryApi } from '../api/inventoryApi';
import {
  Quotation,
  QuotationType,
  QuotationStatus,
  BusinessPartner,
  Product,
  CreateQuotationRequest,
} from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs } from '../components/ui/tabs';
import { Dialog } from '../components/ui/dialog';
import { Card } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { StatusBadge } from '../components/common/StatusBadge';

export const QuotationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuotes, setExpandedQuotes] = useState<Record<number, boolean>>({});

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number>(1);
  const [quoteType, setQuoteType] = useState<QuotationType>('SALES');
  const [validUntil, setValidUntil] = useState('2026-04-15');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<
    Array<{ variantId: number; quantity: number; unitPrice: number; taxRate: number }>
  >([
    { variantId: 102, quantity: 50, unitPrice: 450, taxRate: 10 },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const typeParam = activeTab === 'ALL' ? undefined : (activeTab as QuotationType);
      const [qList, pList, prodList] = await Promise.all([
        quotationApi.getQuotations(typeParam),
        partnerApi.getPartners(),
        inventoryApi.getProducts(),
      ]);
      setQuotations(qList);
      setPartners(pList);
      setProducts(prodList);
      if (pList.length > 0) setSelectedPartnerId(pList[0].id);
    } catch (err) {
      console.error('Teklifler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const toggleExpand = (id: number) => {
    setExpandedQuotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Status progression action
  const handleUpdateStatus = async (id: number, status: QuotationStatus) => {
    try {
      await quotationApi.updateStatus(id, status);
      await loadData();
    } catch (err: any) {
      alert('Durum güncellenirken hata: ' + (err.message || 'Hata'));
    }
  };

  // User requirement: Manual Conversion to Order
  const handleConvertToOrder = async (quotationId: number) => {
    if (!window.confirm('Bu teklifi resmi siparişe dönüştürmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await orderApi.createOrderFromQuotation(quotationId);
      alert('Teklif başarıyla resmi siparişe aktarıldı. Siparişler sayfasına yönlendiriliyorsunuz.');
      navigate('/orders');
    } catch (err: any) {
      alert('Siparişe dönüştürülürken hata: ' + (err.message || 'Hata'));
    }
  };

  // Flattened variants for item selection
  const allVariants: Array<{ id: number; label: string; price: number }> = [];
  products.forEach((p) => {
    p.variants.forEach((v) => {
      allVariants.push({
        id: v.id,
        label: `${p.name} - ${v.sku} (${v.size || ''} ${v.color || ''})`,
        price: p.basePrice + (v.priceAdjustment || 0),
      });
    });
  });

  const addItemRow = () => {
    const defaultVar = allVariants[0];
    setItems([
      ...items,
      { variantId: defaultVar ? defaultVar.id : 101, quantity: 10, unitPrice: defaultVar ? defaultVar.price : 100, taxRate: 10 },
    ]);
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Lütfen en az bir teklif kalemi ekleyiniz.');
      return;
    }

    const payload: CreateQuotationRequest = {
      partnerId: Number(selectedPartnerId),
      type: quoteType,
      validUntil,
      notes,
      items: items.map((it) => ({
        variantId: Number(it.variantId),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        taxRate: Number(it.taxRate),
      })),
    };

    try {
      await quotationApi.createQuotation(payload);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert('Teklif oluşturulurken hata: ' + (err.message || 'Hata'));
    }
  };

  const filteredQuotes = quotations.filter(
    (q) =>
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.partnerTitle && q.partnerTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">B2B Teklif Yönetimi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Alış ve satış teklifleri, onay takibi ve manuel siparişe dönüştürme döngüsü
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yenile</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Teklif Hazırla</span>
          </Button>
        </div>
      </div>

      {/* Tabs and Search */}
      <Card className="p-4 space-y-4">
        <Tabs
          tabs={[
            { id: 'ALL', label: 'Tüm Teklifler', count: quotations.length },
            { id: 'SALES', label: 'Satış Teklifleri' },
            { id: 'PURCHASE', label: 'Alış Teklifleri' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Teklif numarası (QT-...) veya müşteri/tedarikçi unvanı ara..."
            className="pl-9 text-xs"
          />
        </div>
      </Card>

      {/* Quotations List */}
      <div className="space-y-3">
        {filteredQuotes.map((q) => {
          const isExpanded = !!expandedQuotes[q.id];
          return (
            <Card key={q.id} className="border border-slate-200 overflow-hidden">
              <div
                onClick={() => toggleExpand(q.id)}
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
                        {q.quotationNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {q.partnerTitle || 'Cari Hesap'}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 bg-slate-50">
                        {q.type === 'SALES' ? 'Satış' : 'Alış'}
                      </span>
                      <StatusBadge status={q.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span>Tarih: {new Date(q.issueDate).toLocaleDateString('tr-TR')}</span>
                      {q.validUntil && (
                        <span>Geçerlilik: {new Date(q.validUntil).toLocaleDateString('tr-TR')}</span>
                      )}
                      <span>{q.items.length} Kalem</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Amount and Workflow Actions */}
                <div className="flex items-center gap-4 self-end md:self-center">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Toplam Tutar</p>
                    <p className="font-mono text-sm font-bold text-slate-900">
                      ₺{q.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Contextual Action Buttons */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {q.status === 'DRAFT' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleUpdateStatus(q.id, 'SENT')}
                      >
                        <Send className="w-3 h-3 text-slate-600" />
                        <span>Müşteriye Gönder</span>
                      </Button>
                    )}

                    {q.status === 'SENT' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-emerald-700 border-emerald-300 bg-emerald-50/50"
                          onClick={() => handleUpdateStatus(q.id, 'ACCEPTED')}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Kabul Edildi</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-rose-700 border-rose-300 bg-rose-50/50"
                          onClick={() => handleUpdateStatus(q.id, 'REJECTED')}
                        >
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Reddedildi</span>
                        </Button>
                      </>
                    )}

                    {/* USER RULE: Explicit Manual Conversion Button! */}
                    {q.status === 'ACCEPTED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs h-8 bg-slate-900"
                        onClick={() => handleConvertToOrder(q.id)}
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Siparişe Dönüştür</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable Line Items Table */}
              {isExpanded && (
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Teklif Kalemleri
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ürün & Varyant</TableHead>
                        <TableHead className="text-right">Miktar</TableHead>
                        <TableHead className="text-right">Birim Fiyat</TableHead>
                        <TableHead className="text-right">KDV</TableHead>
                        <TableHead className="text-right">Satır Tutarı</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {q.items.map((item, idx) => (
                        <TableRow key={idx} className="bg-white">
                          <TableCell className="text-xs font-semibold text-slate-800">
                            {item.productName || item.variantSku || `Varyant #${item.variantId}`}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
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
                  {q.notes && (
                    <p className="mt-3 text-xs text-slate-500 italic bg-white p-2.5 rounded border border-slate-200">
                      Not: {q.notes}
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {filteredQuotes.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Teklif kaydı bulunamadı</p>
            <p className="text-xs text-slate-400 mt-1">Yeni bir alış veya satış teklifi hazırlayabilirsiniz.</p>
          </div>
        )}
      </div>

      {/* Create Quotation Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni B2B Teklif Hazırla"
        description="Müşteri veya tedarikçi için kalem bazlı resmi teklif dokümanı oluşturun."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Cari Hesap (Partner)
              </label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Teklif Türü
              </label>
              <select
                value={quoteType}
                onChange={(e) => setQuoteType(e.target.value as QuotationType)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
              >
                <option value="SALES">Satış Teklifi (Müşteriye)</option>
                <option value="PURCHASE">Alış Teklifi (Tedarikçiden)</option>
              </select>
            </div>

            <Input
              label="Geçerlilik Tarihi"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              required
            />
          </div>

          <Input
            label="Teklif Notu"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Örn: 2026 İlkbahar mağaza sevkiyatı için toptan satış teklifidir."
          />

          {/* Dynamic Items Builder */}
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Teklif Kalemleri ({items.length})
              </span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Kalem Ekle
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border border-slate-200">
                  <div className="flex-1">
                    <select
                      value={it.variantId}
                      onChange={(e) => {
                        const vId = Number(e.target.value);
                        const found = allVariants.find((v) => v.id === vId);
                        const updated = [...items];
                        updated[idx].variantId = vId;
                        if (found) updated[idx].unitPrice = found.price;
                        setItems(updated);
                      }}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900"
                    >
                      {allVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Miktar"
                      value={it.quantity}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].quantity = Number(e.target.value);
                        setItems(updated);
                      }}
                      className="text-xs h-7 py-1"
                    />
                  </div>

                  <div className="w-24">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Fiyat"
                      value={it.unitPrice}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].unitPrice = Number(e.target.value);
                        setItems(updated);
                      }}
                      className="text-xs h-7 py-1 font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    className="text-xs text-rose-600 hover:text-rose-800 px-2"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" variant="primary">
              Teklifi Kaydet (Taslak)
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
