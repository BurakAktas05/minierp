/**
 * MiniERP Merkezi Formatlayıcılar (Formatters)
 * Para birimi, tarih, saat ve sayı gösterimlerini uluslararası ve Türkçe standartlara göre tek noktadan yönetir.
 */

/**
 * Para birimi formatlayıcı (Varsayılan: TRY / ₺)
 */
export const formatCurrency = (amount: number = 0, currency: string = 'TRY'): string => {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch {
    return `${(Number(amount) || 0).toFixed(2)} ${currency || 'TRY'}`;
  }
};

/**
 * Kısa tarih formatlayıcı (Örn: 18.09.2026)
 */
export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
};

/**
 * Tarih ve saat formatlayıcı (Örn: 18.09.2026 14:30)
 */
export const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
};

/**
 * Standart sayı / miktar formatlayıcı (Örn: 1.250,50)
 */
export const formatNumber = (val: number = 0, fractionDigits: number = 2): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(Number(val) || 0);
};
