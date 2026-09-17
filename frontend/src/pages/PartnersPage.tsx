import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Receipt,
  Printer,
  Mail,
  Phone,
  Filter,
  Eye,
  RefreshCw,
  FileText,
  CreditCard,
} from 'lucide-react';
import { partnerApi } from '../api/partnerApi';
import { useToast } from '../context/ToastContext';
import { BusinessPartner, PartnerType, PartnerStatement } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErpToolbar } from '../components/common/ErpToolbar';
import { ErpDataGrid, Column } from '../components/common/ErpDataGrid';
import { ErpSummaryBar } from '../components/common/ErpSummaryBar';

const formatCurrency = (amount: number = 0, currency: string = 'TRY') => {
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

export const PartnersPage: React.FC = () => {
  const { toast } = useToast();
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER' | 'DEBTOR' | 'CREDITOR'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<BusinessPartner | null>(null);

  // Modals
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statement, setStatement] = useState<PartnerStatement | null>(null);
  const [statementFilter, setStatementFilter] = useState<'ALL' | 'INVOICE' | 'PAYMENT'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create Partner form state
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<PartnerType>('CUSTOMER');
  const [newTaxNumber, setNewTaxNumber] = useState('');
  const [newTaxOffice, setNewTaxOffice] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30 Gün');
  const [creditLimit, setCreditLimit] = useState('250000');

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await partnerApi.getPartners();
      setPartners(list);
      if (selectedPartner) {
        const found = list.find((p) => p.id === selectedPartner.id);
        setSelectedPartner(found || null);
      }
    } catch (err) {
      console.error('Cari hesaplar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenStatement = async (partner: BusinessPartner) => {
    setSelectedPartner(partner);
    setStatement(null);
    setStatementModalOpen(true);
    setStatementLoading(true);
    setStatementFilter('ALL');

    try {
      const data = await partnerApi.getPartnerStatement(partner.id);
      setStatement(data);
    } catch (err) {
      console.error('Cari ekstre yüklenemedi:', err);
    } finally {
      setStatementLoading(false);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newTitle) return;

    try {
      await partnerApi.createPartner({
        code: newCode.toUpperCase(),
        title: newTitle,
        type: newType,
        taxNumber: newTaxNumber,
        taxOffice: newTaxOffice,
        email: newEmail,
        phone: newPhone,
        address: newAddress,
        active: true,
        metadata: {
          odemeVadesi: paymentTerms,
          krediLimiti: Number(creditLimit),
        },
      });

      setIsCreateModalOpen(false);
      setNewCode('');
      setNewTitle('');
      setNewTaxNumber('');
      setNewTaxOffice('');
      setNewEmail('');
      setNewPhone('');
      setNewAddress('');
      toast.success('Cari kartı başarıyla eklendi.');
      await loadData();
    } catch (err: any) {
      toast.error('Cari kartı eklenirken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (activeTab === 'CUSTOMER' && p.type !== 'CUSTOMER' && p.type !== 'BOTH') return false;
      if (activeTab === 'SUPPLIER' && p.type !== 'SUPPLIER' && p.type !== 'BOTH') return false;
      if (activeTab === 'DEBTOR' && (p.balance || 0) <= 0) return false;
      if (activeTab === 'CREDITOR' && (p.balance || 0) >= 0) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          p.title.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          (p.taxNumber && p.taxNumber.includes(term))
        );
      }
      return true;
    });
  }, [partners, activeTab, searchTerm]);

  // Financial totals across filtered partners
  const totalDebitSum = useMemo(() => {
    return filteredPartners.reduce((sum, p) => sum + (p.totalDebit || 0), 0);
  }, [filteredPartners]);

  const totalCreditSum = useMemo(() => {
    return filteredPartners.reduce((sum, p) => sum + (p.totalCredit || 0), 0);
  }, [filteredPartners]);

  const totalBalanceSum = useMemo(() => {
    return filteredPartners.reduce((sum, p) => sum + (p.balance || 0), 0);
  }, [filteredPartners]);

  // Filtered statement lines inside modal
  const filteredStatementLines = useMemo(() => {
    return (statement?.lines || []).filter((line) => {
      if (statementFilter === 'INVOICE') return line.documentType.includes('INVOICE');
      if (statementFilter === 'PAYMENT') {
        return (
          line.documentType.includes('PAYMENT') ||
          line.documentType === 'INCOMING' ||
          line.documentType === 'OUTGOING'
        );
      }
      return true;
    });
  }, [statement, statementFilter]);

  // DataGrid Columns Definition
  const columns: Column<BusinessPartner>[] = [
    {
      id: 'code',
      header: 'Cari Kodu',
      width: '120px',
      accessor: (p) => <span className="font-mono font-bold text-slate-900">{p.code}</span>,
    },
    {
      id: 'title',
      header: 'Ticari Unvan',
      accessor: (p) => (
        <div>
          <span className="font-bold text-slate-900 block truncate">{p.title}</span>
          {p.address && <span className="text-[10px] text-slate-400 block truncate">{p.address}</span>}
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Cari Türü',
      width: '110px',
      accessor: (p) => <StatusBadge status={p.type} />,
    },
    {
      id: 'tax',
      header: 'Vergi No / Daire',
      width: '150px',
      accessor: (p) => (
        <span className="font-mono text-slate-700 text-[11px]">
          {p.taxNumber ? (
            <>
              {p.taxOffice ? `${p.taxOffice} / ` : ''}
              <strong>{p.taxNumber}</strong>
            </>
          ) : (
            <span className="text-slate-400 italic">Belirtilmedi</span>
          )}
        </span>
      ),
    },
    {
      id: 'contact',
      header: 'İletişim',
      width: '180px',
      accessor: (p) => (
        <div className="text-[11px] text-slate-600 space-y-0.5">
          {p.phone && <div className="font-mono">Tel: {p.phone}</div>}
          {p.email && <div className="truncate">E-posta: {p.email}</div>}
        </div>
      ),
    },
    {
      id: 'totalDebit',
      header: 'Toplam Borç',
      align: 'right',
      width: '120px',
      accessor: (p) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(p.totalDebit || 0)}
        </span>
      ),
    },
    {
      id: 'totalCredit',
      header: 'Toplam Alacak',
      align: 'right',
      width: '120px',
      accessor: (p) => (
        <span className="font-mono font-medium text-emerald-600">
          {formatCurrency(p.totalCredit || 0)}
        </span>
      ),
    },
    {
      id: 'balance',
      header: 'Güncel Bakiye',
      align: 'right',
      width: '140px',
      accessor: (p) => {
        const bal = p.balance || 0;
        return (
          <div className="font-mono text-right whitespace-nowrap">
            <span
              className={`font-bold ${
                bal > 0 ? 'text-amber-700' : bal < 0 ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              {formatCurrency(bal)}
            </span>
            <span
              className={`inline-block ml-1.5 text-[9px] px-1 py-0.2 rounded font-semibold ${
                bal > 0
                  ? 'bg-amber-100 text-amber-800'
                  : bal < 0
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {bal > 0 ? '(B) Borçlu' : bal < 0 ? '(A) Alacaklı' : '0 ₺'}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-0 select-none">
      {/* 1. DİA ERP Toolbar */}
      <ErpToolbar
        title="Cari Hesap Kartları (B2B Partnerler)"
        subtitle="Müşteri ve Tedarikçi Bakiye / Ekstre Yönetimi"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari unvanı, kodu veya vergi no ile ara..."
        onRefresh={loadData}
        actions={[
          {
            label: 'Yeni Cari Kartı',
            icon: <Plus className="w-3.5 h-3.5 text-white" />,
            onClick: () => setIsCreateModalOpen(true),
            variant: 'primary',
          },
          {
            label: 'Cari Ekstre',
            icon: <Receipt className="w-3.5 h-3.5 text-indigo-600" />,
            onClick: () => {
              if (!selectedPartner) {
                toast.warning('Lütfen ekstresini görmek istediğiniz cari hesabı seçiniz.');
                return;
              }
              handleOpenStatement(selectedPartner);
            },
            disabled: !selectedPartner,
            title: 'Seçili carinin kronolojik hesap ekstresini açar',
          },
          {
            label: 'Yazdır (Cari Listesi)',
            icon: <Printer className="w-3.5 h-3.5 text-slate-600" />,
            onClick: () => window.print(),
          },
        ]}
      >
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1 text-xs">
          {[
            { id: 'ALL', label: 'Tümü' },
            { id: 'CUSTOMER', label: 'Müşteriler' },
            { id: 'SUPPLIER', label: 'Tedarikçiler' },
            { id: 'DEBTOR', label: 'Borçlu Olanlar (B)' },
            { id: 'CREDITOR', label: 'Alacaklı Olanlar (A)' },
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
        data={filteredPartners}
        columns={columns}
        keyExtractor={(p) => p.id}
        selectedId={selectedPartner?.id}
        onSelectRow={(p) => setSelectedPartner(p)}
        onDoubleClickRow={(p) => handleOpenStatement(p)}
        loading={loading}
        emptyMessage="Kayıtlı cari hesap bulunamadı."
      />

      {/* 3. DİA ERP Dip Toplam Çubuğu */}
      <ErpSummaryBar
        totalCount={filteredPartners.length}
        selectedText={
          selectedPartner ? `Seçili Cari: ${selectedPartner.code} — ${selectedPartner.title}` : undefined
        }
        metrics={[
          { label: 'Toplam Borç', value: formatCurrency(totalDebitSum) },
          { label: 'Toplam Alacak', value: formatCurrency(totalCreditSum), highlight: 'success' },
          {
            label: 'Net Portföy Bakiyesi',
            value: formatCurrency(totalBalanceSum),
            highlight: totalBalanceSum > 0 ? 'warning' : 'default',
          },
        ]}
      />

      {/* MODAL 1: Cari Ekstre Penceresi */}
      <Dialog
        isOpen={statementModalOpen}
        onClose={() => setStatementModalOpen(false)}
        title={`Cari Hesap Ekstresi — ${selectedPartner?.title || ''}`}
        description="Fatura ve ödeme hareketlerinin kronolojik dökümü ve kümülatif bakiye ekstresi"
        maxWidth="4xl"
      >
        {statementLoading ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs">Cari hesap hareketleri yükleniyor...</p>
          </div>
        ) : statement ? (
          <div className="space-y-4">
            {/* Cari Kimlik Bandı */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-slate-900 text-base font-bold">{statement.partnerName}</strong>
                  <span className="font-mono text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-800 font-semibold">
                    {statement.partnerCode}
                  </span>
                  <StatusBadge status={statement.partnerType} />
                </div>
                <div className="flex items-center gap-3 text-slate-500 mt-1">
                  {selectedPartner?.taxNumber && <span>Vergi No: <strong className="text-slate-700">{selectedPartner.taxNumber}</strong></span>}
                  {selectedPartner?.phone && <span>Tel: <strong className="text-slate-700">{selectedPartner.phone}</strong></span>}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1.5 text-xs cursor-pointer">
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Ekstre Yazdır / PDF</span>
              </Button>
            </div>

            {/* 3'lü Finansal Özet */}
            <div className="grid grid-cols-3 gap-3 text-center font-mono">
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg shadow-2xs">
                <span className="text-[10px] text-blue-700 font-sans font-semibold block">Toplam Borç (Faturalar)</span>
                <strong className="text-base font-black text-blue-950 font-mono">{formatCurrency(statement.totalDebit)}</strong>
              </div>
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg shadow-2xs">
                <span className="text-[10px] text-emerald-700 font-sans font-semibold block">Toplam Alacak (Tahsilatlar)</span>
                <strong className="text-base font-black text-emerald-950 font-mono">{formatCurrency(statement.totalCredit)}</strong>
              </div>
              <div
                className={`p-2.5 border rounded-lg shadow-2xs ${
                  statement.balance > 0
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : statement.balance < 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <span className="text-[10px] font-sans font-semibold block uppercase tracking-wider">
                  {statement.balance > 0
                    ? 'Açık Alacak Bakiyesi'
                    : statement.balance < 0
                    ? 'Fazla Tahsilat / Avans'
                    : 'Bakiye Sıfır'}
                </span>
                <strong className="text-base font-black font-mono">
                  {formatCurrency(Math.abs(statement.balance))}
                </strong>
              </div>
            </div>

            {/* Filtre Butonları */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 mr-1">Hareket Türü:</span>
                {['ALL', 'INVOICE', 'PAYMENT'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setStatementFilter(type as any)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                      statementFilter === type
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {type === 'ALL' ? 'Tümü' : type === 'INVOICE' ? 'Faturalar' : 'Ödemeler'}
                  </button>
                ))}
              </div>
              <span className="text-slate-400">{filteredStatementLines.length} hareket listelendi</span>
            </div>

            {/* Hareket Tablosu */}
            <div className="border border-slate-300 rounded overflow-hidden max-h-[340px] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-slate-200 text-slate-800 border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Tarih</th>
                    <th className="p-2 border-r border-slate-300">Belge No & Türü</th>
                    <th className="p-2 border-r border-slate-300">Açıklama</th>
                    <th className="p-2 text-right border-r border-slate-300">Borç</th>
                    <th className="p-2 text-right border-r border-slate-300">Alacak</th>
                    <th className="p-2 text-right">Kümülatif Bakiye</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStatementLines.map((line, idx) => {
                    const isInvoice = line.documentType.includes('INVOICE');
                    return (
                      <tr key={idx} className="hover:bg-slate-50 font-mono">
                        <td className="p-2 border-r border-slate-200 text-slate-600 whitespace-nowrap">
                          {formatDate(line.date)}
                        </td>
                        <td className="p-2 border-r border-slate-200 whitespace-nowrap">
                          <strong className="text-slate-900">{line.documentNumber}</strong>
                          <span
                            className={`ml-1.5 inline-block text-[9px] px-1 py-0.2 rounded font-sans font-semibold ${
                              isInvoice ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isInvoice ? 'Fatura' : 'Ödeme'}
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-200 font-sans text-slate-700 truncate max-w-xs">
                          {line.description}
                        </td>
                        <td className="p-2 text-right border-r border-slate-200 font-bold text-slate-900">
                          {line.debit > 0 ? formatCurrency(line.debit, line.currency) : '-'}
                        </td>
                        <td className="p-2 text-right border-r border-slate-200 font-bold text-emerald-700">
                          {line.credit > 0 ? formatCurrency(line.credit, line.currency) : '-'}
                        </td>
                        <td
                          className={`p-2 text-right font-bold ${
                            line.runningBalance > 0
                              ? 'text-amber-700'
                              : line.runningBalance < 0
                              ? 'text-blue-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {formatCurrency(line.runningBalance, line.currency)}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStatementLines.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        Bu cariye ait henüz hesap hareketi kaydı bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setStatementModalOpen(false)}>
                Kapat
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs">Cari ekstre bilgisi alınamadı.</div>
        )}
      </Dialog>

      {/* MODAL 2: Yeni Cari Kartı Açma */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Yeni Cari Hesap Kartı Aç"
        description="Müşteri, tedarikçi veya kurumsal iş ortağı kartı tanımlayın"
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePartner} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Cari Kodu"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="Örn: CAR-004"
              required
            />
            <div className="col-span-2">
              <Input
                label="Ticari Unvan"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Örn: Kuzey Konfeksiyon Dış Ticaret Ltd."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cari Türü</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as PartnerType)}
                className="w-full h-8 text-xs bg-white border border-slate-300 rounded px-2.5 focus:outline-none focus:border-slate-800"
              >
                <option value="CUSTOMER">Müşteri (Alıcı)</option>
                <option value="SUPPLIER">Tedarikçi (Satıcı)</option>
                <option value="BOTH">Hem Müşteri Hem Tedarikçi</option>
              </select>
            </div>
            <Input
              label="Vergi Numarası"
              value={newTaxNumber}
              onChange={(e) => setNewTaxNumber(e.target.value)}
              placeholder="9810239481"
            />
            <Input
              label="Vergi Dairesi"
              value={newTaxOffice}
              onChange={(e) => setNewTaxOffice(e.target.value)}
              placeholder="Maslak VD"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="E-posta"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="muhasebe@sirket.com"
            />
            <Input
              label="Telefon"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+90 212 000 00 00"
            />
          </div>

          <Input
            label="Adres"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Organize Sanayi Bölgesi..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" size="sm" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" variant="primary">
              Cari Kartı Kaydet
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
