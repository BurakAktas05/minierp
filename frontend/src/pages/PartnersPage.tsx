import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, RefreshCw, Mail, Phone, MapPin } from 'lucide-react';
import { partnerApi } from '../api/partnerApi';
import { BusinessPartner, PartnerType } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs } from '../components/ui/tabs';
import { Dialog } from '../components/ui/dialog';
import { Card } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { StatusBadge } from '../components/common/StatusBadge';
import { JsonViewer } from '../components/common/JsonViewer';

export const PartnersPage: React.FC = () => {
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // New Partner Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      const typeParam = activeTab === 'ALL' ? undefined : (activeTab as PartnerType);
      const list = await partnerApi.getPartners(typeParam);
      setPartners(list);
    } catch (err) {
      console.error('Cari hesaplar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

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

      setIsModalOpen(false);
      setNewCode('');
      setNewTitle('');
      setNewTaxNumber('');
      setNewEmail('');
      setNewPhone('');
      setNewAddress('');
      await loadData();
    } catch (err: any) {
      alert('Cari kartı eklenirken hata: ' + (err.message || 'Hata'));
    }
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.taxNumber && p.taxNumber.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cari Hesaplar (B2B Partnerler)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Müşteri, tedarikçi ve lojistik iş ortakları portföyü
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yenile</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Cari Kartı Aç</span>
          </Button>
        </div>
      </div>

      {/* Tabs and Search Filter */}
      <Card className="p-4 space-y-4">
        <Tabs
          tabs={[
            { id: 'ALL', label: 'Tüm Cari Hesaplar', count: partners.length },
            { id: 'CUSTOMER', label: 'Müşteriler' },
            { id: 'SUPPLIER', label: 'Tedarikçiler' },
            { id: 'BOTH', label: 'Hem Müşteri Hem Tedarikçi' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari unvanı, cari kodu veya vergi numarası ile arayın..."
            className="pl-9 text-xs"
          />
        </div>
      </Card>

      {/* Partners Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cari Kodu</TableHead>
              <TableHead>Ticari Unvan</TableHead>
              <TableHead>Cari Türü</TableHead>
              <TableHead>Vergi Dairesi / No</TableHead>
              <TableHead>İletişim</TableHead>
              <TableHead>B2B Özel Şartlar (JSONB)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell className="font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                  {partner.code}
                </TableCell>
                <TableCell>
                  <p className="text-xs font-semibold text-slate-900">{partner.title}</p>
                  {partner.address && (
                    <p className="text-[11px] text-slate-500 truncate max-w-[220px] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" /> {partner.address}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={partner.type} />
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-700">
                  {partner.taxNumber ? (
                    <span>
                      {partner.taxOffice ? `${partner.taxOffice} / ` : ''}
                      {partner.taxNumber}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Belirtilmedi</span>
                  )}
                </TableCell>
                <TableCell className="text-xs space-y-1">
                  {partner.email && (
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Mail className="w-3 h-3 text-slate-400" /> {partner.email}
                    </p>
                  )}
                  {partner.phone && (
                    <p className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" /> {partner.phone}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <JsonViewer data={partner.metadata} emptyText="Şart belirtilmedi" />
                </TableCell>
              </TableRow>
            ))}

            {filteredPartners.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
                  Arama kriterlerine uygun cari hesap bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Partner Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Cari Hesap Kartı Aç"
        description="B2B teklif, sipariş ve sevk süreçlerinde kullanılmak üzere kurumsal hesap tanımlayın."
        maxWidth="xl"
      >
        <form onSubmit={handleCreatePartner} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Cari Kodu"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="Örn: CAR-004"
              required
            />
            <div className="sm:col-span-2">
              <Input
                label="Ticari Unvan"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Örn: Kuzey Konfeksiyon Dış Ticaret Ltd."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Cari Türü
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as PartnerType)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
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
              placeholder="Örn: 9810239481"
            />
            <Input
              label="Vergi Dairesi"
              value={newTaxOffice}
              onChange={(e) => setNewTaxOffice(e.target.value)}
              placeholder="Örn: Maslak VD"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="E-posta"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="info@sirket.com.tr"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
            <Input
              label="Ödeme Vadesi (JSONB)"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Örn: 45 Gün Vadeli"
            />
            <Input
              label="Kredi Limiti (TL)"
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="500000"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" variant="primary">
              Cari Kartı Kaydet
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
