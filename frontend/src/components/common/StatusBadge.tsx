import React from 'react';
import { Badge } from '../ui/badge';
import {
  QuotationStatus,
  OrderStatus,
  WaybillStatus,
  PartnerType,
  InvoiceStatus,
  WorkOrderStatus,
  PaymentStatus,
} from '../../types';

/**
 * MiniERP sistemindeki tüm durum, tip ve kodları kullanıcı dostu Türkçe metinlere çevirir.
 */
export const getTurkishStatusLabel = (status: any): string => {
  if (status === null || status === undefined) return '';
  const s = String(status).trim().toUpperCase();

  switch (s) {
    // 1. Teklif Durumları (QuotationStatus)
    case 'DRAFT':
      return 'Taslak';
    case 'SENT':
      return 'Gönderildi';
    case 'ACCEPTED':
      return 'Kabul Edildi';
    case 'REJECTED':
      return 'Reddedildi';
    case 'EXPIRED':
      return 'Süresi Doldu';
    case 'CONVERTED':
      return 'Siparişe Dönüştü';

    // 2. Sipariş Durumları (OrderStatus)
    case 'CONFIRMED':
      return 'Onaylandı (Stok Rezerve)';
    case 'PROCESSING':
      return 'İşleniyor';
    case 'SHIPPED':
      return 'Kargolandı / Sevk Edildi';
    case 'DELIVERED':
      return 'Teslim Edildi';
    case 'COMPLETED':
      return 'Tamamlandı';
    case 'CANCELLED':
      return 'İptal Edildi';

    // 3. İrsaliye Durumları (WaybillStatus)
    case 'ISSUED':
      return 'Düzenlendi';
    case 'DISPATCHED':
      return 'Sevk Edildi (Yolda)';

    // 4. Fatura Durumları (InvoiceStatus)
    case 'APPROVED':
      return 'Onaylandı';
    case 'PAID':
      return 'Ödendi';
    case 'PARTIALLY_PAID':
      return 'Kısmi Ödendi';
    case 'UNPAID':
      return 'Açık / Ödenmedi';
    case 'OVERDUE':
      return 'Vadesi Geçti';

    // 5. Tahsilat / Ödeme Durumları (PaymentStatus)
    case 'PENDING':
      return 'Beklemede';

    // 6. Üretim & İş Emri Durumları (WorkOrderStatus)
    case 'PLANNED':
      return 'Planlandı';
    case 'IN_PROGRESS':
      return 'Üretimde';

    // 7. Cari Türleri (PartnerType)
    case 'CUSTOMER':
      return 'Müşteri';
    case 'SUPPLIER':
      return 'Tedarikçi';
    case 'BOTH':
      return 'Müşteri & Tedarikçi';

    // 8. Belge ve Hareket Tipleri
    case 'SALES':
    case 'SALES_ORDER':
      return 'Satış Siparişi';
    case 'PURCHASE':
    case 'PURCHASE_ORDER':
      return 'Satın Alma Siparişi';
    case 'SALES_INVOICE':
      return 'Satış Faturası';
    case 'PURCHASE_INVOICE':
      return 'Alış Faturası';
    case 'DISPATCH':
      return 'Sevk İrsaliyesi';
    case 'RECEIPT':
      return 'Mal Kabul İrsaliyesi';
    case 'INCOMING':
      return 'Tahsilat (Giriş)';
    case 'OUTGOING':
      return 'Tediye (Çıkış)';
    case 'CASH':
      return 'Nakit';
    case 'BANK':
    case 'BANK_TRANSFER':
      return 'Havale / EFT';

    // 9. Öncelik Seviyeleri (Priority)
    case 'URGENT':
      return 'Acil';
    case 'HIGH':
      return 'Yüksek';
    case 'NORMAL':
      return 'Normal';
    case 'LOW':
      return 'Düşük';

    // 10. Stok Türleri ve Seviyeleri
    case 'FINISHED_GOOD':
      return 'Mamul';
    case 'RAW_MATERIAL':
      return 'Hammadde';
    case 'SEMI_FINISHED':
      return 'Yarı Mamul';
    case 'SERVICE':
      return 'Hizmet';
    case 'COMMERCIAL_GOOD':
      return 'Ticari Mal';
    case 'TÜKENDİ':
    case 'TÜKENDI':
      return 'Tükendi';
    case 'KRİTİK':
    case 'KRITIK':
      return 'Kritik';
    case 'YETERLİ':
    case 'YETERLI':
      return 'Yeterli';

    // 11. Aktif / Pasif
    case 'ACTIVE':
    case 'TRUE':
      return 'Aktif';
    case 'PASSIVE':
    case 'INACTIVE':
    case 'FALSE':
      return 'Pasif';

    // 12. Kullanıcı Rolleri
    case 'ROLE_ADMIN':
    case 'ADMIN':
      return 'Sistem Yöneticisi';
    case 'ROLE_MANAGER':
    case 'MANAGER':
      return 'Birim Müdürü';
    case 'ROLE_USER':
    case 'USER':
      return 'Personel';

    default:
      return String(status);
  }
};

interface StatusBadgeProps {
  status:
    | QuotationStatus
    | OrderStatus
    | WaybillStatus
    | InvoiceStatus
    | WorkOrderStatus
    | PaymentStatus
    | PartnerType
    | string;
  type?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type, className = '' }) => {
  const label = getTurkishStatusLabel(status);

  if (type) {
    const v = type === 'danger' ? 'destructive' : type;
    return (
      <Badge variant={v as any} className={className}>
        {label}
      </Badge>
    );
  }

  const s = String(status || '').trim().toUpperCase();

  switch (s) {
    // Başarılı (Yeşil) Durumlar
    case 'ACCEPTED':
    case 'CONFIRMED':
    case 'DELIVERED':
    case 'APPROVED':
    case 'PAID':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'TRUE':
    case 'YETERLİ':
    case 'YETERLI':
    case 'RECEIPT':
      return (
        <Badge variant="success" className={className}>
          {label}
        </Badge>
      );

    // Uyarı (Sarı / Turuncu) Durumlar
    case 'DISPATCHED':
    case 'PARTIALLY_PAID':
    case 'UNPAID':
    case 'PENDING':
    case 'PROCESSING':
    case 'IN_PROGRESS':
    case 'KRİTİK':
    case 'KRITIK':
    case 'DISPATCH':
    case 'HIGH':
      return (
        <Badge variant="warning" className={className}>
          {label}
        </Badge>
      );

    // Tehlike / İptal (Kırmızı) Durumlar
    case 'REJECTED':
    case 'CANCELLED':
    case 'OVERDUE':
    case 'TÜKENDİ':
    case 'TÜKENDI':
    case 'PASSIVE':
    case 'INACTIVE':
    case 'FALSE':
    case 'URGENT':
      return (
        <Badge variant="destructive" className={className}>
          {label}
        </Badge>
      );

    // Bilgi (Mavi) Durumlar
    case 'SENT':
    case 'SHIPPED':
    case 'PLANNED':
    case 'ISSUED':
    case 'CUSTOMER':
    case 'SALES':
    case 'SALES_ORDER':
    case 'SALES_INVOICE':
    case 'ROLE_USER':
      return (
        <Badge variant="info" className={className}>
          {label}
        </Badge>
      );

    // Mor / Özel Durumlar
    case 'CONVERTED':
    case 'SUPPLIER':
    case 'PURCHASE':
    case 'PURCHASE_ORDER':
    case 'PURCHASE_INVOICE':
    case 'ROLE_ADMIN':
    case 'SERVICE':
      return (
        <Badge variant="purple" className={className}>
          {label}
        </Badge>
      );

    // Taslak / Nötr Durumlar
    case 'DRAFT':
    case 'BOTH':
    case 'NORMAL':
    case 'COMMERCIAL_GOOD':
      return (
        <Badge variant="default" className={className}>
          {label}
        </Badge>
      );

    case 'EXPIRED':
    case 'LOW':
      return (
        <Badge variant="outline" className={className}>
          {label}
        </Badge>
      );

    default:
      return (
        <Badge variant="default" className={className}>
          {label}
        </Badge>
      );
  }
};
