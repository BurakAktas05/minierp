import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CreditCard,
  CheckCircle2,
  Send,
  Plus,
  Printer,
  Ban,
  Calendar,
  AlertCircle,
  Eye,
  Building2,
  Layers,
} from 'lucide-react';
import { invoiceApi } from '../api/invoiceApi';
import { partnerApi } from '../api/partnerApi';
import { treasuryApi } from '../api/treasuryApi';
import { useToast } from '../context/ToastContext';
import {
  Invoice,
  InvoiceType,
  InvoiceStatus,
  BusinessPartner,
  CreateInvoiceRequest,
  PaymentMethod,
  CreatePaymentRequest,
  TreasuryAccount,
} from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErpToolbar } from '../components/common/ErpToolbar';
import { ErpDataGrid, Column } from '../components/common/ErpDataGrid';
import { ErpSummaryBar } from '../components/common/ErpSummaryBar';
import { OfficialReportModal } from '../components/reports/OfficialReportModal';

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

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SALES' | 'PURCHASE' | 'UNPAID' | 'OVERDUE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Modallar
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Ödeme formu durumu
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Yeni fatura formu durumu
  const [newType, setNewType] = useState<InvoiceType>('SALES_INVOICE');
  const [newPartnerId, setNewPartnerId] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');
  const [newCurrency, setNewCurrency] = useState('TRY');
  const [newItems, setNewItems] = useState([
    { description: 'Hizmet / Ürün Bedeli', quantity: 1, unitPrice: 1000, taxRate: 20 },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invList, partList, accList] = await Promise.all([
        invoiceApi.getInvoices(),
        partnerApi.getPartners(),
        treasuryApi.getAllAccounts().catch(() => []),
      ]);
      setInvoices(invList);
      setPartners(partList);
      setAccounts(accList);
      if (partList.length > 0 && newPartnerId === 0) {
        setNewPartnerId(partList[0].id);
      }
      // Seçili faturanın güncel durumunu koru
      if (selectedInvoice) {
        const found = invList.find((i) => i.id === selectedInvoice.id);
        setSelectedInvoice(found || null);
      }
    } catch (err) {
      console.error('Faturalar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveInvoice = async (invoiceId: number) => {
    try {
      await invoiceApi.updateInvoiceStatus(invoiceId, 'APPROVED');
      toast.success('Fatura başarıyla onaylandı.');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Fatura onaylanırken hata oluştu.');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.warning('Geçerli bir ödeme tutarı giriniz.');
      return;
    }

    try {
      // Eğer fatura taslak ise ödeme alabilmek için önce faturayı otomatik onayla
      if (selectedInvoice.status === 'DRAFT') {
        await invoiceApi.updateInvoiceStatus(selectedInvoice.id, 'APPROVED');
      }

      const payload: CreatePaymentRequest = {
        invoiceId: selectedInvoice.id,
        amount: amountNum,
        paymentMethod,
        accountId: selectedAccountId,
        paymentDate: new Date().toISOString(),
        referenceNumber: paymentReference || undefined,
        notes: paymentNotes || undefined,
      };

      await invoiceApi.addPayment(selectedInvoice.id, payload);
      toast.success(
        selectedInvoice.invoiceType === 'SALES_INVOICE'
          ? 'Tahsilat başarıyla kaydedildi.'
          : 'Ödeme başarıyla kaydedildi.'
      );
      setPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      setSelectedAccountId(undefined);
      await loadData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          (selectedInvoice?.invoiceType === 'SALES_INVOICE'
            ? 'Tahsilat kaydedilemedi.'
            : 'Ödeme kaydedilemedi.')
      );
    }
  };

  const handleUpdateStatus = async (status: InvoiceStatus) => {
    if (!selectedInvoice) return;
    try {
      await invoiceApi.updateInvoiceStatus(selectedInvoice.id, status);
      toast.success(`Fatura durumu güncellendi: ${status}`);
      await loadData();
    } catch (err: any) {
      toast.error('Durum güncellenirken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerId) {
      toast.warning('Lütfen bir cari hesap seçiniz.');
      return;
    }

    try {
      const payload: CreateInvoiceRequest = {
        invoiceType: newType,
        partnerId: newPartnerId,
        currency: newCurrency,
        notes: newNotes,
        items: newItems.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxRate: it.taxRate,
        })),
      };

      await invoiceApi.createInvoice(payload);
      toast.success('Yeni fatura başarıyla oluşturuldu.');
      setCreateModalOpen(false);
      setNewNotes('');
      await loadData();
    } catch (err: any) {
      toast.error('Fatura oluşturulurken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtrelenmiş fatura listesi
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Sekme filtresi
      if (activeTab === 'SALES' && inv.invoiceType !== 'SALES_INVOICE') return false;
      if (activeTab === 'PURCHASE' && inv.invoiceType !== 'PURCHASE_INVOICE') return false;
      if (activeTab === 'UNPAID' && (inv.status === 'PAID' || inv.status === 'CANCELLED')) return false;
      if (activeTab === 'OVERDUE') {
        const isOverdue =
          inv.dueDate &&
          new Date(inv.dueDate) < new Date() &&
          inv.status !== 'PAID' &&
          inv.status !== 'CANCELLED';
        if (!isOverdue) return false;
      }

      // Arama terimi filtresi
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const pName = inv.partnerTitle || inv.partner?.name || '';
        return (
          inv.invoiceNumber.toLowerCase().includes(term) ||
          pName.toLowerCase().includes(term) ||
          (inv.notes && inv.notes.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [invoices, activeTab, searchTerm]);

  // Finansal toplamlar
  const totalAmountSum = useMemo(() => {
    return filteredInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  }, [filteredInvoices]);

  const totalPaidSum = useMemo(() => {
    return filteredInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  }, [filteredInvoices]);

  const totalRemainingSum = useMemo(() => {
    return filteredInvoices.reduce((sum, i) => sum + (i.remainingAmount || 0), 0);
  }, [filteredInvoices]);

  // Tablo sütun tanımları
  const columns: Column<Invoice>[] = [
    {
      id: 'invoiceNumber',
      header: 'Fatura No',
      width: '140px',
      accessor: (inv) => (
        <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
      ),
    },
    {
      id: 'invoiceDate',
      header: 'Tarih',
      width: '95px',
      accessor: (inv) => <span className="font-mono text-slate-600">{formatDate(inv.invoiceDate)}</span>,
    },
    {
      id: 'dueDate',
      header: 'Vade',
      width: '115px',
      accessor: (inv) => {
        const isOverdue =
          inv.dueDate &&
          new Date(inv.dueDate) < new Date() &&
          inv.status !== 'PAID' &&
          inv.status !== 'CANCELLED' &&
          inv.remainingAmount > 0;
        return (
          <span
            className={`font-mono text-xs ${
              isOverdue
                ? 'text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-flex items-center gap-1'
                : 'text-slate-600'
            }`}
          >
            {isOverdue && '⚠️ '}
            {formatDate(inv.dueDate)}
          </span>
        );
      },
    },
    {
      id: 'invoiceType',
      header: 'Fatura Türü',
      width: '120px',
      accessor: (inv) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
            inv.invoiceType === 'SALES_INVOICE'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}
        >
          {inv.invoiceType === 'SALES_INVOICE' ? 'Satış Faturası' : 'Alış Faturası'}
        </span>
      ),
    },
    {
      id: 'partner',
      header: 'Cari Hesap Unvanı',
      accessor: (inv) => (
        <span className="font-semibold text-slate-900 truncate block max-w-xs">
          {inv.partnerTitle || inv.partner?.name || 'Cari Hesap'}
        </span>
      ),
    },
    {
      id: 'totalAmount',
      header: 'Genel Toplam',
      align: 'right',
      width: '130px',
      accessor: (inv) => (
        <span className="font-bold font-mono text-sm text-slate-900">
          {formatCurrency(inv.totalAmount, inv.currency)}
        </span>
      ),
    },
    {
      id: 'paidAmount',
      header: 'Ödenen',
      align: 'right',
      width: '120px',
      accessor: (inv) => (
        <span className="font-mono font-medium text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded text-xs border border-emerald-100 inline-block">
          {inv.paidAmount > 0 ? formatCurrency(inv.paidAmount, inv.currency) : '-'}
        </span>
      ),
    },
    {
      id: 'remainingAmount',
      header: 'Kalan Bakiye',
      align: 'right',
      width: '130px',
      accessor: (inv) => (
        <span
          className={`font-mono font-bold text-xs px-2 py-0.5 rounded border inline-block ${
            inv.remainingAmount > 0
              ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {inv.remainingAmount > 0 ? formatCurrency(inv.remainingAmount, inv.currency) : '0,00 ₺'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Durum',
      align: 'center',
      width: '110px',
      accessor: (inv) => <StatusBadge status={inv.status} />,
    },
  ];

  return (
    <div className="space-y-0 select-none">
      {/* 1. DİA ERP Toolbar */}
      <ErpToolbar
        title="Fatura & Finans Hareketleri"
        subtitle="Satış, Alış ve Hizmet Faturaları / Tahsilat Yönetimi"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Fatura no veya cari unvanı ile ara..."
        onRefresh={loadData}
        actions={[
          {
            label: 'Yeni Fatura',
            icon: <Plus className="w-3.5 h-3.5 text-white" />,
            onClick: () => navigate('/invoices/new'),
            variant: 'primary',
          },
          {
            label: selectedInvoice?.invoiceType === 'PURCHASE_INVOICE' ? 'Ödeme Yap' : 'Tahsilat Al',
            icon: <CreditCard className="w-3.5 h-3.5 text-emerald-600" />,
            onClick: () => {
              if (!selectedInvoice) {
                toast.warning('Lütfen önce işlem yapılacak faturayı listeden seçiniz.');
                return;
              }
              if (selectedInvoice.remainingAmount <= 0) {
                toast.info(
                  selectedInvoice.invoiceType === 'SALES_INVOICE'
                    ? 'Bu satış faturasının bakiyesi tamamen tahsil edilmiştir.'
                    : 'Bu alış faturasının bakiyesi tamamen ödenmiştir.'
                );
                return;
              }
              setPaymentAmount(selectedInvoice.remainingAmount.toString());
              setPaymentModalOpen(true);
            },
            disabled: !selectedInvoice || (selectedInvoice && selectedInvoice.remainingAmount <= 0),
          },
          {
            label: 'Detay / İncele',
            icon: <Eye className="w-3.5 h-3.5 text-blue-600" />,
            onClick: () => {
              if (!selectedInvoice) {
                toast.warning('Lütfen incelemek istediğiniz faturayı listeden seçiniz.');
                return;
              }
              setDetailModalOpen(true);
            },
            disabled: !selectedInvoice,
          },
          {
            label: 'Onayla',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />,
            onClick: () => handleUpdateStatus('APPROVED'),
            disabled: !selectedInvoice || selectedInvoice.status !== 'DRAFT',
          },
          {
            label: 'Gönder',
            icon: <Send className="w-3.5 h-3.5 text-amber-600" />,
            onClick: () => handleUpdateStatus('SENT'),
            disabled: !selectedInvoice || selectedInvoice.status !== 'APPROVED',
          },
          {
            label: 'Yazdır',
            icon: <Printer className="w-3.5 h-3.5 text-slate-600" />,
            onClick: () => {
              if (!selectedInvoice) {
                toast.warning('Lütfen yazdırmak istediğiniz faturayı listeden seçiniz.');
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
            { id: 'PURCHASE', label: 'Alış' },
            { id: 'UNPAID', label: 'Açık / Ödenmemiş' },
            { id: 'OVERDUE', label: 'Vadesi Geçen' },
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
        data={filteredInvoices}
        columns={columns}
        keyExtractor={(inv) => inv.id}
        selectedId={selectedInvoice?.id}
        onSelectRow={(inv) => setSelectedInvoice(inv)}
        onDoubleClickRow={(inv) => {
          setSelectedInvoice(inv);
          setDetailModalOpen(true);
        }}
        loading={loading}
        emptyMessage="Fatura kaydı bulunamadı. Üstteki 'Yeni Fatura' butonu ile kayıt oluşturabilirsiniz."
      />

      {/* 3. DİA ERP Dip Toplam Çubuğu */}
      <ErpSummaryBar
        totalCount={filteredInvoices.length}
        selectedText={
          selectedInvoice
            ? `Seçili: ${selectedInvoice.invoiceNumber} — ${
                selectedInvoice.partnerTitle || selectedInvoice.partner?.name || ''
              }`
            : undefined
        }
        metrics={[
          { label: 'Fatura Toplamı', value: formatCurrency(totalAmountSum) },
          { label: 'Tahsil Edilen', value: formatCurrency(totalPaidSum), highlight: 'success' },
          {
            label: 'Net Açık Bakiye',
            value: formatCurrency(totalRemainingSum),
            highlight: totalRemainingSum > 0 ? 'warning' : 'default',
          },
        ]}
      />

      {/* 4. Kasa & Banka (Hazine) Canlı Bakiye Paneli */}
      {accounts.length > 0 && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-700">Hazine / Kasa & Banka Canlı Bakiyeleri:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                <span className={`w-2 h-2 rounded-full ${acc.accountType === 'CASH' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                <span className="text-slate-600 font-medium">{acc.accountName}:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(acc.currentBalance, acc.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Fatura Detay / İncele Penceresi */}
      <Dialog
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Fatura İnceleme — ${selectedInvoice?.invoiceNumber || ''}`}
        description="Fatura başlık bilgileri, kalemleri, finansal dip toplamlar ve tahsilat hareketleri"
        maxWidth="4xl"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            {/* 1. ERP Fatura Başlık & Cari Kart Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider uppercase ${
                      selectedInvoice.invoiceType === 'SALES_INVOICE'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-purple-100 text-purple-800 border-purple-200'
                    }`}
                  >
                    {selectedInvoice.invoiceType === 'SALES_INVOICE' ? 'Satış Faturası' : 'Alış Faturası'}
                  </span>
                  <StatusBadge status={selectedInvoice.status} />
                </div>
                <h2 className="text-2xl font-black font-mono tracking-tight text-slate-900">
                  {selectedInvoice.invoiceNumber}
                </h2>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{selectedInvoice.partnerTitle || selectedInvoice.partner?.name || 'Cari Bilgisi Yok'}</span>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Fatura Tarihi:</span>
                  <span className="font-mono font-bold text-slate-800">{formatDate(selectedInvoice.invoiceDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Vade Tarihi:</span>
                  <span
                    className={`font-mono font-bold ${
                      selectedInvoice.remainingAmount > 0 &&
                      selectedInvoice.dueDate &&
                      new Date(selectedInvoice.dueDate) < new Date()
                        ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200'
                        : 'text-slate-800'
                    }`}
                  >
                    {selectedInvoice.remainingAmount > 0 &&
                      selectedInvoice.dueDate &&
                      new Date(selectedInvoice.dueDate) < new Date() &&
                      '⚠️ '}
                    {formatDate(selectedInvoice.dueDate)}
                  </span>
                </div>
                {selectedInvoice.currency && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Para Birimi:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {selectedInvoice.currency}{' '}
                      {selectedInvoice.exchangeRate && selectedInvoice.exchangeRate !== 1
                        ? `(Kur: ${selectedInvoice.exchangeRate})`
                        : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Vade Gecikme Uyarısı (Eğer Vade Geçtiyse ve Açık Bakiye Varsa) */}
            {selectedInvoice.remainingAmount > 0 &&
              selectedInvoice.dueDate &&
              new Date(selectedInvoice.dueDate) < new Date() && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-r-lg flex items-center justify-between text-xs text-rose-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <div>
                      <strong>Vade Gecikme Uyarısı:</strong> Bu faturanın son ödeme vadesi dolmuştur.
                      Tahsil edilmeyi bekleyen açık bakiye:
                      <strong className="font-mono ml-1 text-sm text-rose-700">
                        {formatCurrency(selectedInvoice.remainingAmount, selectedInvoice.currency)}
                      </strong>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs ml-3 whitespace-nowrap cursor-pointer"
                    onClick={() => {
                      setPaymentAmount(selectedInvoice.remainingAmount.toString());
                      setPaymentModalOpen(true);
                    }}
                  >
                    Hemen Tahsil Et
                  </Button>
                </div>
              )}

            {/* 3. Fatura Kalemleri Tablosu */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  Fatura Kalemleri ({selectedInvoice.items?.length || 0})
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">Birim fiyat ve KDV detaylı kalem listesi</span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center border-r border-slate-200">#</th>
                      <th className="p-2.5 border-r border-slate-200">Açıklama / Kalem</th>
                      <th className="p-2.5 text-right border-r border-slate-200 w-24">Miktar</th>
                      <th className="p-2.5 text-right border-r border-slate-200 w-28">Birim Fiyat</th>
                      <th className="p-2.5 text-center border-r border-slate-200 w-20">KDV</th>
                      <th className="p-2.5 text-right w-32">Toplam Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedInvoice.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 text-center border-r border-slate-100 font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 border-r border-slate-100 font-medium text-slate-900">
                          <div>{item.description || item.productName || item.variantSku || 'Hizmet Kalemi'}</div>
                          {(item.variantSku || item.productName) && item.description && item.description !== item.productName && (
                            <div className="text-[10px] text-slate-400">{item.description}</div>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-slate-800 border-r border-slate-100">
                          {item.quantity} adet
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-700 border-r border-slate-100">
                          {formatCurrency(item.unitPrice, selectedInvoice.currency)}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-600 border-r border-slate-100">
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                            %{item.taxRate}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.subtotal || item.quantity * item.unitPrice, selectedInvoice.currency)}
                        </td>
                      </tr>
                    ))}
                    {(!selectedInvoice.items || selectedInvoice.items.length === 0) && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">
                          Bu faturaya ait kalem kaydı bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Alt Bölüm: Sol Kolon (Ödeme Geçmişi) & Sağ Kolon (Finansal Dip Toplamlar) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
              {/* Sol Kolon: Tahsilat Geçmişi ve Notlar (7 Kolon) */}
              <div className="md:col-span-7 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    Tahsilat / Ödeme Hareketleri ({selectedInvoice.payments?.length || 0})
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="p-2 border-r border-slate-200">Belge No</th>
                          <th className="p-2 border-r border-slate-200">Tarih</th>
                          <th className="p-2 border-r border-slate-200">Yöntem / Hesap</th>
                          <th className="p-2 border-r border-slate-200">Ref No</th>
                          <th className="p-2 text-right">Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedInvoice.payments || []).map((pay, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 border-r border-slate-100 font-mono font-bold text-slate-800">
                              {pay.paymentNumber}
                            </td>
                            <td className="p-2 border-r border-slate-100 font-mono text-slate-600">
                              {formatDate(pay.paymentDate)}
                            </td>
                            <td className="p-2 border-r border-slate-100 text-slate-700">
                              <div>{pay.paymentMethod === 'BANK_TRANSFER' ? 'Havale / EFT' : 'Nakit'}</div>
                              {pay.accountName && <div className="text-[10px] text-slate-400 font-mono">{pay.accountName}</div>}
                            </td>
                            <td className="p-2 border-r border-slate-100 text-slate-500 font-mono text-[11px]">
                              {pay.referenceNumber || '-'}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-600">
                              {formatCurrency(pay.amount, pay.currency)}
                            </td>
                          </tr>
                        ))}
                        {(!selectedInvoice.payments || selectedInvoice.payments.length === 0) && (
                          <tr>
                            <td colSpan={5} className="p-3 text-center text-slate-400 italic">
                              Bu faturaya ait henüz ödeme / tahsilat kaydı bulunmuyor.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="bg-amber-50/50 border border-amber-200 rounded p-2.5 text-xs text-slate-700">
                    <strong className="block text-amber-900 font-semibold mb-0.5">Fatura Notu / Açıklama:</strong>
                    <span>{selectedInvoice.notes}</span>
                  </div>
                )}
              </div>

              {/* Sağ Kolon: Standart ERP Finansal Dip Toplamlar Paneli (5 Kolon) */}
              <div className="md:col-span-5 flex flex-col justify-start">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    Finansal İcmal & Dip Toplamlar
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Ara Toplam (KDV Hariç):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatCurrency(
                        selectedInvoice.subtotalAmount ||
                          (selectedInvoice.totalAmount - (selectedInvoice.taxAmount || 0)),
                        selectedInvoice.currency
                      )}
                    </span>
                  </div>

                  {selectedInvoice.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>İskonto Tutarı:</span>
                      <span className="font-mono text-rose-600">
                        - {formatCurrency(selectedInvoice.discountAmount, selectedInvoice.currency)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Hesaplanan KDV:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      + {formatCurrency(selectedInvoice.taxAmount || 0, selectedInvoice.currency)}
                    </span>
                  </div>

                  {/* Genel Toplam Büyük Kutu */}
                  <div className="flex justify-between items-center bg-white border border-slate-300 p-2.5 rounded shadow-2xs mt-2">
                    <span className="font-extrabold text-slate-900 uppercase tracking-wide text-xs">
                      Genel Toplam:
                    </span>
                    <span className="text-lg font-black font-mono text-slate-900">
                      {formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}
                    </span>
                  </div>

                  {/* Tahsil Edilen Tutar */}
                  <div className="flex justify-between items-center text-emerald-700 pt-1 px-1">
                    <span className="font-semibold">Tahsil Edilen Tutar:</span>
                    <span className="font-mono font-bold text-sm">
                      {formatCurrency(selectedInvoice.paidAmount, selectedInvoice.currency)}
                    </span>
                  </div>

                  {/* Kalan Açık Bakiye Kutusu (Kritik ERP Vurgusu) */}
                  {selectedInvoice.remainingAmount > 0 ? (
                    <div className="bg-rose-50 border-2 border-rose-300 p-3 rounded-md text-rose-900 shadow-2xs mt-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 block">
                            Kalan Açık Bakiye
                          </span>
                          <span className="text-[10px] text-rose-600">Ödenmesi Gereken Net Tutar</span>
                        </div>
                        <span className="text-xl font-black font-mono text-rose-700">
                          {formatCurrency(selectedInvoice.remainingAmount, selectedInvoice.currency)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-md text-emerald-800 font-bold text-xs flex items-center justify-between mt-2">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Bakiye Kapatıldı
                      </span>
                      <span className="font-mono">0,00 ₺</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Modal Alt Aksiyon Çubuğu */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer"
                onClick={() => setPrintModalOpen(true)}
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                Resmi e-Faturayı Yazdır / PDF
              </Button>

              <div className="flex items-center gap-2">
                {selectedInvoice.remainingAmount > 0 && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    onClick={() => {
                      setPaymentAmount(selectedInvoice.remainingAmount.toString());
                      setPaymentModalOpen(true);
                    }}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    {selectedInvoice.invoiceType === 'SALES_INVOICE' ? 'Tahsilat Al' : 'Ödeme Yap'}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setDetailModalOpen(false)}>
                  Kapat
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* MODAL 2: Tahsilat / Ödeme Ekleme Penceresi */}
      <Dialog
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={
          selectedInvoice?.invoiceType === 'SALES_INVOICE'
            ? `Tahsilat Makbuzu Girişi — ${selectedInvoice.invoiceNumber}`
            : `Ödeme Makbuzu Girişi — ${selectedInvoice?.invoiceNumber || ''}`
        }
        description={
          selectedInvoice?.invoiceType === 'SALES_INVOICE'
            ? 'Müşteriden yapılan tahsilat ile satış faturası bakiyesini kapatın'
            : 'Tedarikçiye yapılan ödeme ile alış faturası borcunu kapatın'
        }
        maxWidth="md"
      >
        {selectedInvoice && (
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Fatura Tutarı:</span>
                <strong className="font-mono">{formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {selectedInvoice.invoiceType === 'SALES_INVOICE' ? 'Tahsil Edilen:' : 'Ödenen:'}
                </span>
                <span className="font-mono text-emerald-600">{formatCurrency(selectedInvoice.paidAmount, selectedInvoice.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <span className="text-slate-700">Kalan Açık Bakiye:</span>
                <span className="font-mono text-amber-600">{formatCurrency(selectedInvoice.remainingAmount, selectedInvoice.currency)}</span>
              </div>
            </div>

            {selectedInvoice.status === 'DRAFT' && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Bilgi:</strong> Bu fatura henüz Taslak durumundadır. Tahsilat kaydedildiğinde fatura otomatik olarak onaylanıp resmileştirilecektir.
                </span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {selectedInvoice.invoiceType === 'SALES_INVOICE' ? 'Tahsilat Tutarı (₺)' : 'Ödeme Tutarı (₺)'}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {selectedInvoice.invoiceType === 'SALES_INVOICE' ? 'Tahsilat Yöntemi' : 'Ödeme Yöntemi'}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const method = e.target.value as PaymentMethod;
                    setPaymentMethod(method);
                    setSelectedAccountId(undefined);
                  }}
                  className="w-full h-8 text-xs bg-white border border-slate-300 rounded px-2.5 focus:outline-none focus:border-slate-800"
                >
                  <option value="BANK_TRANSFER">Banka Havalesi / EFT</option>
                  <option value="CASH">Nakit Kasa</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {selectedInvoice.invoiceType === 'SALES_INVOICE'
                    ? 'Giriş Yapılacak Hesap (Kasa / Banka)'
                    : 'Çıkış Yapılacak Hesap (Kasa / Banka)'}
                </label>
                <select
                  value={selectedAccountId || ''}
                  onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full h-8 text-xs bg-white border border-slate-300 rounded px-2.5 focus:outline-none focus:border-slate-800"
                >
                  <option value="">-- Varsayılan {paymentMethod === 'CASH' ? 'Kasa' : 'Banka Hesabı'} --</option>
                  {accounts
                    .filter((a) => (paymentMethod === 'CASH' ? a.accountType === 'CASH' : a.accountType === 'BANK'))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} (Bakiye: {formatCurrency(a.currentBalance, a.currency)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dekont / Makbuz Ref No</label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder={
                    selectedInvoice.invoiceType === 'SALES_INVOICE'
                      ? 'Örn: THS-2026-001 veya Banka Dekont No'
                      : 'Örn: ODM-2026-001 veya Banka Dekont No'
                  }
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Açıklama</label>
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={
                    selectedInvoice.invoiceType === 'SALES_INVOICE'
                      ? 'Tahsilat açıklaması...'
                      : 'Ödeme açıklaması...'
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" size="sm" variant="outline" onClick={() => setPaymentModalOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" size="sm" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {selectedInvoice.invoiceType === 'SALES_INVOICE' ? 'Tahsilatı Kaydet' : 'Ödemeyi Kaydet'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* MODAL 3: Yeni Fatura Açma Penceresi */}
      <Dialog
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Yeni Fatura Oluştur (Hizmet / Doğrudan Fatura)"
        description="İrsaliyesiz doğrudan satış, alış veya hizmet faturası düzenleyin"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fatura Türü</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as InvoiceType)}
                className="w-full h-8 text-xs bg-white border border-slate-300 rounded px-2.5 focus:outline-none focus:border-slate-800"
              >
                <option value="SALES_INVOICE">Satış Faturası</option>
                <option value="PURCHASE_INVOICE">Alış Faturası</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cari Hesap</label>
              <select
                value={newPartnerId}
                onChange={(e) => setNewPartnerId(Number(e.target.value))}
                className="w-full h-8 text-xs bg-white border border-slate-300 rounded px-2.5 focus:outline-none focus:border-slate-800"
                required
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.title} ({p.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kalem Açıklaması</label>
            <Input
              value={newItems[0].description}
              onChange={(e) => {
                const copy = [...newItems];
                copy[0].description = e.target.value;
                setNewItems(copy);
              }}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Miktar</label>
              <Input
                type="number"
                value={newItems[0].quantity}
                onChange={(e) => {
                  const copy = [...newItems];
                  copy[0].quantity = Number(e.target.value);
                  setNewItems(copy);
                }}
                min="1"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Birim Fiyat (TL)</label>
              <Input
                type="number"
                step="0.01"
                value={newItems[0].unitPrice}
                onChange={(e) => {
                  const copy = [...newItems];
                  copy[0].unitPrice = Number(e.target.value);
                  setNewItems(copy);
                }}
                min="0"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">KDV Oranı (%)</label>
              <select
                value={newItems[0].taxRate}
                onChange={(e) => {
                  const copy = [...newItems];
                  copy[0].taxRate = Number(e.target.value);
                  setNewItems(copy);
                }}
                className="w-full h-8 text-xs bg-white border border-slate-300 rounded px-2.5 focus:outline-none focus:border-slate-800"
              >
                <option value="0">%0</option>
                <option value="1">%1</option>
                <option value="10">%10</option>
                <option value="20">%20</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Fatura Notu / Açıklama</label>
            <Input
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Fatura açıklaması..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" size="sm" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" variant="primary">
              Faturayı Kaydet (DRAFT)
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 4: Resmi e-Fatura Baskı Önizleme Penceresi */}
      <OfficialReportModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        reportType="INVOICE"
        invoice={selectedInvoice}
      />
    </div>
  );
};
