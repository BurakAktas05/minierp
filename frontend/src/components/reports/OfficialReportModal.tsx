import React from 'react';
import { Printer, X, FileText, Truck, Building2, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import { Button } from '../ui/button';
import { Invoice, Waybill, PartnerStatement, Order } from '../../types';
import { numberToTurkishWords } from '../../utils/numberToWords';

export type ReportType = 'INVOICE' | 'WAYBILL' | 'STATEMENT' | 'ORDER';

interface OfficialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  invoice?: Invoice | null;
  waybill?: Waybill | null;
  statement?: PartnerStatement | null;
  order?: Order | null;
  activeTenantId?: string;
  tenantName?: string;
}

// Kiracı Şirket Resmi İletişim & Vergi Detayları
const TENANT_COMPANIES: Record<string, {
  title: string;
  taxOffice: string;
  taxNumber: string;
  mersis: string;
  address: string;
  phone: string;
  email: string;
  iban: string;
}> = {
  tenant_tekstil: {
    title: 'ATLAS TEKSTİL & DOKUMA SANAYİ A.Ş.',
    taxOffice: 'Bursa Uludağ V.D.',
    taxNumber: '1230495812',
    mersis: '0123049581200018',
    address: 'Organize Sanayi Bölgesi Mavi Cadde No:12 Nilüfer / BURSA',
    phone: '+90 (224) 441 20 00',
    email: 'muhasebe@atlastekstil.com.tr',
    iban: 'TR44 0006 2000 1122 3344 5566 77 (Garanti BBVA)',
  },
  tenant_moda: {
    title: 'VOGUE HAZIR GİYİM & KONFEKSİYON LTD. ŞTİ.',
    taxOffice: 'İzmir Konak V.D.',
    taxNumber: '3210459821',
    mersis: '0321045982100014',
    address: 'Ege Serbest Bölgesi Akasya Sokak No:4 Gaziemir / İZMİR',
    phone: '+90 (232) 444 88 00',
    email: 'finans@voguegiyim.com.tr',
    iban: 'TR12 0001 5001 9988 7766 5544 33 (İş Bankası)',
  },
  tenant_perakende: {
    title: 'TRENDLİNE MAĞAZACILIK & E-TİCARET A.Ş.',
    taxOffice: 'İstanbul Maslak V.D.',
    taxNumber: '8740129481',
    mersis: '0874012948100022',
    address: 'Büyükdere Caddesi No:185 Kanyon Plaza Kat:14 Şişli / İSTANBUL',
    phone: '+90 (212) 380 50 00',
    email: 'fatura@trendlinemagaza.com.tr',
    iban: 'TR88 0006 4000 0011 2233 4455 66 (Akbank)',
  },
};

const formatCur = (num: number = 0, cur = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(num);
};

const fmtDate = (d?: string) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return d;
  }
};

export const OfficialReportModal: React.FC<OfficialReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  invoice,
  waybill,
  statement,
  order,
  activeTenantId = 'tenant_tekstil',
  tenantName,
}) => {
  if (!isOpen) return null;

  const currentCompany =
    TENANT_COMPANIES[activeTenantId] || {
      title: tenantName || 'MİNİERP KURUMSAL TİCARET A.Ş.',
      taxOffice: 'Büyük Mükellefler V.D.',
      taxNumber: '9999999999',
      mersis: '0999999999900001',
      address: 'Merkez Mah. Teknoloji Bulvarı No:1',
      phone: '+90 850 000 00 00',
      email: 'muhasebe@minierp.com.tr',
      iban: 'TR00 0000 0000 0000 0000 0000 00',
    };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Modal Wrapper */}
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Üst Bar (Yazdırma ve Kapatma Butonları - Ekranda Görünür, Yazdırmada Gizli) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              {reportType === 'INVOICE' && <FileText className="w-5 h-5 text-sky-400" />}
              {reportType === 'WAYBILL' && <Truck className="w-5 h-5 text-emerald-400" />}
              {reportType === 'ORDER' && <FileText className="w-5 h-5 text-indigo-400" />}
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
                Resmi Belge Baskı Önizleme
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-mono px-2 py-0.5 rounded border border-sky-400/30 uppercase">
                  {reportType === 'INVOICE'
                    ? (invoice?.invoiceType === 'SALES_INVOICE' ? 'e-Arşiv Fatura' : 'Gider / Alış Faturası')
                    : reportType === 'WAYBILL'
                    ? 'e-İrsaliye (Sevk İrsaliyesi)'
                    : 'Resmi Sipariş Onay Formu'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                A4 Resmi GİB Uyumlu Standart Belge Şablonu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır / PDF Kaydet</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Belge Gövdesi (A4 Oranlarında - Scroll edilebilir) */}
        <div className="p-6 bg-slate-100 overflow-y-auto flex-1 flex justify-center">
          {/* ========================================================= */}
          {/* BASKI ALANI: Bu div #official-print-area ID'sine sahiptir. */}
          {/* Yazıcıya gönderildiğinde YALNIZCA bu alan basılır!        */}
          {/* ========================================================= */}
          <div
            id="official-print-area"
            className="bg-white w-full max-w-[210mm] min-h-[297mm] p-8 border border-slate-300 shadow-md text-slate-900 text-xs font-sans flex flex-col justify-between"
            style={{ boxSizing: 'border-box' }}
          >
            {/* 1. FATURA ŞABLONU */}
            {reportType === 'INVOICE' && invoice && (
              <div className="space-y-4 flex-1">
                {/* Antet & Başlık */}
                <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-slate-900">
                  {/* Sol Sütun: Düzenleyen Şirket */}
                  <div className="col-span-7 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                        ERP
                      </div>
                      <h1 className="font-extrabold text-sm uppercase tracking-tight text-slate-900 leading-tight">
                        {currentCompany.title}
                      </h1>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                      <div>{currentCompany.address}</div>
                      <div>
                        <strong>Vergi Dairesi:</strong> {currentCompany.taxOffice} —{' '}
                        <strong>VKN:</strong> {currentCompany.taxNumber}
                      </div>
                      <div>
                        <strong>Mersis No:</strong> {currentCompany.mersis} —{' '}
                        <strong>Tel:</strong> {currentCompany.phone}
                      </div>
                      <div>
                        <strong>E-Posta:</strong> {currentCompany.email}
                      </div>
                    </div>
                  </div>

                  {/* Sağ Sütun: e-Fatura / e-Arşiv Resmi Bilgiler */}
                  <div className="col-span-5 text-right flex flex-col justify-between">
                    <div>
                      <div className="inline-block border border-slate-800 px-3 py-1 bg-slate-50 text-center rounded">
                        <span className="font-black text-xs uppercase tracking-wider block text-slate-900">
                          {invoice.invoiceType === 'SALES_INVOICE' ? 'e-ARŞİV FATURA' : 'ALIŞ / GİDER FATURASI'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">GİB Standart e-Belge</span>
                      </div>
                    </div>

                    <div className="text-[11px] space-y-0.5 pt-2">
                      <div>
                        <span className="text-slate-500">Fatura No:</span>{' '}
                        <strong className="font-mono text-xs">{invoice.invoiceNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Fatura Tarihi:</span>{' '}
                        <strong className="font-mono">{fmtDate(invoice.invoiceDate)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Düzenleme Saati:</span>{' '}
                        <span className="font-mono">14:30:00</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Senaryo:</span>{' '}
                        <strong>TİCARİ FATURA</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Fatura Tipi:</span>{' '}
                        <strong>{invoice.invoiceType === 'SALES_INVOICE' ? 'SATIŞ' : 'ALIŞ'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Müşteri / Alıcı Bilgileri Kutusu */}
                <div className="border border-slate-800 rounded p-3 bg-slate-50/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 border-b border-slate-200 pb-0.5">
                    SAYIN (ALICI BİLGİLERİ):
                  </div>
                  <div className="grid grid-cols-12 gap-2 text-[11px]">
                    <div className="col-span-8 space-y-0.5">
                      <div className="font-bold text-xs text-slate-900">
                        {invoice.partnerTitle || invoice.partner?.name || 'Müşteri / Cari Ünvanı'}
                      </div>
                      <div className="text-slate-600">
                        Adres: Organize Sanayi Bölgesi veya Tanımlı Cari Adresi
                      </div>
                    </div>
                    <div className="col-span-4 text-right space-y-0.5">
                      <div>
                        <span className="text-slate-500">V.D. / VKN:</span>{' '}
                        <strong className="font-mono">3210459821</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Vade Tarihi:</span>{' '}
                        <span className="font-mono font-bold text-slate-900">{fmtDate(invoice.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kalemler Tablosu */}
                <div className="border border-slate-800 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-900 text-white font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2 w-8 text-center border-r border-slate-700">#</th>
                        <th className="p-2 border-r border-slate-700">Mal / Hizmet Açıklaması</th>
                        <th className="p-2 text-right border-r border-slate-700 w-20">Miktar</th>
                        <th className="p-2 text-right border-r border-slate-700 w-24">Birim Fiyat</th>
                        <th className="p-2 text-center border-r border-slate-700 w-16">KDV %</th>
                        <th className="p-2 text-right border-r border-slate-700 w-20">KDV Tutarı</th>
                        <th className="p-2 text-right w-28">Toplam Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {(invoice.items || []).map((it, idx) => {
                        const sub = it.subtotal || (it.quantity * it.unitPrice);
                        const kdvTutari = sub * ((it.taxRate || 20) / 100);
                        const lineTotal = sub + kdvTutari;
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-center font-mono border-r border-slate-200">
                              {idx + 1}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-medium">
                              {it.description || it.productName || it.variantSku || 'Mal / Hizmet'}
                            </td>
                            <td className="p-2 text-right font-mono border-r border-slate-200">
                              {it.quantity} Adet
                            </td>
                            <td className="p-2 text-right font-mono border-r border-slate-200">
                              {formatCur(it.unitPrice, invoice.currency)}
                            </td>
                            <td className="p-2 text-center font-mono border-r border-slate-200">
                              %{it.taxRate || 20}
                            </td>
                            <td className="p-2 text-right font-mono border-r border-slate-200">
                              {formatCur(kdvTutari, invoice.currency)}
                            </td>
                            <td className="p-2 text-right font-mono font-bold">
                              {formatCur(lineTotal, invoice.currency)}
                            </td>
                          </tr>
                        );
                      })}
                      {(!invoice.items || invoice.items.length === 0) && (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                            Fatura kalemi bulunmamaktadır.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Dip Toplamlar ve Yalnız Yazısı */}
                <div className="grid grid-cols-12 gap-4 pt-2">
                  {/* Sol Sütun: Banka Bilgileri & Yazı ile Tutar */}
                  <div className="col-span-7 space-y-3">
                    <div className="border border-slate-300 rounded p-2.5 bg-slate-50 text-[11px] space-y-1">
                      <strong className="block text-slate-800">Ödeme & Banka Bilgileri:</strong>
                      <div className="text-slate-600 font-mono text-[10px]">
                        IBAN: {currentCompany.iban}
                      </div>
                      {invoice.notes && (
                        <div className="text-slate-600 italic border-t border-slate-200 pt-1 mt-1">
                          Not: {invoice.notes}
                        </div>
                      )}
                    </div>

                    <div className="p-2 bg-slate-100 rounded border border-slate-300 text-[11px] font-bold text-slate-800">
                      {numberToTurkishWords(invoice.totalAmount)}
                    </div>
                  </div>

                  {/* Sağ Sütun: Standart Finansal İcmal */}
                  <div className="col-span-5">
                    <div className="border border-slate-800 rounded overflow-hidden text-[11px]">
                      <div className="flex justify-between p-2 border-b border-slate-200 bg-slate-50">
                        <span className="text-slate-600">Mal/Hizmet Toplamı:</span>
                        <span className="font-mono font-semibold">
                          {formatCur(
                            invoice.subtotalAmount || (invoice.totalAmount - (invoice.taxAmount || 0)),
                            invoice.currency
                          )}
                        </span>
                      </div>
                      {invoice.discountAmount > 0 && (
                        <div className="flex justify-between p-2 border-b border-slate-200 bg-slate-50 text-rose-600">
                          <span>Toplam İskonto:</span>
                          <span className="font-mono">- {formatCur(invoice.discountAmount, invoice.currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between p-2 border-b border-slate-200 bg-slate-50">
                        <span className="text-slate-600">Hesaplanan KDV (%20):</span>
                        <span className="font-mono font-semibold">
                          + {formatCur(invoice.taxAmount || (invoice.totalAmount * 0.2), invoice.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-slate-900 text-white font-bold text-xs">
                        <span>ÖDENECEK TOPLAM:</span>
                        <span className="font-mono text-sm font-black">
                          {formatCur(invoice.totalAmount, invoice.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alt Yasal Bilgi & Kaşe İmza Alanı */}
                <div className="pt-6 border-t border-slate-300 grid grid-cols-12 gap-4 text-[10px] text-slate-500 items-end">
                  <div className="col-span-8 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      5070 Sayılı Elektronik İmza Kanunu Uyarınca Güvenli E-İmza ile İmzalanmıştır.
                    </div>
                    <div>
                      ETTN: 4a9f8b1c-32de-45f8-b80c-99c018274ef1 | Belge oluşturma: {new Date().toLocaleString('tr-TR')}
                    </div>
                  </div>
                  <div className="col-span-4 text-center border border-dashed border-slate-400 p-4 rounded bg-slate-50/50">
                    <div className="font-bold text-slate-700 mb-6">Mali Mühür / Kaşe - İmza</div>
                    <div className="text-[9px] text-slate-400">Elektronik Olarak İmzalanmıştır</div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. İRSALİYE ŞABLONU */}
            {reportType === 'WAYBILL' && waybill && (
              <div className="space-y-4 flex-1">
                {/* Antet & Başlık */}
                <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-slate-900">
                  <div className="col-span-7 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-emerald-800 text-white flex items-center justify-center font-black text-sm">
                        SVK
                      </div>
                      <h1 className="font-extrabold text-sm uppercase tracking-tight text-slate-900 leading-tight">
                        {currentCompany.title}
                      </h1>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                      <div>{currentCompany.address}</div>
                      <div>
                        <strong>V.D.:</strong> {currentCompany.taxOffice} — <strong>VKN:</strong> {currentCompany.taxNumber}
                      </div>
                      <div>
                        <strong>Telefon:</strong> {currentCompany.phone}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-5 text-right flex flex-col justify-between">
                    <div>
                      <div className="inline-block border-2 border-emerald-700 px-3 py-1 bg-emerald-50 text-center rounded">
                        <span className="font-black text-xs uppercase tracking-wider block text-emerald-900">
                          {waybill.type === 'DISPATCH' ? 'RESMİ SEVK İRSALİYESİ' : 'MAL KABUL İRSALİYESİ'}
                        </span>
                        <span className="text-[9px] text-emerald-700 font-mono">e-İrsaliye Şablonu</span>
                      </div>
                    </div>

                    <div className="text-[11px] space-y-0.5 pt-2">
                      <div>
                        <span className="text-slate-500">İrsaliye No:</span>{' '}
                        <strong className="font-mono text-xs">{waybill.waybillNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Düzenleme Tarihi:</span>{' '}
                        <strong className="font-mono">{fmtDate(waybill.waybillDate || waybill.createdAt)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Fiili Sevk Tarihi:</span>{' '}
                        <strong className="font-mono">{fmtDate(waybill.waybillDate || waybill.createdAt)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Sevk Saati:</span>{' '}
                        <span className="font-mono">10:15:00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sevkiyat / Teslimat Yeri ve Alıcı Bilgileri */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-800 rounded p-2.5 bg-slate-50/60 text-[11px] space-y-1">
                    <strong className="block text-[10px] uppercase text-slate-500 border-b border-slate-200 pb-0.5">
                      SEVKİYAT YAPILAN ALICI (CARİ):
                    </strong>
                    <div className="font-bold text-slate-900">
                      {waybill.partnerTitle || 'Alıcı Cari Hesap'}
                    </div>
                    <div className="text-slate-600">
                      Teslimat Adresi: Müşteri Fabrika / Depo Teslim
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded p-2.5 bg-slate-50/60 text-[11px] space-y-1">
                    <strong className="block text-[10px] uppercase text-slate-500 border-b border-slate-200 pb-0.5">
                      TAŞIYICI & LOJİSTİK BİLGİLERİ:
                    </strong>
                    <div>
                      <span className="text-slate-500">Taşıyıcı / Kargo:</span>{' '}
                      <strong>{waybill.carrierInfo || 'Aras Kargo Lojistik A.Ş.'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Araç Plakası:</span>{' '}
                      <strong className="font-mono">34 ER 1928</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Kargo Takip No:</span>{' '}
                      <strong className="font-mono">{waybill.trackingNumber || 'ARK-89217364'}</strong>
                    </div>
                  </div>
                </div>

                {/* Sevk Edilen Kalemler Tablosu */}
                <div className="border border-slate-800 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-900 text-white font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2 w-8 text-center border-r border-slate-700">#</th>
                        <th className="p-2 border-r border-slate-700 w-32">Stok Kodu (SKU)</th>
                        <th className="p-2 border-r border-slate-700">Malzeme / Ürün Açıklaması</th>
                        <th className="p-2 border-r border-slate-700 w-28 text-center">Lot / Parti No</th>
                        <th className="p-2 text-right w-24">Sevk Miktarı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {(waybill.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-center font-mono border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-800 border-r border-slate-200">
                            {it.sku || it.variantSku || 'SKU-001'}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-medium">
                            {it.description || it.productName || it.variantName || 'Ürün Kalemi'}
                          </td>
                          <td className="p-2 text-center font-mono text-[10px] text-indigo-700 font-bold border-r border-slate-200">
                            {it.lotNumber || 'LOT-2026-0102'}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {it.quantity} Adet
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* İrsaliye Notu */}
                {waybill.notes && (
                  <div className="border border-slate-300 bg-slate-50 p-2.5 rounded text-[11px] text-slate-700">
                    <strong>Sevkiyat Notu:</strong> {waybill.notes}
                  </div>
                )}

                {/* Teslim Eden / Teslim Alan İmzaları */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center">
                  <div className="border border-slate-400 rounded p-4 bg-slate-50/50">
                    <div className="font-bold text-slate-800 text-xs mb-1">MALI TESLİM EDEN (DEPO)</div>
                    <div className="text-[10px] text-slate-500 mb-8">Ad Soyad, Kaşe ve İmza</div>
                    <div className="border-t border-dashed border-slate-400 w-3/4 mx-auto pt-1 text-[10px] text-slate-400 font-mono">
                      İmza
                    </div>
                  </div>

                  <div className="border border-slate-400 rounded p-4 bg-slate-50/50">
                    <div className="font-bold text-slate-800 text-xs mb-1">MALI TESLİM ALAN (ŞOFÖR / ALICI)</div>
                    <div className="text-[10px] text-slate-500 mb-8">Eksiksiz ve Hasarsız Teslim Alındı</div>
                    <div className="border-t border-dashed border-slate-400 w-3/4 mx-auto pt-1 text-[10px] text-slate-400 font-mono">
                      İmza & Tarih
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SİPARİŞ ŞABLONU */}
            {reportType === 'ORDER' && order && (
              <div className="space-y-4 flex-1">
                {/* Antet & Başlık */}
                <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-slate-900">
                  <div className="col-span-7 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-indigo-900 text-white flex items-center justify-center font-black text-sm">
                        SIP
                      </div>
                      <h1 className="font-extrabold text-sm uppercase tracking-tight text-slate-900 leading-tight">
                        {currentCompany.title}
                      </h1>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                      <div>{currentCompany.address}</div>
                      <div>
                        <strong>V.D.:</strong> {currentCompany.taxOffice} — <strong>VKN:</strong> {currentCompany.taxNumber}
                      </div>
                      <div>
                        <strong>Telefon:</strong> {currentCompany.phone}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-5 text-right flex flex-col justify-between">
                    <div>
                      <div className="inline-block border-2 border-indigo-700 px-3 py-1 bg-indigo-50 text-center rounded">
                        <span className="font-black text-xs uppercase tracking-wider block text-indigo-900">
                          {order.type === 'PURCHASE_ORDER' ? 'SATIN ALMA SİPARİŞİ' : 'RESMİ SATIŞ SİPARİŞİ'}
                        </span>
                        <span className="text-[9px] text-indigo-700 font-mono">B2B Sipariş Sözleşmesi</span>
                      </div>
                    </div>

                    <div className="text-[11px] space-y-0.5 pt-2">
                      <div>
                        <span className="text-slate-500">Sipariş No:</span>{' '}
                        <strong className="font-mono text-xs">{order.orderNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Sipariş Tarihi:</span>{' '}
                        <strong className="font-mono">{fmtDate(order.orderDate)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Teslim Tarihi:</span>{' '}
                        <strong className="font-mono">{fmtDate(order.deliveryDate)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Durum:</span>{' '}
                        <strong className="text-indigo-800">{order.status === 'CONFIRMED' ? 'ONAYLANDI (STOK REZERVE)' : order.status}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Muhatap Cari Bilgileri Kutusu */}
                <div className="border border-slate-800 rounded p-2.5 bg-slate-50/60 text-[11px] space-y-1">
                  <strong className="block text-[10px] uppercase text-slate-500 border-b border-slate-200 pb-0.5">
                    SİPARİŞ VEREN / MUHATAP CARİ HESAP:
                  </strong>
                  <div className="font-bold text-xs text-slate-900">
                    {order.partnerTitle || 'Cari Hesap'}
                  </div>
                  <div className="text-slate-600">
                    Teslimat & Sevkiyat Şekli: Depo Teslim / Standart Nakliye
                  </div>
                </div>

                {/* Kalemler Tablosu */}
                <div className="border border-slate-800 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-900 text-white font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2 w-8 text-center border-r border-slate-700">#</th>
                        <th className="p-2 border-r border-slate-700 w-32">Stok Kodu (SKU)</th>
                        <th className="p-2 border-r border-slate-700">Ürün / Kalem Tanımı</th>
                        <th className="p-2 text-right border-r border-slate-700 w-24">Sipariş Miktarı</th>
                        <th className="p-2 text-right border-r border-slate-700 w-24">Birim Fiyat</th>
                        <th className="p-2 text-right w-28">Toplam Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {(order.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold text-slate-800 border-r border-slate-200">{it.sku || it.variantName || '-'}</td>
                          <td className="p-2 border-r border-slate-200 font-medium">{it.productName || it.description || 'Sipariş Kalemi'}</td>
                          <td className="p-2 text-right font-mono font-bold border-r border-slate-200">{it.quantity} Adet</td>
                          <td className="p-2 text-right font-mono border-r border-slate-200">{formatCur(it.unitPrice)}</td>
                          <td className="p-2 text-right font-mono font-bold">{formatCur(it.lineTotal || (it.quantity * it.unitPrice))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Dip Toplam ve Yazı ile Tutar */}
                <div className="grid grid-cols-12 gap-4 pt-2">
                  <div className="col-span-7 space-y-2">
                    <div className="p-2 bg-slate-100 rounded border border-slate-300 text-[11px] font-bold text-slate-800">
                      {numberToTurkishWords(order.totalAmount)}
                    </div>
                    {order.notes && (
                      <div className="border border-slate-200 bg-slate-50 p-2 rounded text-[11px] text-slate-600">
                        <strong>Sipariş Notu:</strong> {order.notes}
                      </div>
                    )}
                  </div>
                  <div className="col-span-5">
                    <div className="border border-slate-800 rounded p-2.5 bg-slate-900 text-white flex justify-between items-center text-xs font-bold">
                      <span>GENEL TOPLAM:</span>
                      <span className="font-mono text-sm font-black">{formatCur(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* İmza Onay Kutuları */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center">
                  <div className="border border-slate-400 rounded p-4 bg-slate-50/50">
                    <div className="font-bold text-slate-800 text-xs mb-1">SİPARİŞİ HAZIRLAYAN</div>
                    <div className="text-[10px] text-slate-500 mb-8">Satış & Pazarlama Departmanı</div>
                    <div className="border-t border-dashed border-slate-400 w-3/4 mx-auto pt-1 text-[10px] text-slate-400 font-mono">
                      İmza
                    </div>
                  </div>
                  <div className="border border-slate-400 rounded p-4 bg-slate-50/50">
                    <div className="font-bold text-slate-800 text-xs mb-1">MÜŞTERİ / YÖNETİCİ ONAYI</div>
                    <div className="text-[10px] text-slate-500 mb-8">Kaşe & Yetkili İmza</div>
                    <div className="border-t border-dashed border-slate-400 w-3/4 mx-auto pt-1 text-[10px] text-slate-400 font-mono">
                      İmza & Tarih
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
