import { BusinessPartner, Tenant } from '../types';

/**
 * Kurumsal unvan temizleme ve normalizasyon.
 * Şirket türü eklerini (A.Ş., Ltd., Şti., vb.) ve noktalama işaretlerini ayıklar.
 * Dinamik olarak her iki tarafın kök ticari unvanını karşılaştırır.
 */
const LEGAL_FORM_REGEX = /\b(a\s*\.?\s*ş\.?|ltd\.?|şti\.?|sti\.?|san\.?|tic\.?|sanayi|ticaret|holding|anonim|şirketi|sirketi|ve|ile|inc\.?|corp\.?|llc|gmbh)\b/gi;

export const normalizeCompanyName = (name?: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(LEGAL_FORM_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Dinamik ve kurumsal olarak bir carinin aktif kiracı firmanın kendi şirketi
 * (veya grup içi kendi tüzel kişiliği) olup olmadığını kontrol eder.
 * 
 * Kesinlikle hardcoded firma ismi veya statik if-else içermez.
 * 10.000+ cari hesap ve dinamik yeni kiracılar için tamamen veri odaklı (data-driven) çalışır:
 * 
 * 1. Doğrudan Bayrak: partner.isOwnCompany veya partner.metadata.isOwnCompany / isSelf
 * 2. Kurumsal VKN / Vergi No: Kiracı VKN ile Cari VKN eşleşmesi
 * 3. İlişkili Kiracı Kimliği: partner.metadata.linkedTenantId === activeTenantId
 * 4. Dinamik Şirket Unvanı Normalizasyonu: Kiracının sistemdeki şirket unvanı ile carinin unvanının normalize eşleşmesi
 */
export const isSelfPartner = (
  partner: BusinessPartner,
  activeTenant?: Tenant | { tenantId?: string; name?: string; taxNumber?: string } | string,
  tenantName?: string
): boolean => {
  if (!partner) return false;

  // 1. Doğrudan kurumsal bayrak (Veritabanı veya Metadata'da tanımlı 'Kendi Şirketimiz' alanı)
  if (
    partner.isOwnCompany ||
    partner.metadata?.isOwnCompany === true ||
    partner.metadata?.isOwnCompany === 'true' ||
    partner.metadata?.isSelf === true ||
    partner.metadata?.isSelf === 'true' ||
    partner.metadata?.isInternal === true
  ) {
    return true;
  }

  // Parametreleri normalize et
  const tenantObj = typeof activeTenant === 'object' ? activeTenant : undefined;
  const tenantId = typeof activeTenant === 'string' ? activeTenant : tenantObj?.tenantId;
  const resolvedTenantName = tenantName || tenantObj?.name;
  const tenantTaxNumber = tenantObj?.taxNumber;

  // 2. Inter-company / Çoklu şirket senaryolarında ilişkili kiracı ID eşleşmesi
  if (tenantId && partner.metadata?.linkedTenantId) {
    if (partner.metadata.linkedTenantId === tenantId) {
      return true;
    }
  }

  // 3. Vergi Numarası (VKN / TCKN) eşleşmesi - Kurumsal ERP standardı
  if (tenantTaxNumber && partner.taxNumber) {
    const cleanTenantTax = tenantTaxNumber.replace(/\D/g, '');
    const cleanPartnerTax = partner.taxNumber.replace(/\D/g, '');
    if (cleanTenantTax && cleanPartnerTax && cleanTenantTax === cleanPartnerTax) {
      return true;
    }
  }

  // 4. Dinamik Şirket Unvanı Eşleşmesi (Kiracının resmi unvanı ile carinin unvanı)
  if (resolvedTenantName) {
    const normTenant = normalizeCompanyName(resolvedTenantName);
    const partnerTitle = partner.companyTitle || partner.title || partner.name || '';
    const normPartner = normalizeCompanyName(partnerTitle);

    if (normTenant && normPartner && normTenant === normPartner) {
      return true;
    }
  }

  return false;
};
