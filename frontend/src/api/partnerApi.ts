import { apiClient, apiRequest, mockStore } from './client';
import { BusinessPartner, PartnerType } from '../types';

export const partnerApi = {
  getPartners: async (type?: PartnerType): Promise<BusinessPartner[]> => {
    return apiRequest(
      async () => {
        const res = await apiClient.get<any>('/partners', { params: { type } });
        const raw = res.data && typeof res.data === 'object' && 'data' in res.data ? res.data.data : res.data;
        const list = Array.isArray(raw) ? raw : [];
        const normalized: BusinessPartner[] = list.map((item: any) => ({
          id: item.id,
          code: item.code || `CAR-00${item.id}`,
          title: item.title || item.companyTitle || item.name || 'Cari Hesap',
          type: item.type || item.partnerType || 'CUSTOMER',
          taxNumber: item.taxNumber,
          taxOffice: item.taxOffice,
          email: item.email,
          phone: item.phone,
          address: item.address,
          metadata: item.metadata || {},
          active: item.active !== false,
          createdAt: item.createdAt,
        }));
        return { data: normalized };
      },
      () => mockStore.getPartners(type)
    );
  },

  getPartnerById: async (id: number): Promise<BusinessPartner> => {
    return apiRequest(
      async () => {
        const res = await apiClient.get<any>(`/partners/${id}`);
        const item = res.data && typeof res.data === 'object' && 'data' in res.data ? res.data.data : res.data;
        const normalized: BusinessPartner = {
          id: item.id,
          code: item.code || `CAR-00${item.id}`,
          title: item.title || item.companyTitle || item.name || 'Cari Hesap',
          type: item.type || item.partnerType || 'CUSTOMER',
          taxNumber: item.taxNumber,
          taxOffice: item.taxOffice,
          email: item.email,
          phone: item.phone,
          address: item.address,
          metadata: item.metadata || {},
          active: item.active !== false,
          createdAt: item.createdAt,
        };
        return { data: normalized };
      },
      () => {
        const p = mockStore.getPartners().find((item) => item.id === id);
        if (!p) throw new Error('Cari hesap bulunamadı');
        return p;
      }
    );
  },

  createPartner: async (data: Omit<BusinessPartner, 'id'>): Promise<BusinessPartner> => {
    const payload = {
      ...data,
      name: data.title,
      companyTitle: data.title,
      partnerType: data.type,
    };
    return apiRequest(
      () => apiClient.post<BusinessPartner>('/partners', payload),
      () => mockStore.addPartner(data)
    );
  },
};

