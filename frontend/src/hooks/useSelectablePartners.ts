import { useState, useMemo, useEffect } from 'react';
import { BusinessPartner, Tenant } from '../types';
import { useAuth } from '../context/AuthContext';
import { isSelfPartner } from '../utils/partnerUtils';

export type PartnerDirection = 'SALES' | 'PURCHASE' | 'CUSTOMER' | 'SUPPLIER' | 'ALL';

export interface UseSelectablePartnersProps {
  partners: BusinessPartner[];
  direction?: PartnerDirection;
  selectedId?: number;
  onAutoSelect?: (partnerId: number) => void;
  initialPartnerId?: number;
}

export interface UseSelectablePartnersResult {
  selectablePartners: BusinessPartner[];
  selectedPartnerId: number;
  setSelectedPartnerId: (id: number) => void;
  selectedPartner: BusinessPartner | null;
  currentTenant: Tenant | undefined;
  isSelf: (p: BusinessPartner) => boolean;
}

/**
 * ERP Standartlarında Cari Hesap Seçim Hook'u
 * 
 * 1. Aktif kiracının kendi tüzel kişiliğini (kendi firmasını) listeden hariç tutar.
 * 2. İşlem yönüne (Satış -> Müşteri, Alış -> Tedarikçi) göre uygun carileri filtreler.
 * 3. Seçili cari listeden düştüğünde veya ilk yüklemede geçerli ilk cariyi otomatik seçer.
 */
export const useSelectablePartners = ({
  partners,
  direction = 'ALL',
  selectedId: controlledSelectedId,
  onAutoSelect,
  initialPartnerId = 0,
}: UseSelectablePartnersProps): UseSelectablePartnersResult => {
  const { activeTenant, tenants } = useAuth();
  const [internalSelectedId, setInternalSelectedId] = useState<number>(initialPartnerId);

  const isControlled = controlledSelectedId !== undefined;
  const selectedPartnerId = isControlled ? controlledSelectedId : internalSelectedId;

  const currentTenant = useMemo(() => {
    return tenants.find((t) => t.id === activeTenant || t.tenantId === activeTenant);
  }, [tenants, activeTenant]);

  const isSelf = (p: BusinessPartner) => isSelfPartner(p, currentTenant);

  const selectablePartners = useMemo(() => {
    return partners.filter((p) => {
      // 1. Kendi firmamız olamaz (kendi kendimize teklif/sipariş/fatura düzenleyemeyiz)
      if (isSelfPartner(p, currentTenant)) {
        return false;
      }

      // 2. İşlem yönüne göre cari türü kontrolü
      if (direction === 'SALES' || direction === 'CUSTOMER') {
        return p.type === 'CUSTOMER' || p.type === 'BOTH';
      }
      if (direction === 'PURCHASE' || direction === 'SUPPLIER') {
        return p.type === 'SUPPLIER' || p.type === 'BOTH';
      }

      return true;
    });
  }, [partners, currentTenant, direction]);

  const setSelectedPartnerId = (id: number) => {
    if (!isControlled) {
      setInternalSelectedId(id);
    }
    if (onAutoSelect) {
      onAutoSelect(id);
    }
  };

  useEffect(() => {
    if (selectablePartners.length > 0) {
      const exists = selectablePartners.some((p) => p.id === selectedPartnerId);
      if (!exists) {
        setSelectedPartnerId(selectablePartners[0].id);
      }
    } else {
      setSelectedPartnerId(0);
    }
  }, [selectablePartners, selectedPartnerId]);

  const selectedPartner = useMemo(() => {
    return partners.find((p) => p.id === selectedPartnerId) || null;
  }, [partners, selectedPartnerId]);

  return {
    selectablePartners,
    selectedPartnerId,
    setSelectedPartnerId,
    selectedPartner,
    currentTenant,
    isSelf,
  };
};
