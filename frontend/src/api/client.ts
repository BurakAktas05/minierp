import axios, { AxiosError } from 'axios';
import {
  mockTenants,
  tenantMockDataMap,
  TenantDataBundle,
} from './mockData';
import { ApiResponse } from '../types';

// Storage keys
export const TOKEN_KEY = 'minierp_token';
export const TENANT_KEY = 'minierp_tenant_id';
export const USER_KEY = 'minierp_user';
export const DEMO_MODE_KEY = 'minierp_demo_mode';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

// Request Interceptor: Attach JWT and Tenant
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const tenantId = localStorage.getItem(TENANT_KEY) || 'tenant_tekstil';

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  return config;
});

// In-Memory Multi-Tenant Stores for Offline/Demo Resilience
const tenantStores: Record<string, TenantDataBundle> = {};

// Deep clone initial data bundles for each tenant
Object.keys(tenantMockDataMap).forEach((key) => {
  const bundle = tenantMockDataMap[key];
  tenantStores[key] = {
    categories: JSON.parse(JSON.stringify(bundle.categories)),
    products: JSON.parse(JSON.stringify(bundle.products)),
    partners: JSON.parse(JSON.stringify(bundle.partners)),
    quotations: JSON.parse(JSON.stringify(bundle.quotations)),
    orders: JSON.parse(JSON.stringify(bundle.orders)),
    waybills: JSON.parse(JSON.stringify(bundle.waybills)),
    auditLogs: JSON.parse(JSON.stringify(bundle.auditLogs)),
  };
});

let localTenants = [...mockTenants];

/**
 * Returns the data store corresponding to the currently active tenant in localStorage.
 */
function getActiveStore(): TenantDataBundle {
  const currentTenant = localStorage.getItem(TENANT_KEY) || 'tenant_tekstil';
  if (!tenantStores[currentTenant]) {
    tenantStores[currentTenant] = {
      categories: [],
      products: [],
      partners: [],
      quotations: [],
      orders: [],
      waybills: [],
      auditLogs: [],
    };
  }
  return tenantStores[currentTenant];
}

// Hybrid request helper: Tries backend, falls back cleanly to mock data if backend is not running yet
export async function apiRequest<T>(
  requestFn: () => Promise<{ data: ApiResponse<T> | T }>,
  mockFallbackFn: () => T
): Promise<T> {
  const forceDemo = localStorage.getItem(DEMO_MODE_KEY) === 'true';
  if (forceDemo) {
    return mockFallbackFn();
  }

  try {
    const res = await requestFn();
    // Handle both ApiResponse<T> and direct T
    if (res.data && typeof res.data === 'object' && 'success' in (res.data as any)) {
      return (res.data as ApiResponse<T>).data;
    }
    return res.data as T;
  } catch (err) {
    const error = err as AxiosError;
    // If backend connection fails (ECONNREFUSED / Network Error / 404 / 503), use mock fallback
    if (!error.response || error.code === 'ERR_NETWORK' || error.response.status === 404) {
      console.warn('[MiniERP] Backend unreachable, using corporate mock fallback store.', error.message);
      return mockFallbackFn();
    }
    throw error;
  }
}

// Mock Store Accessors: All data is isolated and scoped to the active tenant
export const mockStore = {
  getTenants: () => localTenants,
  addTenant: (t: any) => {
    localTenants = [t, ...localTenants];
    if (!tenantStores[t.id]) {
      tenantStores[t.id] = {
        categories: [],
        products: [],
        partners: [],
        quotations: [],
        orders: [],
        waybills: [],
        auditLogs: [],
      };
    }
    return t;
  },
  getCategories: () => getActiveStore().categories,
  addCategory: (c: any) => {
    const newCat = { ...c, id: Date.now() };
    const store = getActiveStore();
    store.categories = [...store.categories, newCat];
    return newCat;
  },
  getProducts: () => getActiveStore().products,
  getProduct: (id: number) => getActiveStore().products.find((p) => p.id === id),
  addProduct: (p: any) => {
    const store = getActiveStore();
    const newProd = {
      ...p,
      id: Date.now(),
      active: true,
      variants: (p.variants || []).map((v: any, idx: number) => ({
        ...v,
        id: Date.now() + idx + 1,
        reservedStock: 0,
        availableStock: v.initialStock || 0,
        stockQuantity: v.initialStock || 0,
      })),
    };
    store.products = [newProd, ...store.products];
    return newProd;
  },
  updateVariantStock: (variantId: number, amount: number) => {
    const store = getActiveStore();
    for (const prod of store.products) {
      const v = prod.variants.find((v) => v.id === variantId);
      if (v) {
        v.stockQuantity += amount;
        v.availableStock = v.stockQuantity - v.reservedStock;
        return v;
      }
    }
    throw new Error('Varyant bulunamadı');
  },
  reserveVariantStock: (variantId: number, qty: number) => {
    const store = getActiveStore();
    for (const prod of store.products) {
      const v = prod.variants.find((v) => v.id === variantId);
      if (v) {
        v.reservedStock += qty;
        v.availableStock = v.stockQuantity - v.reservedStock;
        return v;
      }
    }
    throw new Error('Varyant bulunamadı');
  },
  getPartners: (type?: string) => {
    const partners = getActiveStore().partners;
    if (!type || type === 'ALL') return partners;
    return partners.filter((p) => p.type === type || p.type === 'BOTH');
  },
  addPartner: (p: any) => {
    const store = getActiveStore();
    const newPartner = { ...p, id: Date.now(), active: true };
    store.partners = [newPartner, ...store.partners];
    return newPartner;
  },
  getQuotations: (type?: string) => {
    const quotes = getActiveStore().quotations;
    if (!type || type === 'ALL') return quotes;
    return quotes.filter((q) => q.type === type);
  },
  addQuotation: (q: any) => {
    const store = getActiveStore();
    const partner = store.partners.find((p) => p.id === q.partnerId);
    const newQ = {
      ...q,
      id: Date.now(),
      quotationNumber: `QT-2026-000${store.quotations.length + 1}`,
      partnerTitle: partner?.title || 'Bilinmeyen Cari',
      status: 'DRAFT',
      issueDate: new Date().toISOString(),
      totalAmount: q.items.reduce((sum: number, it: any) => sum + it.quantity * it.unitPrice, 0),
    };
    store.quotations = [newQ, ...store.quotations];
    return newQ;
  },
  updateQuotationStatus: (id: number, status: any) => {
    const store = getActiveStore();
    const q = store.quotations.find((item) => item.id === id);
    if (q) {
      q.status = status;
      return q;
    }
    throw new Error('Teklif bulunamadı');
  },
  getOrders: (type?: string) => {
    const orders = getActiveStore().orders;
    if (!type || type === 'ALL') return orders;
    return orders.filter((o) => o.type === type);
  },
  addOrder: (o: any) => {
    const store = getActiveStore();
    const partner = store.partners.find((p) => p.id === o.partnerId);
    const newOrd = {
      ...o,
      id: Date.now(),
      orderNumber: `ORD-2026-000${store.orders.length + 1}`,
      partnerTitle: partner?.title || 'Bilinmeyen Cari',
      status: 'DRAFT',
      orderDate: new Date().toISOString(),
      totalAmount: o.items.reduce((sum: number, it: any) => sum + it.quantity * it.unitPrice, 0),
    };
    store.orders = [newOrd, ...store.orders];
    return newOrd;
  },
  convertQuotationToOrder: (quotationId: number) => {
    const store = getActiveStore();
    const q = store.quotations.find((item) => item.id === quotationId);
    if (!q) throw new Error('Teklif bulunamadı');
    q.status = 'CONVERTED';
    const newOrd = {
      id: Date.now(),
      orderNumber: `ORD-2026-000${store.orders.length + 1}`,
      quotationId: q.id,
      partnerId: q.partnerId,
      partnerTitle: q.partnerTitle,
      type: q.type === 'SALES' ? ('SALES_ORDER' as const) : ('PURCHASE_ORDER' as const),
      status: 'DRAFT' as const,
      orderDate: new Date().toISOString(),
      totalAmount: q.totalAmount,
      notes: `${q.quotationNumber} nolu tekliften aktarıldı.`,
      items: q.items.map((it) => ({ ...it })),
    };
    store.orders = [newOrd, ...store.orders];
    return newOrd;
  },
  updateOrderStatus: (id: number, status: any) => {
    const store = getActiveStore();
    const o = store.orders.find((item) => item.id === id);
    if (o) {
      o.status = status;
      // If confirmed, reserve stock for each item
      if (status === 'CONFIRMED') {
        for (const item of o.items) {
          try {
            mockStore.reserveVariantStock(item.variantId, item.quantity);
          } catch (e) {
            // ignore
          }
        }
      }
      return o;
    }
    throw new Error('Sipariş bulunamadı');
  },
  getWaybills: (type?: string) => {
    const waybills = getActiveStore().waybills;
    if (!type || type === 'ALL') return waybills;
    return waybills.filter((w) => w.type === type);
  },
  createWaybillFromOrder: (orderId: number) => {
    const store = getActiveStore();
    const o = store.orders.find((item) => item.id === orderId);
    if (!o) throw new Error('Sipariş bulunamadı');
    const newWaybill = {
      id: Date.now(),
      waybillNumber: `IRS-2026-000${store.waybills.length + 1}`,
      orderId: o.id,
      orderNumber: o.orderNumber,
      partnerId: o.partnerId,
      partnerTitle: o.partnerTitle,
      type: o.type === 'SALES_ORDER' ? ('DISPATCH' as const) : ('RECEIPT' as const),
      status: 'DRAFT' as const,
      waybillDate: new Date().toISOString(),
      carrierInfo: 'Kurumsal Lojistik Nakliyat',
      items: o.items.map((it) => ({
        variantId: it.variantId,
        variantSku: it.variantSku,
        productName: it.productName,
        quantity: it.quantity,
      })),
    };
    store.waybills = [newWaybill, ...store.waybills];
    return newWaybill;
  },
  updateWaybillStatus: (id: number, status: any) => {
    const store = getActiveStore();
    const w = store.waybills.find((item) => item.id === id);
    if (w) {
      w.status = status;
      if (status === 'DISPATCHED') {
        for (const item of w.items) {
          try {
            // Deduct real stock and release reserve
            mockStore.updateVariantStock(item.variantId, -item.quantity);
          } catch (e) {
            // ignore
          }
        }
      }
      return w;
    }
    throw new Error('İrsaliye bulunamadı');
  },
  getAuditLogs: () => getActiveStore().auditLogs,
};
