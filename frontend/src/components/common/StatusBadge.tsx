import React from 'react';
import { Badge } from '../ui/badge';
import { QuotationStatus, OrderStatus, WaybillStatus, PartnerType } from '../../types';

interface StatusBadgeProps {
  status: QuotationStatus | OrderStatus | WaybillStatus | PartnerType | string;
  type?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type, className = '' }) => {
  if (type) {
    const v = type === 'danger' ? 'destructive' : type;
    return <Badge variant={v as any} className={className}>{status}</Badge>;
  }

  switch (status) {
    // Inventory Stock Statuses
    case 'Tükendi':
      return <Badge variant="destructive" className={className}>Tükendi</Badge>;
    case 'Kritik':
      return <Badge variant="warning" className={className}>Kritik</Badge>;
    case 'Yeterli':
      return <Badge variant="success" className={className}>Yeterli</Badge>;

    // Quotation Statuses
    case 'DRAFT':
      return <Badge variant="default" className={className}>Taslak</Badge>;
    case 'SENT':
      return <Badge variant="info" className={className}>Gönderildi</Badge>;
    case 'ACCEPTED':
      return <Badge variant="success" className={className}>Kabul Edildi</Badge>;
    case 'REJECTED':
      return <Badge variant="destructive" className={className}>Reddedildi</Badge>;
    case 'EXPIRED':
      return <Badge variant="outline" className={className}>Süresi Doldu</Badge>;
    case 'CONVERTED':
      return <Badge variant="purple" className={className}>Siparişe Dönüştü</Badge>;

    // Order Statuses
    case 'CONFIRMED':
      return <Badge variant="success" className={className}>Onaylandı (Stok Rezerve)</Badge>;
    case 'CANCELLED':
      return <Badge variant="destructive" className={className}>İptal Edildi</Badge>;
    case 'COMPLETED':
      return <Badge variant="info" className={className}>Tamamlandı</Badge>;

    // Waybill Statuses
    case 'DISPATCHED':
      return <Badge variant="warning" className={className}>Sevk Edildi (Yolda)</Badge>;
    case 'DELIVERED':
      return <Badge variant="success" className={className}>Teslim Edildi</Badge>;

    // Partner Types
    case 'CUSTOMER':
      return <Badge variant="info" className={className}>Müşteri</Badge>;
    case 'SUPPLIER':
      return <Badge variant="purple" className={className}>Tedarikçi</Badge>;
    case 'BOTH':
      return <Badge variant="default" className={className}>Müşteri & Tedarikçi</Badge>;

    default:
      return <Badge variant="default" className={className}>{status}</Badge>;
  }
};
